const { describe, it } = require("node:test");
const assert = require("node:assert");
const rateLimiter = require("../src/services/ai/rateLimiter.service");
const circuitBreaker = require("../src/services/ai/circuitBreaker.service");

describe("AI Gateway Resilience & Overload Protection Suite", () => {
  it("RateLimiter: enforces user sliding window limit", () => {
    const testUserId = "user_test_resilience_99";
    // First requests up to USER_MAX_PER_MINUTE (5) should be allowed
    for (let i = 0; i < rateLimiter.USER_MAX_PER_MINUTE; i++) {
      const res = rateLimiter.checkUserRateLimit(testUserId);
      assert.strictEqual(res.allowed, true, `Request ${i + 1} should be allowed`);
    }

    // 6th request within same window must be rejected
    const blockedRes = rateLimiter.checkUserRateLimit(testUserId);
    assert.strictEqual(blockedRes.allowed, false);
    assert.match(blockedRes.reason, /sending requests too quickly/);
  });

  it("RateLimiter: allows BYOK keys to bypass master daily quota", async () => {
    const byokCheck = await rateLimiter.checkMasterDailyQuota(true);
    assert.strictEqual(byokCheck.allowed, true);
    assert.strictEqual(byokCheck.isCustomKey, true);
    assert.strictEqual(byokCheck.remainingToday, 999999);
  });

  it("RateLimiter: tracks concurrency semaphore correctly", async () => {
    const initial = rateLimiter.getStatus();
    assert.strictEqual(initial.activeConcurrency, 0);

    // Acquire slot 1
    const acquired1 = await rateLimiter.acquireConcurrencySlot(1000);
    assert.strictEqual(acquired1, true);
    assert.strictEqual(rateLimiter.getStatus().activeConcurrency, 1);

    // Release slot 1
    rateLimiter.releaseConcurrencySlot();
    assert.strictEqual(rateLimiter.getStatus().activeConcurrency, 0);
  });

  it("CircuitBreaker: starts in CLOSED state and allows execution", () => {
    circuitBreaker.reset();
    const status = circuitBreaker.canExecute();
    assert.strictEqual(status.allowed, true);
    assert.strictEqual(circuitBreaker.state, "CLOSED");
  });

  it("CircuitBreaker: trips to OPEN immediately upon HTTP 429", () => {
    circuitBreaker.reset();
    circuitBreaker.recordFailure(new Error("Rate limit hit"), 429);
    assert.strictEqual(circuitBreaker.state, "OPEN");

    const status = circuitBreaker.canExecute();
    assert.strictEqual(status.allowed, false);
    assert.match(status.reason, /HTTP 429/);
  });

  it("CircuitBreaker: trips to OPEN immediately upon HTTP 402 (quota exhausted)", () => {
    circuitBreaker.reset();
    circuitBreaker.recordFailure(new Error("Payment/Credit required"), 402);
    assert.strictEqual(circuitBreaker.state, "OPEN");

    const status = circuitBreaker.canExecute();
    assert.strictEqual(status.allowed, false);
    assert.match(status.reason, /HTTP 402/);
  });

  it("CircuitBreaker: resets to CLOSED upon recorded success", () => {
    circuitBreaker.recordSuccess();
    assert.strictEqual(circuitBreaker.state, "CLOSED");
    assert.strictEqual(circuitBreaker.canExecute().allowed, true);
  });

  it("RateLimiter: exempts developer test account smartjones07@gmail from rate limits and quota", async () => {
    const exemptEmail = "smartjones07@gmail.com";
    const exemptUserId = 795;

    // Verify rate limit is bypassed even after 20 continuous calls
    for (let i = 0; i < 20; i++) {
      const res = rateLimiter.checkUserRateLimit(exemptUserId, exemptEmail);
      assert.strictEqual(res.allowed, true, `Exempt call ${i + 1} must be allowed`);
      assert.strictEqual(res.isExempt, true);
    }

    // Verify master daily quota bypass for exempt user
    const quotaRes = await rateLimiter.checkMasterDailyQuota(false, true);
    assert.strictEqual(quotaRes.allowed, true);
    assert.strictEqual(quotaRes.isExempt, true);
    assert.strictEqual(quotaRes.remainingToday, 999999);
  });
});

