const test = require("node:test");
const assert = require("node:assert");
const db = require("../src/config/database");
const workspaceController = require("../src/controllers/workspace.controller");

test("Workspace Settings Controller Suite", async (t) => {
  // Ensure a test workspace exists
  const setupRes = await db.query(
    "INSERT INTO workspaces (name, slug, default_language, default_timezone, date_format, time_format) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    [
      "Test General Workspace",
      `test-general-ws-${Date.now()}`,
      "en",
      "UTC",
      "YYYY-MM-DD",
      "24h",
    ],
  );
  const testWs = setupRes.rows[0];

  t.after(async () => {
    await db.query("DELETE FROM workspaces WHERE id = $1", [testWs.id]);
  });

  await t.test("checkSlugAvailability validates slug and checks uniqueness", async () => {
    // Check existing slug
    const req1 = {
      query: { slug: testWs.slug },
      workspace: { id: 999999 },
    };
    let jsonResult1 = null;
    const res1 = {
      json: (data) => {
        jsonResult1 = data;
      },
      status: () => res1,
    };
    await workspaceController.checkSlugAvailability(req1, res1);
    assert.strictEqual(jsonResult1.available, false);

    // Check unique slug
    const req2 = {
      query: { slug: `unique-available-slug-${Date.now()}` },
      workspace: { id: testWs.id },
    };
    let jsonResult2 = null;
    const res2 = {
      json: (data) => {
        jsonResult2 = data;
      },
      status: () => res2,
    };
    await workspaceController.checkSlugAvailability(req2, res2);
    assert.strictEqual(jsonResult2.available, true);
  });

  await t.test("updateCurrentWorkspace updates identity, regional, and preferences", async () => {
    const newName = "Updated Test Workspace";
    const newDesc = "A workspace dedicated to full-stack engineering.";
    const req = {
      workspace: { id: testWs.id },
      body: {
        name: newName,
        description: newDesc,
        default_timezone: "America/New_York",
        date_format: "DD/MM/YYYY",
        time_format: "12h",
        first_day_of_week: "sunday",
        default_project_view: "board",
        default_task_view: "list",
        default_task_priority: "High",
        default_project_visibility: "workspace",
        default_member_role: "Viewer",
        notify_new_members: false,
        notify_workspace_activity: true,
      },
    };
    let updatedData = null;
    const res = {
      json: (data) => {
        updatedData = data;
      },
      status: () => res,
    };

    await workspaceController.updateCurrentWorkspace(req, res);
    assert.strictEqual(updatedData.name, newName);
    assert.strictEqual(updatedData.description, newDesc);
    assert.strictEqual(updatedData.default_timezone, "America/New_York");
    assert.strictEqual(updatedData.date_format, "DD/MM/YYYY");
    assert.strictEqual(updatedData.time_format, "12h");
    assert.strictEqual(updatedData.first_day_of_week, "sunday");
    assert.strictEqual(updatedData.default_project_view, "board");
    assert.strictEqual(updatedData.default_task_view, "list");
    assert.strictEqual(updatedData.default_task_priority, "High");
    assert.strictEqual(updatedData.default_project_visibility, "workspace");
    assert.strictEqual(updatedData.default_member_role, "Viewer");
    assert.strictEqual(updatedData.notify_new_members, false);
    assert.strictEqual(updatedData.notify_workspace_activity, true);
  });

  await t.test("uploadWorkspaceLogo and removeWorkspaceLogo handle logo lifecycle", async () => {
    const dummyBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const uploadReq = {
      workspace: { id: testWs.id },
      body: { image: dummyBase64 },
    };
    let uploadResData = null;
    const uploadRes = {
      json: (data) => {
        uploadResData = data;
      },
      status: () => uploadRes,
    };
    await workspaceController.uploadWorkspaceLogo(uploadReq, uploadRes);
    assert.strictEqual(uploadResData.success, true);
    assert.strictEqual(uploadResData.logo_url, dummyBase64);

    // Remove logo
    const removeReq = {
      workspace: { id: testWs.id },
    };
    let removeResData = null;
    const removeRes = {
      json: (data) => {
        removeResData = data;
      },
      status: () => removeRes,
    };
    await workspaceController.removeWorkspaceLogo(removeReq, removeRes);
    assert.strictEqual(removeResData.success, true);
    assert.strictEqual(removeResData.logo_url, null);
  });

  await t.test("getCurrentWorkspace returns enriched metadata", async () => {
    const req = {
      workspace: { id: testWs.id },
      workspaceRole: "Owner",
    };
    let dataRes = null;
    const res = {
      json: (data) => {
        dataRes = data;
      },
      status: () => res,
    };
    await workspaceController.getCurrentWorkspace(req, res);
    assert.strictEqual(dataRes.id, testWs.id);
    assert.strictEqual(dataRes.role, "Owner");
    assert.ok(typeof dataRes.member_count === "number");
    assert.ok(dataRes.created_at);
    assert.ok(dataRes.plan);
  });
});

