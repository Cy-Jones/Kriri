const db = require("../../config/database");
const { getModelConfigForFeature, normalizeModelParams } = require("./model.registry");
const usageService = require("./usage.service");
const rateLimiter = require("./rateLimiter.service");
const circuitBreaker = require("./circuitBreaker.service");
const { DEMO_RESPONSES } = require("./demo.engine");

// Safeguard 1: In-memory cache for repeated AI responses (5-minute TTL)
const RESPONSE_CACHE = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

class OpenRouterClient {
  constructor() {
    this.baseUrl = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
    this.siteUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    this.appName = "KRIRI Precision Workspace";
  }

  get apiKey() {
    return process.env.OPENROUTER_API_KEY || null;
  }

  get isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 5);
  }

  /**
   * Resolve effective API key for workspace (BYOK vs Developer Master Key)
   */
  async getEffectiveApiKey(workspaceId) {
    if (workspaceId) {
      try {
        const res = await db.query(
          "SELECT custom_api_key FROM ai_model_configs WHERE workspace_id = $1 AND custom_api_key IS NOT NULL AND LENGTH(custom_api_key) > 5",
          [workspaceId]
        );
        if (res.rows.length > 0 && res.rows[0].custom_api_key) {
          return { apiKey: res.rows[0].custom_api_key.trim(), isCustom: true };
        }
      } catch (err) {
        console.warn("[OpenRouter] Failed to query workspace custom API key:", err.message);
      }
    }
    return { apiKey: this.apiKey, isCustom: false };
  }

  /**
   * Helper to generate grounded deterministic fallback content
   */
  _generateGroundedFallback(feature, messages, demoContext = {}) {
    const lastMsg = messages[messages.length - 1]?.content || "";
    if (feature === "task_generator") {
      return JSON.stringify(DEMO_RESPONSES.task_generator(lastMsg, demoContext));
    } else if (feature === "health_score") {
      return JSON.stringify(DEMO_RESPONSES.health_score(demoContext));
    } else if (feature === "reporting") {
      return DEMO_RESPONSES.report(demoContext);
    }
    return DEMO_RESPONSES.assistant(lastMsg, demoContext);
  }

  /**
   * Fetch live account balance and rate-limit metadata from OpenRouter
   */
  async getLiveAccountInfo(customKey = null) {
    const keyToUse = customKey || this.apiKey;
    if (!keyToUse || keyToUse.trim().length <= 5) return null;
    try {
      const res = await fetch(`${this.baseUrl}/auth/key`, {
        headers: { Authorization: `Bearer ${keyToUse}` },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.data || null;
    } catch (err) {
      console.warn("[OpenRouter] Failed to fetch live account info:", err.message);
      return null;
    }
  }

  /**
   * Standard Chat Completion with Guardrails, Rate Limiter, Concurrency Queue & Circuit Breaker
   */
  async chatCompletion({
    feature = "assistant",
    messages = [],
    workspaceId,
    userId,
    userEmail,
    conversationId,
    temperature,
    max_tokens,
    tools,
    tool_choice,
    response_format,
    demoContext = {},
  }) {
    const startTime = Date.now();
    const isExempt = rateLimiter.isExempt(userId, userEmail);
    const historySig = messages
      .slice(-3)
      .map((m) => `${m.role || "user"}:${(m.content || "").trim().slice(0, 100)}`)
      .join("||");
    const lastUserMsg = messages[messages.length - 1]?.content?.trim() || "";
    const cacheKey = `${feature}:${workspaceId || 0}:${conversationId || "conv"}:${historySig.toLowerCase()}`;

    // Safeguard 1: Cache repeated queries to prevent redundant API calls
    if (!tools && lastUserMsg && RESPONSE_CACHE.has(cacheKey)) {
      const cached = RESPONSE_CACHE.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return {
          ...cached.data,
          is_cached: true,
          latencyMs: 8,
        };
      }
      RESPONSE_CACHE.delete(cacheKey);
    }

    // Safeguard 1b: Workspace Token Budget Check (skipped for exempt test user)
    if (workspaceId) {
      const budgetCheck = await usageService.checkDailyBudget(workspaceId, userEmail, userId);
      if (!budgetCheck.allowed) {
        console.warn("[OpenRouter] Daily workspace budget reached. Degrading gracefully to grounded workspace response.");
        const demoContent = this._generateGroundedFallback(feature, messages, demoContext);
        return {
          content: demoContent,
          model: "grounded-workspace-engine",
          usage: { prompt_tokens: 100, completion_tokens: 250, total_tokens: 350 },
          latencyMs: 15,
          is_demo: true,
        };
      }
    }

    // Safeguard 2: User-level Sliding Window Rate Limit (e.g. 5 req/min, skipped for exempt test user)
    if (userId) {
      const userRate = rateLimiter.checkUserRateLimit(userId, userEmail);
      if (!userRate.allowed) {
        console.warn(`[OpenRouter] User ${userId} (${userEmail}) exceeded rate limit. ${userRate.reason}`);
        return {
          content: userRate.reason,
          model: "system-rate-limiter",
          usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
          latencyMs: 1,
          is_rate_limited: true,
          retryAfterSec: userRate.retryAfterSec,
        };
      }
    }

    // Resolve API key (BYOK vs Developer Master Key)
    const { apiKey: effectiveKey, isCustom } = await this.getEffectiveApiKey(workspaceId);

    // Safeguard 3: If no API key configured, use local demonstration engine
    if (!effectiveKey || effectiveKey.trim().length <= 5) {
      const latencyMs = Math.floor(Math.random() * 200) + 120;
      const demoContent = this._generateGroundedFallback(feature, messages, demoContext);
      const inputTokens = messages.reduce((acc, m) => acc + Math.ceil((m.content || "").length / 4), 0);
      const outputTokens = Math.ceil(demoContent.length / 4);

      if (workspaceId) {
        await usageService.logUsage({
          workspaceId,
          userId,
          modelId: "academic-demo-fallback",
          feature,
          inputTokens,
          outputTokens,
          latencyMs,
          status: "demo_fallback",
        });
      }

      return {
        content: demoContent,
        model: "academic-demo-fallback",
        usage: { prompt_tokens: inputTokens, completion_tokens: outputTokens, total_tokens: inputTokens + outputTokens },
        latencyMs,
        is_demo: true,
      };
    }

    // Safeguard 4: Master Daily 50-Request Quota Check (Developer Free Tier Protection, skipped for exempt test user)
    const masterQuota = await rateLimiter.checkMasterDailyQuota(isCustom, isExempt);
    if (!masterQuota.allowed) {
      console.warn(
        `[OpenRouter] Master daily free-tier limit (${masterQuota.limit} req/day) reached (${masterQuota.usedToday} used). Engaging deterministic fallback.`
      );
      const demoContent = this._generateGroundedFallback(feature, messages, demoContext);
      const inputTokens = 100;
      const outputTokens = 250;

      if (workspaceId) {
        await usageService.logUsage({
          workspaceId,
          userId,
          modelId: "grounded-workspace-engine",
          feature,
          inputTokens,
          outputTokens,
          latencyMs: 12,
          status: "quota_fallback",
        });
      }

      return {
        content: demoContent,
        model: "grounded-workspace-engine",
        usage: { prompt_tokens: inputTokens, completion_tokens: outputTokens, total_tokens: inputTokens + outputTokens },
        latencyMs: 12,
        is_demo: true,
        quota_exceeded: true,
      };
    }

    // Safeguard 5: Circuit Breaker Check (Fast-circuit if upstream is in 429 or outage)
    const circuit = circuitBreaker.canExecute();
    if (!circuit.allowed) {
      console.warn(`[OpenRouter] Circuit breaker is OPEN (${circuit.reason}). Fast-circuiting to grounded engine.`);
      const demoContent = this._generateGroundedFallback(feature, messages, demoContext);
      return {
        content: demoContent,
        model: "grounded-workspace-engine",
        usage: { prompt_tokens: 100, completion_tokens: 250, total_tokens: 350 },
        latencyMs: 8,
        is_demo: true,
        circuit_open: true,
      };
    }

    // Safeguard 6: Acquire Concurrency Slot (Max 2 simultaneous calls to avoid 429 drops)
    let acquiredConcurrency = false;
    try {
      await rateLimiter.acquireConcurrencySlot(10000);
      acquiredConcurrency = true;
    } catch (concurrencyErr) {
      console.warn("[OpenRouter] Concurrency queue timeout. Returning instant grounded response.");
      const demoContent = this._generateGroundedFallback(feature, messages, demoContext);
      return {
        content: demoContent,
        model: "grounded-workspace-engine",
        usage: { prompt_tokens: 50, completion_tokens: 150, total_tokens: 200 },
        latencyMs: 20,
        is_demo: true,
      };
    }

    const config = getModelConfigForFeature(feature);
    const candidateModels = Array.from(
      new Set(
        [
          config.primary,
          config.fallback,
          config.tertiary,
          "nvidia/nemotron-3.5-super-vl:free",
          "recursive/flint-v1.0:free",
        ].filter(Boolean)
      )
    );

    let lastError = null;

    try {
      // Live OpenRouter Model Execution with Candidate Chain
      for (const modelId of candidateModels) {
        try {
          const payload = normalizeModelParams(modelId, {
            messages,
            temperature: typeof temperature === "number" ? temperature : config.temperature,
            max_tokens: max_tokens || 4096,
            tools,
            tool_choice,
            response_format,
          });

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout

          const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${effectiveKey}`,
              "HTTP-Referer": this.siteUrl,
              "X-Title": this.appName,
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            const errMsg = errData.error?.message || `HTTP ${response.status} from ${modelId}`;
            console.warn(`[OpenRouter] Model ${modelId} returned error: ${errMsg}`);
            lastError = new Error(errMsg);

            // Record failure in circuit breaker
            circuitBreaker.recordFailure(lastError, response.status);

            // If 429 (Rate Limit) or 402 (Quota/Payment Required), STOP immediately to save quota
            if (response.status === 429 || response.status === 402) {
              console.warn(`[OpenRouter] Upstream account limit hit (${response.status}). Fast-circuiting immediately.`);
              break;
            }

            continue; // Fallback to next candidate model
          }

          const data = await response.json();
          const choice = data.choices && data.choices[0];
          let content = choice?.message?.content || "";
          const toolCalls = choice?.message?.tool_calls || null;
          if (!content && choice?.message?.reasoning && !toolCalls) {
            content = choice.message.reasoning;
          }
          const latencyMs = Date.now() - startTime;
          const usage = data.usage || {
            prompt_tokens: Math.ceil(JSON.stringify(messages).length / 4),
            completion_tokens: Math.ceil(content.length / 4),
            total_tokens: 0,
          };
          usage.total_tokens = (usage.prompt_tokens || 0) + (usage.completion_tokens || 0);

          // Record healthy call in circuit breaker
          circuitBreaker.recordSuccess();

          if (workspaceId) {
            await usageService.logUsage({
              workspaceId,
              userId,
              modelId: data.model || modelId,
              feature,
              inputTokens: usage.prompt_tokens,
              outputTokens: usage.completion_tokens,
              latencyMs,
              status: "success",
            });
          }

          const resPayload = {
            content,
            reasoning: choice?.message?.reasoning || null,
            tool_calls: toolCalls,
            model: data.model || modelId,
            usage,
            latencyMs,
            is_demo: false,
          };

          // Cache successful response (Safeguard 1)
          if (!tools && lastUserMsg) {
            RESPONSE_CACHE.set(cacheKey, { timestamp: Date.now(), data: resPayload });
            if (RESPONSE_CACHE.size > 100) {
              const oldestKey = RESPONSE_CACHE.keys().next().value;
              RESPONSE_CACHE.delete(oldestKey);
            }
          }

          return resPayload;
        } catch (err) {
          console.warn(`[OpenRouter] Connection error with model ${modelId}:`, err.message);
          circuitBreaker.recordFailure(err);
          lastError = err;
        }
      }
    } finally {
      if (acquiredConcurrency) {
        rateLimiter.releaseConcurrencySlot();
      }
    }

    // Graceful degradation when all upstream attempts failed
    console.warn("[OpenRouter] All live models exhausted or rate-limited. Engaging grounded fallback.");
    const latencyMs = Date.now() - startTime;
    const demoContent = this._generateGroundedFallback(feature, messages, demoContext);

    if (workspaceId) {
      await usageService.logUsage({
        workspaceId,
        userId,
        modelId: "grounded-workspace-engine",
        feature,
        inputTokens: 100,
        outputTokens: 250,
        latencyMs,
        status: "fallback",
        errorMessage: lastError?.message,
      });
    }

    return {
      content: demoContent,
      model: "grounded-workspace-engine",
      usage: { prompt_tokens: 100, completion_tokens: 250, total_tokens: 350 },
      latencyMs,
      is_demo: true,
      error_note: lastError?.message,
    };
  }

  /**
   * Server-Sent Events (SSE) Streaming Completion with Guardrails & Circuit Breaker
   */
  async streamChatCompletion({
    feature = "assistant",
    messages = [],
    res,
    workspaceId,
    userId,
    userEmail,
    temperature,
    demoContext = {},
  }) {
    const startTime = Date.now();
    const isExempt = rateLimiter.isExempt(userId, userEmail);
    const config = getModelConfigForFeature(feature);
    const modelId = config.primary;

    // Headers for SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Helper to stream grounded fallback
    const streamFallback = async (prefixNote = "") => {
      const demoText = (prefixNote ? `${prefixNote}\n\n` : "") + this._generateGroundedFallback(feature, messages, demoContext);
      const words = demoText.split(" ");
      for (const word of words) {
        res.write(`data: ${JSON.stringify({ text: word + " ", is_demo: true })}\n\n`);
        await new Promise((r) => setTimeout(r, 20));
      }
      res.write(`data: [DONE]\n\n`);
      res.end();

      if (workspaceId) {
        await usageService.logUsage({
          workspaceId,
          userId,
          modelId: "grounded-workspace-engine",
          feature,
          inputTokens: 80,
          outputTokens: 220,
          latencyMs: Date.now() - startTime,
          status: "demo_stream",
        });
      }
    };

    // User rate limit check (skipped for exempt test user)
    if (userId) {
      const userRate = rateLimiter.checkUserRateLimit(userId, userEmail);
      if (!userRate.allowed) {
        res.write(`data: ${JSON.stringify({ text: userRate.reason, is_rate_limited: true })}\n\n`);
        res.write(`data: [DONE]\n\n`);
        return res.end();
      }
    }

    const { apiKey: effectiveKey, isCustom } = await this.getEffectiveApiKey(workspaceId);

    // If not configured, stream grounded fallback
    if (!effectiveKey || effectiveKey.trim().length <= 5) {
      return streamFallback();
    }

    // Daily Master 50-Request Quota Check (skipped for exempt test user)
    const masterQuota = await rateLimiter.checkMasterDailyQuota(isCustom, isExempt);
    if (!masterQuota.allowed) {
      return streamFallback("*(Daily free-tier request limit reached — grounded engine active)*");
    }

    // Circuit Breaker Check
    const circuit = circuitBreaker.canExecute();
    if (!circuit.allowed) {
      return streamFallback("*(AI gateway recovering from rate limit — grounded engine active)*");
    }

    // Acquire Concurrency Slot
    let acquiredSlot = false;
    try {
      await rateLimiter.acquireConcurrencySlot(10000);
      acquiredSlot = true;
    } catch (err) {
      return streamFallback("*(AI gateway busy — grounded engine active)*");
    }

    try {
      const payload = normalizeModelParams(modelId, {
        messages,
        temperature: typeof temperature === "number" ? temperature : config.temperature,
        stream: true,
      });
      payload.stream = true;

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${effectiveKey}`,
          "HTTP-Referer": this.siteUrl,
          "X-Title": this.appName,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        circuitBreaker.recordFailure(new Error(`HTTP ${response.status}`), response.status);
        throw new Error(`OpenRouter HTTP ${response.status}`);
      }

      circuitBreaker.recordSuccess();

      let accumulatedContent = "";
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;
          if (trimmed === "data: [DONE]") {
            res.write(`data: [DONE]\n\n`);
            continue;
          }

          try {
            const parsed = JSON.parse(trimmed.slice(5).trim());
            const delta = parsed.choices?.[0]?.delta?.content || "";
            if (delta) {
              accumulatedContent += delta;
              res.write(`data: ${JSON.stringify({ text: delta })}\n\n`);
            }
          } catch (e) {
            // Ignore parse errors on chunk fragments
          }
        }
      }

      res.end();

      if (workspaceId) {
        await usageService.logUsage({
          workspaceId,
          userId,
          modelId,
          feature,
          inputTokens: Math.ceil(JSON.stringify(messages).length / 4),
          outputTokens: Math.ceil(accumulatedContent.length / 4),
          latencyMs: Date.now() - startTime,
          status: "success",
        });
      }
    } catch (err) {
      console.warn("[OpenRouter Stream Error]:", err.message);
      const fallbackText = "\n\n*(Switched to grounded workspace stream)*\n" + this._generateGroundedFallback(feature, messages, demoContext);
      res.write(`data: ${JSON.stringify({ text: fallbackText, is_demo: true })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();
    } finally {
      if (acquiredSlot) {
        rateLimiter.releaseConcurrencySlot();
      }
    }
  }
}

module.exports = new OpenRouterClient();
