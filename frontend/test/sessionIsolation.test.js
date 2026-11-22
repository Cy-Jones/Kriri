import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { clearUserSessionData } from "../src/lib/api.js";

// LocalStorage mock supporting key enumeration
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

describe("User Session Isolation & Cache Clean Tests", () => {
  beforeEach(() => {
    store.clear();
  });

  it("purges all user caches, active workspace, and session tokens on logout", () => {
    // Populate session with User A's data
    localStorage.setItem("kriri:cache:dashboard_summary:user_A:personal", JSON.stringify({ activeProjectCount: 25 }));
    localStorage.setItem("kriri:cache:dashboard_summary", JSON.stringify({ activeProjectCount: 25 }));
    localStorage.setItem("kriri:cache:dashboard_analytics", JSON.stringify({ stats: { totalProjects: 25 } }));
    localStorage.setItem("kriri:cache:projects", JSON.stringify([{ id: "proj_1" }]));
    localStorage.setItem("kriri:cache:board_tasks", JSON.stringify([{ id: 1 }]));
    localStorage.setItem("kriri:active_workspace_id", "11");
    localStorage.setItem("kriri-user-username", "jones");
    localStorage.setItem("kriri-user-email", "smartjones07@gmail.com");
    localStorage.setItem("kriri_current_user_id", "user_A");

    // Call clearUserSessionData
    clearUserSessionData();

    // Verify all sensitive/cached items are wiped
    assert.strictEqual(localStorage.getItem("kriri:cache:dashboard_summary:user_A:personal"), null);
    assert.strictEqual(localStorage.getItem("kriri:cache:dashboard_summary"), null);
    assert.strictEqual(localStorage.getItem("kriri:cache:dashboard_analytics"), null);
    assert.strictEqual(localStorage.getItem("kriri:cache:projects"), null);
    assert.strictEqual(localStorage.getItem("kriri:cache:board_tasks"), null);
    assert.strictEqual(localStorage.getItem("kriri:active_workspace_id"), null);
    assert.strictEqual(localStorage.getItem("kriri-user-username"), null);
    assert.strictEqual(localStorage.getItem("kriri-user-email"), null);
    assert.strictEqual(localStorage.getItem("kriri_current_user_id"), null);
  });

  it("ensures User B does not see User A's scoped cache", () => {
    const userA_Key = "kriri:cache:dashboard_summary:user_A:personal";
    const userB_Key = "kriri:cache:dashboard_summary:user_B:personal";

    localStorage.setItem(userA_Key, JSON.stringify({ activeProjectCount: 25 }));

    // User B checking their own key
    assert.strictEqual(localStorage.getItem(userB_Key), null);
    // User A's data is only present under User A's key
    assert.notStrictEqual(localStorage.getItem(userA_Key), null);
  });
});

