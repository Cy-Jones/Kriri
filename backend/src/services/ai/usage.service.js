const db = require("../../config/database");
const rateLimiter = require("./rateLimiter.service");

/**
 * AI Usage & Observability Accounting Service
 */
class UsageService {
  /**
   * Log an AI generation event to PostgreSQL
   */
  async logUsage({
    workspaceId,
    userId,
    modelId,
    feature,
    inputTokens = 0,
    outputTokens = 0,
    latencyMs = 0,
    status = "success",
    errorMessage = null,
  }) {
    if (!workspaceId) return null;

    try {
      const totalTokens = (inputTokens || 0) + (outputTokens || 0);
      const estimatedCost = 0.000000; // Free models gateway

      const res = await db.query(
        `INSERT INTO ai_usage_logs (
          workspace_id, user_id, model_id, feature, input_tokens, output_tokens, total_tokens, estimated_cost, latency_ms, request_status, error_message
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [
          workspaceId,
          userId || null,
          modelId,
          feature || "general",
          inputTokens,
          outputTokens,
          totalTokens,
          estimatedCost,
          latencyMs,
          status,
          errorMessage,
        ]
      );
      return res.rows[0];
    } catch (err) {
      console.error("Failed to log AI usage:", err.message);
      return null;
    }
  }

  /**
   * Check if workspace has exceeded its daily token budget (exempt for main testing user)
   */
  async checkDailyBudget(workspaceId, userEmail = null, userId = null) {
    if (rateLimiter.isExempt(userId, userEmail)) {
      return { allowed: true, currentUsage: 0, budget: 250000, isExempt: true };
    }
    if (!workspaceId) return { allowed: true, currentUsage: 0, budget: 250000 };

    try {
      // 1. Get workspace config
      const configRes = await db.query(
        "SELECT daily_token_budget, is_enabled FROM ai_model_configs WHERE workspace_id = $1",
        [workspaceId]
      );
      const isEnabled = configRes.rows.length > 0 ? configRes.rows[0].is_enabled : true;
      const budget = configRes.rows.length > 0 ? configRes.rows[0].daily_token_budget : 250000;

      if (!isEnabled) {
        return { allowed: false, reason: "AI subsystem is disabled in workspace settings.", currentUsage: 0, budget };
      }

      // 2. Compute today's tokens
      const usageRes = await db.query(
        `SELECT COALESCE(SUM(total_tokens), 0) as today_tokens, COUNT(*) as request_count 
         FROM ai_usage_logs 
         WHERE workspace_id = $1 AND created_at >= CURRENT_DATE`,
        [workspaceId]
      );

      const currentUsage = parseInt(usageRes.rows[0].today_tokens, 10) || 0;
      const allowed = currentUsage < budget;

      return {
        allowed,
        currentUsage,
        budget,
        requestsToday: parseInt(usageRes.rows[0].request_count, 10) || 0,
      };
    } catch (err) {
      console.error("Budget check error:", err.message);
      return { allowed: true, currentUsage: 0, budget: 250000 };
    }
  }

  /**
   * Get aggregated usage metrics for the AI Analytics Dashboard
   */
  async getWorkspaceUsageStats(workspaceId) {
    if (!workspaceId) return {};

    try {
      const summary = await db.query(
        `SELECT 
           COUNT(*) as total_requests,
           COALESCE(SUM(total_tokens), 0) as total_tokens,
           COALESCE(SUM(input_tokens), 0) as input_tokens,
           COALESCE(SUM(output_tokens), 0) as output_tokens,
           COALESCE(AVG(latency_ms), 0)::integer as avg_latency_ms,
           COUNT(*) FILTER (WHERE request_status != 'success') as failed_requests
         FROM ai_usage_logs 
         WHERE workspace_id = $1`,
        [workspaceId]
      );

      const byModel = await db.query(
        `SELECT model_id, COUNT(*) as requests, SUM(total_tokens) as tokens
         FROM ai_usage_logs
         WHERE workspace_id = $1
         GROUP BY model_id
         ORDER BY requests DESC`,
        [workspaceId]
      );

      const byFeature = await db.query(
        `SELECT feature, COUNT(*) as requests, SUM(total_tokens) as tokens
         FROM ai_usage_logs
         WHERE workspace_id = $1
         GROUP BY feature
         ORDER BY requests DESC`,
        [workspaceId]
      );

      const recentLogs = await db.query(
        `SELECT id, model_id, feature, total_tokens, latency_ms, request_status, created_at
         FROM ai_usage_logs
         WHERE workspace_id = $1
         ORDER BY created_at DESC
         LIMIT 25`,
        [workspaceId]
      );

      return {
        summary: summary.rows[0] || {},
        byModel: byModel.rows || [],
        byFeature: byFeature.rows || [],
        recentLogs: recentLogs.rows || [],
      };
    } catch (err) {
      console.error("Error retrieving usage stats:", err.message);
      return {};
    }
  }
}

module.exports = new UsageService();

