/**
 * Circuit Breaker for External AI Gateway (OpenRouter)
 * Prevents cascading timeouts and quota burn during outages, 429s, or credit exhaustion.
 */
class CircuitBreakerService {
  constructor() {
    this.state = "CLOSED"; // CLOSED | OPEN | HALF_OPEN
    this.failureCount = 0;
    this.failureThreshold = 3;
    this.lastFailureTime = null;
    this.cooldownPeriodMs = 60 * 1000; // 60s cooldown for 429/timeouts
    this.hardQuotaCooldownMs = 15 * 60 * 1000; // 15m cooldown for 402/quota exhaustion
    this.currentCooldownMs = this.cooldownPeriodMs;
    this.lastTripReason = null;
  }

  /**
   * Check whether circuit allows executing an upstream request
   */
  canExecute() {
    if (this.state === "CLOSED") return { allowed: true };

    const now = Date.now();
    const timeSinceFailure = now - (this.lastFailureTime || 0);

    if (timeSinceFailure > this.currentCooldownMs) {
      // Transition to HALF_OPEN to attempt one probe request
      this.state = "HALF_OPEN";
      console.log("[CircuitBreaker] Cooldown expired. Testing upstream in HALF_OPEN state.");
      return { allowed: true, halfOpen: true };
    }

    const remainingSec = Math.ceil((this.currentCooldownMs - timeSinceFailure) / 1000);
    return {
      allowed: false,
      reason: this.lastTripReason || "OpenRouter gateway circuit is currently open.",
      cooldownRemainingSec: remainingSec,
    };
  }

  /**
   * Record a successful call to close the circuit
   */
  recordSuccess() {
    this.failureCount = 0;
    this.state = "CLOSED";
    this.lastTripReason = null;
    this.currentCooldownMs = this.cooldownPeriodMs;
  }

  /**
   * Record a failure and trip circuit if threshold reached or if 429/402
   */
  recordFailure(error, statusCode = null) {
    this.lastFailureTime = Date.now();
    const isRateLimit = statusCode === 429 || (error && /429|rate limit/i.test(error.message || ""));
    const isQuotaExhausted = statusCode === 402 || (error && /402|credit|quota/i.test(error.message || ""));

    if (isQuotaExhausted) {
      this.state = "OPEN";
      this.currentCooldownMs = this.hardQuotaCooldownMs;
      this.lastTripReason = "OpenRouter daily quota or credit limit reached (HTTP 402).";
      console.warn(`[CircuitBreaker] Tripped to OPEN (Quota exhausted). Cooldown: ${this.currentCooldownMs / 1000}s`);
      return;
    }

    if (isRateLimit) {
      this.state = "OPEN";
      this.currentCooldownMs = this.cooldownPeriodMs;
      this.lastTripReason = "OpenRouter rate limit hit (HTTP 429). Fast-circuiting to deterministic fallback.";
      console.warn(`[CircuitBreaker] Tripped to OPEN (Rate limit). Cooldown: ${this.currentCooldownMs / 1000}s`);
      return;
    }

    this.failureCount += 1;
    if (this.failureCount >= this.failureThreshold || this.state === "HALF_OPEN") {
      this.state = "OPEN";
      this.currentCooldownMs = this.cooldownPeriodMs;
      this.lastTripReason = `Multiple upstream failures (${this.failureCount}): ${error?.message || "Unknown error"}`;
      console.warn(`[CircuitBreaker] Tripped to OPEN after ${this.failureCount} failures. Cooldown: ${this.currentCooldownMs / 1000}s`);
    }
  }

  getStatus() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      cooldownRemainingSec:
        this.state === "OPEN" && this.lastFailureTime
          ? Math.max(0, Math.ceil((this.currentCooldownMs - (Date.now() - this.lastFailureTime)) / 1000))
          : 0,
      lastTripReason: this.lastTripReason,
    };
  }

  reset() {
    this.state = "CLOSED";
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.lastTripReason = null;
    this.currentCooldownMs = this.cooldownPeriodMs;
  }
}

module.exports = new CircuitBreakerService();

