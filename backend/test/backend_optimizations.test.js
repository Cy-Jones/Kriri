const { test } = require("node:test");
const assert = require("node:assert");
const db = require("../src/config/database");
const projectController = require("../src/controllers/project.controller");
const taskController = require("../src/controllers/task.controller");
const workspaceController = require("../src/controllers/workspace.controller");

test("KRIRI Backend & Database Optimization Suite", async (t) => {
  // 1. Setup isolated test data
  const userRes = await db.query(
    "INSERT INTO users (clerk_user_id, name, email) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name RETURNING *",
    [`clerk_test_opt_${Date.now()}`, "Optimization Tester", `opt_${Date.now()}@test.com`],
  );
  const user = userRes.rows[0];

  const wsRes = await db.query(
    "INSERT INTO workspaces (name, slug, owner_id) VALUES ($1, $2, $3) RETURNING *",
    ["Opt Workspace", `opt-ws-${Date.now()}`, user.id],
  );
  const ws = wsRes.rows[0];

  const projRes = await db.query(
    "INSERT INTO projects (workspace_id, name, slug, identifier, lead_id, status, health) VALUES ($1, 'Opt Project', $2, 'OPT', $3, 'In Progress', 'On Track') RETURNING *",
    [ws.id, `opt-proj-${Date.now()}`, user.id],
  );
  const proj = projRes.rows[0];

  const taskRes = await db.query(
    "INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, reporter_id) VALUES ($1, 'Opt Task Title', 'A massive 10KB rich markdown description that should not be in bulk list', 'In Progress', 'High', NOW() + INTERVAL '2 days', $2, $3) RETURNING *",
    [proj.id, user.id, user.id],
  );
  const task = taskRes.rows[0];

  await t.test("1. getAllProjects scopes CTEs to active workspace and populates joined lead", async () => {
    let projectsData = null;
    const req = {
      workspace: { id: ws.id },
    };
    const res = {
      json: (data) => {
        projectsData = data;
      },
      status: () => res,
    };

    await projectController.getAllProjects(req, res);

    assert.ok(Array.isArray(projectsData));
    assert.strictEqual(projectsData.length, 1);
    const p = projectsData[0];
    assert.strictEqual(p.id, proj.id);
    assert.strictEqual(p.issue_count, 1);
    assert.ok(p.lead, "lead should be populated via LEFT JOIN");
    assert.strictEqual(p.lead.id, user.id);
    assert.strictEqual(p.lead.name, user.name);
    assert.ok(Array.isArray(p.members));
    assert.ok(Array.isArray(p.milestones));
  });

  await t.test("2. getAllTasks omits heavyweight description column from bulk list", async () => {
    let tasksData = null;
    const req = {
      workspace: { id: ws.id },
      query: {},
    };
    const res = {
      json: (data) => {
        tasksData = data;
      },
      status: () => res,
    };

    await taskController.getAllTasks(req, res);

    assert.ok(Array.isArray(tasksData));
    assert.strictEqual(tasksData.length, 1);
    const t = tasksData[0];
    assert.strictEqual(t.id, task.id);
    assert.strictEqual(t.title, "Opt Task Title");
    assert.strictEqual(t.status, "In Progress");
    assert.strictEqual(t.priority, "High");
    assert.strictEqual(t.project_identifier, "OPT");
    assert.strictEqual(t.assignee_name, user.name);
    // Crucial: description must be undefined / omitted to prevent network payload bloat
    assert.strictEqual(t.description, undefined, "description column must be omitted from bulk list");
  });

  await t.test("3. getCurrentWorkspaceSummary returns merged project & task metrics in exact contract", async () => {
    let summaryData = null;
    const req = {
      workspace: { id: ws.id },
      user: { id: user.id },
    };
    const res = {
      json: (data) => {
        summaryData = data;
      },
      status: () => res,
    };

    await workspaceController.getCurrentWorkspaceSummary(req, res);

    assert.ok(summaryData);
    assert.strictEqual(summaryData.activeProjectCount, 1);
    assert.strictEqual(summaryData.stats.inProgress, 1);
    assert.strictEqual(summaryData.stats.totalProjects, 1);
    assert.strictEqual(summaryData.priorityDistribution.totalActive, 1);
    assert.strictEqual(summaryData.priorityDistribution.high, 1);
    assert.strictEqual(summaryData.healthDistribution.onTrack, 1);
    assert.strictEqual(summaryData.healthDistribution.onTrackRate, 100);
    assert.strictEqual(summaryData.myIssues.length, 1);
    assert.strictEqual(summaryData.recentProjects.length, 1);
  });

  await t.test("4. getCurrentWorkspaceAnalytics trims bloated task arrays from velocity response", async () => {
    let analyticsData = null;
    const req = {
      workspace: { id: ws.id },
      user: { id: user.id },
    };
    const res = {
      json: (data) => {
        analyticsData = data;
      },
      status: () => res,
    };

    await workspaceController.getCurrentWorkspaceAnalytics(req, res);

    assert.ok(analyticsData);
    assert.ok(analyticsData.velocity);
    assert.ok(Array.isArray(analyticsData.velocity["7 days"]));

    const bucket7d = analyticsData.velocity["7 days"][0];
    assert.ok(typeof bucket7d.completed === "number");
    assert.ok(typeof bucket7d.created === "number");
    assert.ok(typeof bucket7d.shipped === "number");
    assert.ok(bucket7d.details);
    // Crucial: completedTasks and createdTasks must be empty arrays to prevent multi-megabyte duplication
    assert.deepStrictEqual(bucket7d.details.completedTasks, []);
    assert.deepStrictEqual(bucket7d.details.createdTasks, []);
  });

  // Cleanup test data
  await db.query("DELETE FROM tasks WHERE project_id = $1", [proj.id]);
  await db.query("DELETE FROM projects WHERE id = $1", [proj.id]);
  await db.query("DELETE FROM workspaces WHERE id = $1", [ws.id]);
  await db.query("DELETE FROM users WHERE id = $1", [user.id]);
});
