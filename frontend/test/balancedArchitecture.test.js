import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.join(__dirname, "../src");

// Mock global environment for Node test runner
const store = new Map();
globalThis.window = {
  location: { pathname: "/" },
  localStorage: {
    getItem: (key) => store.get(key) || null,
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  },
};
globalThis.localStorage = globalThis.window.localStorage;

import { dataStore } from "../src/lib/dataStore.js";
import { viewStateStore } from "../src/lib/viewStateStore.js";

describe("Balanced Architecture: DataStore & ViewStateStore Tests", () => {
  beforeEach(() => {
    dataStore.reset();
    viewStateStore.reset();
    store.clear();
  });

  it("DataStore manages tasks and projects reactively with subscriber notification", () => {
    let notifyCount = 0;
    const unsubscribe = dataStore.subscribe(() => {
      notifyCount++;
    });

    assert.strictEqual(dataStore.getTasksSnapshot().length, 0);

    // Initial tasks set
    dataStore.setTasks([{ id: "tsk-1", title: "Task 1", status: "Todo" }]);
    assert.strictEqual(dataStore.getTasksSnapshot().length, 1);
    assert.strictEqual(notifyCount, 1);

    // Task updated via socket handler
    dataStore.handleTaskUpdated({ id: "tsk-1", status: "In Progress" });
    assert.strictEqual(dataStore.getTasksSnapshot()[0].status, "In Progress");
    assert.strictEqual(notifyCount, 2);

    // Task created via socket handler
    dataStore.handleTaskCreated({ id: "tsk-2", title: "Task 2", status: "Todo" });
    assert.strictEqual(dataStore.getTasksSnapshot().length, 2);
    assert.strictEqual(notifyCount, 3);

    // Task deleted via socket handler
    dataStore.handleTaskDeleted("tsk-1");
    assert.strictEqual(dataStore.getTasksSnapshot().length, 1);
    assert.strictEqual(dataStore.getTasksSnapshot()[0].id, "tsk-2");
    assert.strictEqual(notifyCount, 4);

    unsubscribe();
  });

  it("DataStore manages projects reactively with real-time socket events", () => {
    let notifyCount = 0;
    const unsubscribe = dataStore.subscribe(() => {
      notifyCount++;
    });

    dataStore.setProjects([{ id: "prj-1", name: "Alpha Project" }]);
    assert.strictEqual(dataStore.getProjectsSnapshot().length, 1);
    assert.strictEqual(notifyCount, 1);

    dataStore.handleProjectUpdated({ id: "prj-1", name: "Alpha Renamed" });
    assert.strictEqual(dataStore.getProjectsSnapshot()[0].name, "Alpha Renamed");

    dataStore.handleProjectCreated({ id: "prj-2", name: "Beta Project" });
    assert.strictEqual(dataStore.getProjectsSnapshot().length, 2);

    dataStore.handleProjectDeleted("prj-1");
    assert.strictEqual(dataStore.getProjectsSnapshot().length, 1);
    assert.strictEqual(dataStore.getProjectsSnapshot()[0].id, "prj-2");

    unsubscribe();
  });

  it("ViewStateStore preserves navigation state, filters, and scroll position outside DOM", () => {
    // 1. Simulate user interaction on Tasks view
    viewStateStore.setTasksView({
      activeView: "board",
      searchQuery: "bug fix",
      scrollTop: 350,
      scrollLeft: 120,
      activeFilter: "assigned",
    });

    const tasksState = viewStateStore.getTasksView();
    assert.strictEqual(tasksState.activeView, "board");
    assert.strictEqual(tasksState.searchQuery, "bug fix");
    assert.strictEqual(tasksState.scrollTop, 350);
    assert.strictEqual(tasksState.scrollLeft, 120);
    assert.strictEqual(tasksState.activeFilter, "assigned");

    // 2. Simulate user navigation to Projects view and scrolling
    viewStateStore.setProjectsView({
      activeView: "list",
      searchQuery: "mobile",
      scrollTop: 600,
      scrollLeft: 0,
    });

    const projectsState = viewStateStore.getProjectsView();
    assert.strictEqual(projectsState.activeView, "list");
    assert.strictEqual(projectsState.searchQuery, "mobile");
    assert.strictEqual(projectsState.scrollTop, 600);

    // 3. Verify Tasks state was preserved completely unchanged
    assert.strictEqual(viewStateStore.getTasksView().scrollTop, 350);
  });

  it("AppLayout does not contain Keep-Alive display:none wrappers", () => {
    const appLayout = fs.readFileSync(path.join(SRC_DIR, "layouts/AppLayout.jsx"), "utf8");
    assert.ok(
      !appLayout.includes('data-persistent-view="tasks"'),
      "AppLayout must not retain persistent tasks div"
    );
    assert.ok(
      !appLayout.includes('data-persistent-view="projects"'),
      "AppLayout must not retain persistent projects div"
    );
    assert.ok(
      !appLayout.includes("hasVisitedTasks"),
      "AppLayout must not retain hasVisitedTasks state"
    );
    assert.ok(
      !appLayout.includes("hasVisitedProjects"),
      "AppLayout must not retain hasVisitedProjects state"
    );
  });

  it("App.jsx routes tasks and projects through standard React Router element", () => {
    const appContent = fs.readFileSync(path.join(SRC_DIR, "App.jsx"), "utf8");
    assert.ok(
      appContent.includes('<Route path="tasks" element={<Tasks />} />'),
      "App.jsx must route tasks through <Tasks />"
    );
    assert.ok(
      appContent.includes('<Route path="projects" element={<Projects />} />'),
      "App.jsx must route projects through <Projects />"
    );
    assert.ok(
      !appContent.includes('<Route path="tasks" element={null} />'),
      "App.jsx must not have element={null} for tasks"
    );
    assert.ok(
      !appContent.includes('<Route path="projects" element={null} />'),
      "App.jsx must not have element={null} for projects"
    );
  });
});
