const test = require("node:test");
const assert = require("node:assert/strict");
const {
  requireMinimumRole,
  requireExactRoles,
} = require("../src/middleware/auth.middleware");

const createMockRes = () => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(data) {
      res.body = data;
      return res;
    },
  };
  return res;
};

test("requireMinimumRole rejects requests without active workspace context", () => {
  const middleware = requireMinimumRole("Viewer");
  const req = { workspace: null };
  const res = createMockRes();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.error, "Active workspace context required");
});

test("requireMinimumRole allows users with sufficient role hierarchy", () => {
  const middleware = requireMinimumRole("Member");
  const req = { workspace: { id: 1 }, workspaceRole: "Admin" };
  const res = createMockRes();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
});

test("requireMinimumRole blocks users with insufficient role hierarchy", () => {
  const middleware = requireMinimumRole("Admin");
  const req = { workspace: { id: 1 }, workspaceRole: "Member" };
  const res = createMockRes();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.error, "Insufficient permissions within this workspace");
});

test("requireExactRoles allows Owner to bypass exact check", () => {
  const middleware = requireExactRoles(["Admin", "Project Manager"]);
  const req = { workspace: { id: 1 }, workspaceRole: "Owner" };
  const res = createMockRes();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
});

test("requireExactRoles blocks non-matching roles", () => {
  const middleware = requireExactRoles(["Admin"]);
  const req = { workspace: { id: 1 }, workspaceRole: "Member" };
  const res = createMockRes();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
});
