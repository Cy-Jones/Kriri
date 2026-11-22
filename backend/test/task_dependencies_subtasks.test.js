const test = require("node:test");
const assert = require("node:assert");
const db = require("../src/config/database");
const taskController = require("../src/controllers/task.controller");

test("Subtasks and Dependencies Suite", async (t) => {
  // Setup: create test workspace, user, and project
  const wsRes = await db.query(
    "INSERT INTO workspaces (name, slug) VALUES ('Dep Test WS', $1) RETURNING *",
    [`dep-ws-${Date.now()}`],
  );
  const ws = wsRes.rows[0];

  const userRes = await db.query(
    "INSERT INTO users (clerk_user_id, name, email, role) VALUES ($1, 'Dep Tester', $2, 'Admin') RETURNING *",
    [`clerk_dep_${Date.now()}`, `dep_${Date.now()}@test.com`],
  );
  const user = userRes.rows[0];

  const projRes = await db.query(
    "INSERT INTO projects (workspace_id, name, slug, identifier) VALUES ($1, 'Dep Project', $2, 'DEP') RETURNING *",
    [ws.id, `dep-proj-${Date.now()}`],
  );
  const proj = projRes.rows[0];

  t.after(async () => {
    await db.query("DELETE FROM projects WHERE id = $1", [proj.id]);
    await db.query("DELETE FROM users WHERE id = $1", [user.id]);
    await db.query("DELETE FROM workspaces WHERE id = $1", [ws.id]);
  });

  // Create two parent tasks
  const t1Res = await db.query(
    "INSERT INTO tasks (project_id, title, status, priority, reporter_id) VALUES ($1, 'Task A', 'Todo', 'Medium', $2) RETURNING *",
    [proj.id, user.id],
  );
  const taskA = t1Res.rows[0];

  const t2Res = await db.query(
    "INSERT INTO tasks (project_id, title, status, priority, reporter_id) VALUES ($1, 'Task B', 'Todo', 'High', $2) RETURNING *",
    [proj.id, user.id],
  );
  const taskB = t2Res.rows[0];

  await t.test("Subtask creation and parent progress rollup", async () => {
    // 1. Create a subtask under Task A
    const reqCreate = {
      workspace: { id: ws.id },
      user: { id: user.id },
      params: { id: taskA.id },
      body: { title: "Subtask 1" },
    };
    let sub1 = null;
    const resCreate = {
      status: (code) => {
        assert.strictEqual(code, 201);
        return resCreate;
      },
      json: (data) => {
        sub1 = data;
      },
    };
    await taskController.createSubtask(reqCreate, resCreate);
    assert.ok(sub1);
    assert.strictEqual(sub1.parent_task_id, taskA.id);
    assert.strictEqual(sub1.title, "Subtask 1");

    // 2. Create second subtask under Task A
    const reqCreate2 = {
      workspace: { id: ws.id },
      user: { id: user.id },
      params: { id: taskA.id },
      body: { title: "Subtask 2" },
    };
    let sub2 = null;
    const resCreate2 = {
      status: (code) => {
        assert.strictEqual(code, 201);
        return resCreate2;
      },
      json: (data) => {
        sub2 = data;
      },
    };
    await taskController.createSubtask(reqCreate2, resCreate2);
    assert.ok(sub2);

    // Verify parent progress is 0%
    const checkParent1 = await db.query("SELECT progress FROM tasks WHERE id = $1", [taskA.id]);
    assert.strictEqual(checkParent1.rows[0].progress, 0);

    // 3. Mark Subtask 1 as 'Done'
    const reqUpdate = {
      workspace: { id: ws.id },
      user: { id: user.id },
      params: { id: sub1.id },
      body: { title: sub1.title, status: "Done" },
    };
    let updatedSub = null;
    const resUpdate = {
      json: (data) => {
        updatedSub = data;
      },
      status: () => resUpdate,
    };
    await taskController.updateTask(reqUpdate, resUpdate);
    assert.strictEqual(updatedSub.status, "Done");

    // Verify parent progress rolled up to 50%
    const checkParent2 = await db.query("SELECT progress FROM tasks WHERE id = $1", [taskA.id]);
    assert.strictEqual(checkParent2.rows[0].progress, 50);
  });

  await t.test("Dependencies: add, cycle detection, and delete", async () => {
    // 1. Task A depends on Task B (Task B blocks Task A)
    const reqDep1 = {
      workspace: { id: ws.id },
      params: { id: taskA.id },
      body: { depends_on_task_id: taskB.id },
    };
    let dep1 = null;
    const resDep1 = {
      status: (code) => {
        assert.strictEqual(code, 201);
        return resDep1;
      },
      json: (data) => {
        dep1 = data;
      },
    };
    await taskController.addTaskDependency(reqDep1, resDep1);
    assert.ok(dep1);
    assert.strictEqual(dep1.id, taskB.id); // joined blocker details

    // 2. Reject self dependency
    const reqSelf = {
      workspace: { id: ws.id },
      params: { id: taskA.id },
      body: { depends_on_task_id: taskA.id },
    };
    let selfError = null;
    const resSelf = {
      status: (code) => {
        assert.strictEqual(code, 400);
        return resSelf;
      },
      json: (data) => {
        selfError = data.error;
      },
    };
    await taskController.addTaskDependency(reqSelf, resSelf);
    assert.ok(selfError);

    // 3. Reject circular dependency (Task B cannot depend on Task A now)
    const reqCycle = {
      workspace: { id: ws.id },
      params: { id: taskB.id },
      body: { depends_on_task_id: taskA.id },
    };
    let cycleError = null;
    const resCycle = {
      status: (code) => {
        assert.strictEqual(code, 400);
        return resCycle;
      },
      json: (data) => {
        cycleError = data.error;
      },
    };
    await taskController.addTaskDependency(reqCycle, resCycle);
    assert.ok(cycleError);
    assert.match(cycleError, /circular/i);

    // 4. getTaskById returns dependencies and subtasks
    const reqGet = {
      workspace: { id: ws.id },
      params: { id: taskA.id },
    };
    let fullTask = null;
    const resGet = {
      json: (data) => {
        fullTask = data;
      },
      status: () => resGet,
    };
    await taskController.getTaskById(reqGet, resGet);
    assert.ok(fullTask);
    assert.strictEqual(fullTask.subtasks.length, 2);
    assert.strictEqual(fullTask.dependencies.blocked_by.length, 1);
    assert.strictEqual(fullTask.dependencies.blocked_by[0].id, taskB.id);

    // 5. Delete dependency
    const reqDelDep = {
      workspace: { id: ws.id },
      params: { id: taskA.id, depId: taskB.id },
    };
    let delRes = null;
    const resDel = {
      json: (data) => {
        delRes = data;
      },
      status: () => resDel,
    };
    await taskController.removeTaskDependency(reqDelDep, resDel);
    assert.strictEqual(delRes.success, true);
  });

  await t.test("getAllTasks filters by project_id accurately", async () => {
    // Create another project with a task
    const proj2Res = await db.query(
      "INSERT INTO projects (workspace_id, name, slug, identifier) VALUES ($1, 'Other Project', $2, 'OTH') RETURNING *",
      [ws.id, `other-proj-${Date.now()}`],
    );
    const proj2 = proj2Res.rows[0];

    await db.query(
      "INSERT INTO tasks (project_id, title, status, priority, reporter_id) VALUES ($1, 'Other Task', 'Todo', 'Low', $2)",
      [proj2.id, user.id],
    );

    let allTasks = [];
    const reqAll = {
      workspace: { id: ws.id },
      query: {},
    };
    const resAll = {
      json: (data) => {
        allTasks = data;
      },
      status: () => resAll,
    };
    await taskController.getAllTasks(reqAll, resAll);
    // Should have tasks from both projects
    assert.ok(allTasks.length >= 2);

    let projFilteredTasks = [];
    const reqFiltered = {
      workspace: { id: ws.id },
      query: { project_id: String(proj.id) },
    };
    const resFiltered = {
      json: (data) => {
        projFilteredTasks = data;
      },
      status: () => resFiltered,
    };
    await taskController.getAllTasks(reqFiltered, resFiltered);
    // Should only have tasks from proj
    assert.ok(projFilteredTasks.length > 0);
    assert.ok(projFilteredTasks.every((t) => t.project_id === proj.id));

    // Cleanup proj2
    await db.query("DELETE FROM tasks WHERE project_id = $1", [proj2.id]);
    await db.query("DELETE FROM projects WHERE id = $1", [proj2.id]);
  });
});

