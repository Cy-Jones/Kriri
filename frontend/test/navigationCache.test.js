import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { api, setClerkTokenGetter, clearUserSessionData, clearApiCache } from "../src/lib/api.js";

// Mock environment
const store = new Map();
globalThis.window = {
  location: { pathname: "/" },
  localStorage: {
    getItem: (key) => store.get(key) || null,
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
    get length() {
      return store.size;
    },
    key: (i) => Array.from(store.keys())[i] || null,
  },
};
globalThis.localStorage = globalThis.window.localStorage;

describe("Navigation Performance & Cache Strategy Tests", () => {
  beforeEach(() => {
    clearUserSessionData();
    clearApiCache();
  });

  it("api.getCached retrieves synchronous cached data for 0ms view mounting", () => {
    setClerkTokenGetter(() => Promise.resolve("mock-token"), "user_test:ws_test");

    // Initially uncached
    assert.strictEqual(api.getCached("/projects"), null);

    // Mock fetch for /projects
    let fetchCount = 0;
    globalThis.fetch = async (url) => {
      fetchCount++;
      return {
        ok: true,
        status: 200,
        json: async () => [{ id: 1, name: "Project 1" }, { id: 2, name: "Project 2" }],
      };
    };

    return api.get("/projects").then((data) => {
      assert.strictEqual(fetchCount, 1);
      assert.strictEqual(data.length, 2);

      // Now synchronous getCached must return the data immediately
      const syncData = api.getCached("/projects");
      assert.ok(Array.isArray(syncData));
      assert.strictEqual(syncData.length, 2);
      assert.strictEqual(syncData[0].name, "Project 1");

      // Repeated api.get calls within 60s TTL must not trigger network fetch
      return api.get("/projects").then((cachedData) => {
        assert.strictEqual(fetchCount, 1); // Still 1, no duplicate network request!
        assert.strictEqual(cachedData.length, 2);
      });
    });
  });

  it("mutations invalidate cache for related entity and summary endpoints", async () => {
    setClerkTokenGetter(() => Promise.resolve("mock-token"), "user_test:ws_test");

    let networkFetches = [];
    globalThis.fetch = async (url, opts) => {
      networkFetches.push({ url, method: opts?.method || "GET" });
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, id: 99 }),
      };
    };

    // Pre-populate cache for /tasks and summary
    await api.get("/tasks");
    await api.get("/workspaces/current/summary");
    assert.ok(api.getCached("/tasks"));
    assert.ok(api.getCached("/workspaces/current/summary"));

    // Perform a mutation (e.g. updating a task)
    await api.put("/tasks/99", { status: "Done" });

    // Cache for /tasks and /workspaces/current/summary must be invalidated
    assert.strictEqual(api.getCached("/tasks"), null);
    assert.strictEqual(api.getCached("/workspaces/current/summary"), null);
  });
});

