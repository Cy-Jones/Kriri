const assert = require("assert");
const { describe, it, after } = require("node:test");
const { MODEL_REGISTRY, normalizeModelParams } = require("../src/services/ai/model.registry");
const openRouterClient = require("../src/services/ai/openrouter.client");
const analyticsEngine = require("../src/services/ai/analytics.engine");
const ragService = require("../src/services/ai/rag.service");
const agentService = require("../src/services/ai/agent.service");

describe("KRIRI AI Intelligence Subsystem Suite", () => {
  it("should have verified free-tier models in the registry", () => {
    assert.ok(MODEL_REGISTRY.assistant.primary.includes(":free"));
    assert.ok(MODEL_REGISTRY.task_generator.primary.includes(":free"));
    assert.ok(MODEL_REGISTRY.rag.primary.includes(":free"));
  });

  it("should normalize model parameters without invalid fields", () => {
    const raw = {
      messages: [{ role: "user", content: "hello" }],
      unsupported_field: "invalid",
      temperature: 0.5,
    };
    const normalized = normalizeModelParams("test-model", raw);
    assert.strictEqual(normalized.model, "test-model");
    assert.strictEqual(normalized.temperature, 0.5);
    assert.strictEqual(normalized.unsupported_field, undefined);
  });

  it("should execute deterministic project health calculation", async () => {
    const db = require("../src/config/database");
    const projRes = await db.query("SELECT id, workspace_id FROM projects WHERE workspace_id IS NOT NULL LIMIT 1");
    if (projRes.rows.length === 0) return;
    const { id, workspace_id } = projRes.rows[0];

    const health = await analyticsEngine.computeProjectHealth(id, workspace_id);
    assert.ok(typeof health.healthScore === "number");
    assert.ok(health.healthScore >= 0 && health.healthScore <= 100);
    assert.ok(["On Track", "At Risk", "Off Track"].includes(health.healthStatus));
    assert.ok(Array.isArray(health.risks));
  });

  it("should compute team workload metrics across workspace members", async () => {
    const workload = await analyticsEngine.computeTeamWorkload(1);
    assert.ok(Array.isArray(workload.members));
    assert.ok(typeof workload.summary.balanceIndex === "number");
  });

  it("should chunk documents and compute normalized semantic vectors", () => {
    const text = "Authentication architecture with JWT token rotation and PKCE verification flow across clients.";
    const chunks = ragService.chunkText(text, 50, 10);
    assert.ok(chunks.length >= 1);

    const vec = ragService.generateSemanticVector(chunks[0], 32);
    assert.strictEqual(vec.length, 32);

    const similarity = ragService.cosineSimilarity(vec, vec);
    assert.ok(similarity >= 0.99); // Self similarity should be 1.0
  });

  it("should correctly identify state-modifying tools requiring human approval", () => {
    assert.strictEqual(agentService.isModifyingTool("create_task"), true);
    assert.strictEqual(agentService.isModifyingTool("update_task"), true);
    assert.strictEqual(agentService.isModifyingTool("get_project_overview"), false);
    assert.strictEqual(agentService.isModifyingTool("get_team_workload"), false);
  });

  it("should fall back gracefully to demo response when API key is missing or quota reached", async () => {
    const origKey = process.env.OPENROUTER_API_KEY;
    try {
      delete process.env.OPENROUTER_API_KEY;
      const res = await openRouterClient.chatCompletion({
        feature: "task_generator",
        messages: [{ role: "user", content: "Create an auth task" }],
      });
      assert.ok(res.content);
      assert.strictEqual(res.is_demo, true);
    } finally {
      process.env.OPENROUTER_API_KEY = origKey;
    }
  });

  after(async () => {
    const db = require("../src/config/database");
    await db.pool.end();
  });
});
