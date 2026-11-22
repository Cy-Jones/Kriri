/**
 * Model Registry for KRIRI Intelligence Engine
 * Configures verified free-tier models on OpenRouter, fallback tiers, and capability flags.
 */

const MODEL_REGISTRY = {
  // Conversational Project Assistant
  assistant: {
    primary: "nvidia/nemotron-3.5-super-vl:free",
    fallback: "recursive/flint-v1.0:free",
    tertiary: "google/gemma-4-26b-a4b-it:free",
    contextLength: 1000000,
    temperature: 0.3,
    supportsSystemPrompt: true,
  },

  // Agentic Workflows & Tool Calling
  agent: {
    primary: "nvidia/nemotron-3.5-super-vl:free",
    fallback: "recursive/flint-v1.0:free",
    tertiary: "xingchen-agi/xing4.0-29b-a4b:free",
    contextLength: 1000000,
    temperature: 0.2,
    supportsTools: true,
  },

  // Natural Language Task Generation & Decomposition
  task_generator: {
    primary: "recursive/flint-v1.0:free",
    fallback: "nvidia/nemotron-3.5-super-vl:free",
    tertiary: "google/gemma-4-26b-a4b-it:free",
    contextLength: 262144,
    temperature: 0.2,
    responseFormatJson: true,
  },

  // Document Intelligence & RAG
  rag: {
    primary: "nvidia/nemotron-3.5-super-vl:free",
    fallback: "recursive/flint-v1.0:free",
    contextLength: 1000000,
    temperature: 0.1,
  },

  // Health Scoring Explanations & Risk Analysis
  health_score: {
    primary: "nvidia/nemotron-3.5-super-vl:free",
    fallback: "recursive/flint-v1.0:free",
    tertiary: "google/gemma-4-31b-it:free",
    contextLength: 1000000,
    temperature: 0.2,
  },

  // Executive Reports
  reporting: {
    primary: "nvidia/nemotron-3.5-super-vl:free",
    fallback: "recursive/flint-v1.0:free",
    tertiary: "google/gemma-4-26b-a4b-it:free",
    contextLength: 1000000,
    temperature: 0.3,
  },
};

function sanitizeMessages(messages = []) {
  if (!Array.isArray(messages) || messages.length === 0) return [];
  const sanitized = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg || !msg.role) continue;

    // Handle system message (always keep at index 0)
    if (msg.role === "system") {
      if (sanitized.length === 0) {
        sanitized.push({ role: "system", content: msg.content || "" });
      } else {
        sanitized[0].content += `\n\n${msg.content || ""}`;
      }
      continue;
    }

    // Merge consecutive messages with the same role (e.g. user after user) to prevent provider 400 errors
    const prev = sanitized[sanitized.length - 1];
    if (prev && prev.role === msg.role && msg.role === "user" && !prev.tool_calls) {
      prev.content = `${prev.content}\n\n${msg.content || ""}`.trim();
      continue;
    }

    sanitized.push(msg);
  }

  return sanitized;
}

/**
 * Filter and format parameters to ensure compatibility with specific free models.
 */
function normalizeModelParams(modelId, rawParams = {}) {
  const safeParams = {
    model: modelId,
    messages: sanitizeMessages(rawParams.messages || []),
    temperature: typeof rawParams.temperature === "number" ? rawParams.temperature : 0.3,
    max_tokens: rawParams.max_tokens || 4096,
  };

  if (rawParams.tools && Array.isArray(rawParams.tools) && rawParams.tools.length > 0) {
    safeParams.tools = rawParams.tools;
    if (rawParams.tool_choice) {
      safeParams.tool_choice = rawParams.tool_choice;
    }
  }

  if (rawParams.response_format) {
    safeParams.response_format = rawParams.response_format;
  }

  return safeParams;
}

function getModelConfigForFeature(feature) {
  return MODEL_REGISTRY[feature] || MODEL_REGISTRY.assistant;
}

module.exports = {
  MODEL_REGISTRY,
  normalizeModelParams,
  getModelConfigForFeature,
};

