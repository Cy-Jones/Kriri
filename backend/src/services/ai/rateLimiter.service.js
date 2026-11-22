const db = require("../../config/database");

/**
 * Intelligent Rate Limiter & Concurrency Semaphore for OpenRouter AI Subsystem
 * Specifically tuned for OpenRouter Free Tier (50 requests/day hard account limit)
 */
class RateLimiterService {
  constructor() {
    // Sliding window per user: userId -> array of timestamps
    this.userWindows = new Map();
    this.USER_WINDOW_MS = 60 * 1000; // 1 minute
    this.USER_MAX_PER_MINUTE = parseInt(process.env.AI_USER_MAX_PER_MINUTE, 10) || 5;

    // Daily Developer Quota (OpenRouter Free Tier: 50 requests/day)
    this.MASTER_DAILY_LIMIT = parseInt(process.env.OPENROUTER_DAILY_LIMIT, 10) || 50;

    // Concurrency Semaphore (OpenRouter free tier drops simultaneous bursts)
    this.MAX_CONCURRENCY = parseInt(process.env.AI_MAX_CONCURRENCY, 10) || 2;
    this.activeRequests = 0;
    this.waitingQueue = [];
  }

  /**
   * Acquire a concurrency execution slot or wait in FIFO queue
   */
  async acquireConcurrencySlot(timeoutMs = 15000) {
    if (this.activeRequests < this.MAX_CONCURRENCY) {
      this.activeRequests += 1;
      return true;
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waitingQueue.findIndex((item) => item.resolve === resolve);
        if (index !== -1) {
          this.waitingQueue.splice(index, 1);
        }
        reject(new Error("AI Gateway busy: Concurrency queue timeout. Engaging instant fallback."));
      }, timeoutMs);

      this.waitingQueue.push({
        resolve: () => {
          clearTimeout(timeout);
          this.activeRequests += 1;
          resolve(true);
        },
        reject: (err) => {
          clearTimeout(timeout);
          reject(err);
        },
      });
    });
  }

  /**
   * Release concurrency execution slot and wake up next waiting request
   */
  releaseConcurrencySlot() {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    if (this.waitingQueue.length > 0 && this.activeRequests < this.MAX_CONCURRENCY) {
      const nextInLine = this.waitingQueue.shift();
      nextInLine.resolve();
    }
  }

  /**
   * Check if user is exempt from rate limits & quota throttling (main developer testing account)
   */
  isExempt(userId, userEmail = null) {
    const rawEmail = (userEmail || "").trim().toLowerCase();
    if (
      rawEmail.startsWith("smartjones07@gmail") ||
      rawEmail === "smartjones07@gmail.com" ||
      rawEmail.includes("smartjones07")
    ) {
      return true;
    }

    if (process.env.AI_EXEMPT_EMAILS) {
      const exempts = process.env.AI_EXEMPT_EMAILS.split(",").map((e) => e.trim().toLowerCase());
      if (exempts.includes(rawEmail)) return true;
    }

    if (userId === 795 || userId === "795" || userId === "user_3KQ54CSWNImj8PTkQXCGysXShAs") {
      return true;
    }

    return false;
  }

  /**
   * Check user sliding window rate limit
   */
  checkUserRateLimit(userId, userEmail = null) {
    if (!userId) return { allowed: true };

    if (this.isExempt(userId, userEmail)) {
      return { allowed: true, isExempt: true };
    }

    const now = Date.now();
    const timestamps = this.userWindows.get(userId) || [];

    // Filter timestamps within current window
    const validTimestamps = timestamps.filter((ts) => now - ts < this.USER_WINDOW_MS);

    if (validTimestamps.length >= this.USER_MAX_PER_MINUTE) {
      const oldest = validTimestamps[0];
      const waitSeconds = Math.ceil((this.USER_WINDOW_MS - (now - oldest)) / 1000);
      return {
        allowed: false,
        reason: `Rate limit: You are sending requests too quickly. Please wait ${waitSeconds}s before asking again.`,
        retryAfterSec: waitSeconds,
      };
    }

    validTimestamps.push(now);
    this.userWindows.set(userId, validTimestamps);

    // Occasional cleanup of stale entries
    if (this.userWindows.size > 1000) {
      for (const [uid, tsList] of this.userWindows.entries()) {
        const recent = tsList.filter((ts) => now - ts < this.USER_WINDOW_MS);
        if (recent.length === 0) {
          this.userWindows.delete(uid);
        } else {
          this.userWindows.set(uid, recent);
        }
      }
    }

    return { allowed: true };
  }

  /**
   * Check master daily quota (50 requests/day free tier)
   * If workspace provides its own custom OpenRouter key (BYOK) or user is exempt, bypasses the limit.
   */
  async checkMasterDailyQuota(isCustomKey = false, isExempt = false) {
    if (isCustomKey || isExempt) {
      return {
        allowed: true,
        isCustomKey: Boolean(isCustomKey),
        isExempt: Boolean(isExempt),
        limit: isCustomKey ? "unlimited (byok)" : this.MASTER_DAILY_LIMIT,
        usedToday: 0,
        remainingToday: 999999,
      };
    }

    try {
      // Query successful and live requests made today to OpenRouter
      const res = await db.query(
        `SELECT COUNT(*) as used_today 
         FROM ai_usage_logs 
         WHERE request_status IN ('success', 'fallback') 
           AND model_id NOT LIKE 'academic-demo%' 
           AND created_at >= CURRENT_DATE`
      );

      const usedToday = parseInt(res.rows[0]?.used_today, 10) || 0;
      const remainingToday = Math.max(0, this.MASTER_DAILY_LIMIT - usedToday);
      const allowed = usedToday < this.MASTER_DAILY_LIMIT;

      return {
        allowed,
        isCustomKey: false,
        limit: this.MASTER_DAILY_LIMIT,
        usedToday,
        remainingToday,
        percentUsed: Math.min(100, Math.round((usedToday / this.MASTER_DAILY_LIMIT) * 100)),
      };
    } catch (err) {
      console.error("[RateLimiter] Error querying daily usage:", err.message);
      // Fail safe
      return {
        allowed: true,
        isCustomKey: false,
        limit: this.MASTER_DAILY_LIMIT,
        usedToday: 0,
        remainingToday: this.MASTER_DAILY_LIMIT,
        percentUsed: 0,
      };
    }
  }

  getStatus() {
    return {
      activeConcurrency: this.activeRequests,
      maxConcurrency: this.MAX_CONCURRENCY,
      queuedRequests: this.waitingQueue.length,
      masterDailyLimit: this.MASTER_DAILY_LIMIT,
      userMaxPerMinute: this.USER_MAX_PER_MINUTE,
    };
  }
}

module.exports = new RateLimiterService();

