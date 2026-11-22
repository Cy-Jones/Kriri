const test = require("node:test");
const assert = require("node:assert");
const {
  generateWorkspaceSlug,
  getUserIdentifierCode,
  generateProjectSlug,
  generateProjectIdentifier,
} = require("../src/utils/slug");

test("generateWorkspaceSlug converts 'acme-corp-1' to 'kriri-acme-corp-01'", async () => {
  const mockClient = {
    query: async () => ({ rows: [] }),
  };
  const slug = await generateWorkspaceSlug("acme-corp-1", mockClient);
  assert.strictEqual(slug, "kriri-acme-corp-01");
});

test("generateWorkspaceSlug converts standard name 'Acme Corp' to 'kriri-acme-corp-01'", async () => {
  const mockClient = {
    query: async () => ({ rows: [] }),
  };
  const slug = await generateWorkspaceSlug("Acme Corp", mockClient);
  assert.strictEqual(slug, "kriri-acme-corp-01");
});

test("generateWorkspaceSlug handles collisions by incrementing to -02, -03", async () => {
  const mockClient = {
    query: async () => ({
      rows: [
        { slug: "kriri-acme-corp-01" },
        { slug: "kriri-acme-corp-02" },
      ],
    }),
  };
  const slug = await generateWorkspaceSlug("acme-corp-1", mockClient);
  assert.strictEqual(slug, "kriri-acme-corp-03");
});

test("generateWorkspaceSlug handles empty or emoji-only names gracefully", async () => {
  const mockClient = {
    query: async () => ({ rows: [] }),
  };
  const slug = await generateWorkspaceSlug("🚀🔥", mockClient);
  assert.strictEqual(slug, "kriri-workspace-01");
});

test("generateWorkspaceSlug handles personal workspace naming", async () => {
  const mockClient = {
    query: async () => ({ rows: [] }),
  };
  const slug = await generateWorkspaceSlug("Cyrus Jones's Workspace", mockClient);
  assert.strictEqual(slug, "kriri-cyrus-jones-s-workspace-01");
});

test("getUserIdentifierCode extracts initials or fallback uppercase prefix", () => {
  assert.strictEqual(getUserIdentifierCode("Cyrus Jones"), "CJ");
  assert.strictEqual(getUserIdentifierCode("Alice"), "ALI");
  assert.strictEqual(getUserIdentifierCode(""), "USR");
  assert.strictEqual(getUserIdentifierCode(null), "USR");
});

test("generateProjectSlug formats slug and increments on collision", async () => {
  const mockClient = {
    query: async () => ({
      rows: [{ slug: "infra" }, { slug: "infra-1" }],
    }),
  };
  const slug = await generateProjectSlug("Infra", 1, mockClient);
  assert.strictEqual(slug, "infra-2");
});

test("generateProjectIdentifier creates sequential identifiers with user code", async () => {
  const mockClient = {
    query: async () => ({
      rows: [{ identifier: "KRI-CJ-1" }, { identifier: "KRI-CJ-2" }],
    }),
  };
  const ident = await generateProjectIdentifier(1, "Cyrus Jones", mockClient);
  assert.strictEqual(ident, "KRI-CJ-3");
});
