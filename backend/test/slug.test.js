const test = require("node:test");
const assert = require("node:assert");
const { generateWorkspaceSlug } = require("../src/utils/slug");

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
