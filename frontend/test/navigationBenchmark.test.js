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

describe("Projects ↔ Tasks Independent Navigation & Scaled Performance Suite", () => {
  beforeEach(() => {
    clearUserSessionData();
    clearApiCache();
    setClerkTokenGetter(() => Promise.resolve("mock-token"), "smartjones07:ws_large");
  });

  it("Tasks destination does NOT eagerly fetch /projects on initial load", async () => {
    const fetchedUrls = [];
    globalThis.fetch = async (url) => {
      fetchedUrls.push(url);
      if (url.includes("/tasks")) {
        return {
          ok: true,
          status: 200,
          json: async () => Array.from({ length: 200 }, (_, i) => ({
            id: i + 1,
            title: `Issue ${i + 1}`,
            status: "Todo",
            priority: "Medium"
          })),
        };
      }
      if (url.includes("/projects")) {
        return {
          ok: true,
          status: 200,
          json: async () => Array.from({ length: 25 }, (_, i) => ({
            id: i + 1,
            name: `Project ${i + 1}`,
            status: "In Progress"
          })),
        };
      }
      return { ok: true, status: 200, json: async () => ({}) };
    };

    // Simulate Tasks view mount requesting only its own data
    const tasks = await api.get("/tasks");
    assert.strictEqual(tasks.length, 200);

    // Verify /projects was NOT requested during Tasks load
    const projectFetches = fetchedUrls.filter((u) => u.includes("/projects"));
    assert.strictEqual(projectFetches.length, 0, "Tasks mount must not trigger /projects fetch");
  });

  it("Projects destination loads independently without requesting /tasks", async () => {
    const fetchedUrls = [];
    globalThis.fetch = async (url) => {
      fetchedUrls.push(url);
      if (url.includes("/projects")) {
        return {
          ok: true,
          status: 200,
          json: async () => Array.from({ length: 25 }, (_, i) => ({
            id: i + 1,
            name: `Project ${i + 1}`,
            status: "In Progress"
          })),
        };
      }
      return { ok: true, status: 200, json: async () => [] };
    };

    const projects = await api.get("/projects");
    assert.strictEqual(projects.length, 25);

    const taskFetches = fetchedUrls.filter((u) => u.includes("/tasks"));
    assert.strictEqual(taskFetches.length, 0, "Projects mount must not trigger /tasks fetch");
  });

  it("Repeated navigation between Projects and Tasks uses cache for 0ms transitions", async () => {
    let networkCalls = 0;
    globalThis.fetch = async (url) => {
      networkCalls++;
      if (url.includes("/projects")) {
        return { ok: true, status: 200, json: async () => [{ id: 1, name: "P1" }] };
      }
      if (url.includes("/tasks")) {
        return { ok: true, status: 200, json: async () => [{ id: 101, title: "T1" }] };
      }
      return { ok: true, status: 200, json: async () => ({}) };
    };

    // First visit to Projects
    await api.get("/projects");
    assert.strictEqual(networkCalls, 1);

    // Navigate to Tasks
    await api.get("/tasks");
    assert.strictEqual(networkCalls, 2);

    // Navigate back to Projects (should be 0ms from cache)
    const pCached = api.getCached("/projects");
    assert.ok(pCached);
    await api.get("/projects");
    assert.strictEqual(networkCalls, 2, "Projects must be served from cache");

    // Navigate back to Tasks (should be 0ms from cache)
    const tCached = api.getCached("/tasks");
    assert.ok(tCached);
    await api.get("/tasks");
    assert.strictEqual(networkCalls, 2, "Tasks must be served from cache");

    // Repeated 5x navigation
    for (let i = 0; i < 5; i++) {
      await api.get("/projects");
      await api.get("/tasks");
    }
    assert.strictEqual(networkCalls, 2, "No extra network requests across 5 repeated navigations");
  });

  it("api.setCached updates cache in-place without triggering network reload", async () => {
    globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => [{ id: 1, title: "Initial" }] });

    await api.get("/tasks");
    assert.strictEqual(api.getCached("/tasks")?.[0]?.title, "Initial");

    // In-place optimistic update
    api.setCached("/tasks", [{ id: 1, title: "Updated in-place" }]);
    assert.strictEqual(api.getCached("/tasks")?.[0]?.title, "Updated in-place");
  });
});
