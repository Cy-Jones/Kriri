import { describe, it } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

const FRONTEND_SRC = path.resolve("src");

describe("Intelligent Deferred Skeleton Loading Suite", () => {
  const deferredHookFile = fs.readFileSync(path.join(FRONTEND_SRC, "hooks/useDeferredSkeleton.js"), "utf8");
  const skeletonsFile = fs.readFileSync(path.join(FRONTEND_SRC, "components/skeletons/PageSkeletons.jsx"), "utf8");

  it("exports useDeferredSkeleton hook with default threshold", () => {
    assert.ok(deferredHookFile.includes("export function useDeferredSkeleton"), "Must export useDeferredSkeleton");
    assert.ok(deferredHookFile.includes("delayMs = 180"), "Default delay threshold must be 180ms");
    assert.ok(deferredHookFile.includes("clearTimeout"), "Must cancel timer when loading finishes");
  });

  it("ContextualRouteSkeleton includes intelligent delay parameter", () => {
    assert.ok(skeletonsFile.includes("export function ContextualRouteSkeleton({ pathname = \"\", delayMs = 180 })"), "ContextualRouteSkeleton must defer chunk loading flashes");
    assert.ok(skeletonsFile.includes("if (!show) return null;"), "Must return null before threshold expires");
  });

  it("Analytics.jsx uses deferred skeleton and synchronous cache pre-hydration", () => {
    const file = fs.readFileSync(path.join(FRONTEND_SRC, "pages/Analytics.jsx"), "utf8");
    assert.ok(file.includes("useDeferredSkeleton"), "Analytics must use useDeferredSkeleton");
    assert.ok(file.includes("api.getCached(\"/workspaces/current/analytics\")"), "Analytics must pre-hydrate from cache");
    assert.ok(!file.includes("localStorage.removeItem(\"kriri:cache:analytics_data\")"), "Analytics must not purge its own cache on mount");
  });

  it("Team.jsx uses deferred skeleton and synchronous cache pre-hydration", () => {
    const file = fs.readFileSync(path.join(FRONTEND_SRC, "pages/Team.jsx"), "utf8");
    assert.ok(file.includes("useDeferredSkeleton"), "Team must use useDeferredSkeleton");
    assert.ok(file.includes("api.getCached(`/workspaces/${organization.id}/members`)"), "Team must pre-hydrate from cache");
  });

  it("Inbox.jsx uses deferred skeleton and synchronous cache pre-hydration", () => {
    const file = fs.readFileSync(path.join(FRONTEND_SRC, "pages/Inbox.jsx"), "utf8");
    assert.ok(file.includes("useDeferredSkeleton"), "Inbox must use useDeferredSkeleton");
    assert.ok(file.includes("api.getCached(\"/workspaces/current/notifications\")"), "Inbox must pre-hydrate from cache");
    assert.ok(!file.includes("localStorage.removeItem(\"kriri:cache:notifications\")"), "Inbox must not purge its own cache on mount");
  });

  it("Dashboard.jsx uses deferred skeleton", () => {
    const file = fs.readFileSync(path.join(FRONTEND_SRC, "pages/Dashboard.jsx"), "utf8");
    assert.ok(file.includes("useDeferredSkeleton"), "Dashboard must use useDeferredSkeleton");
  });

  it("Tasks.jsx and Kanban.jsx use deferred skeleton", () => {
    const tasksFile = fs.readFileSync(path.join(FRONTEND_SRC, "pages/Tasks.jsx"), "utf8");
    const kanbanFile = fs.readFileSync(path.join(FRONTEND_SRC, "pages/Kanban.jsx"), "utf8");
    assert.ok(tasksFile.includes("useDeferredSkeleton"), "Tasks must use useDeferredSkeleton");
    assert.ok(kanbanFile.includes("useDeferredSkeleton"), "Kanban must use useDeferredSkeleton");
  });

  it("Projects.jsx uses deferred skeleton", () => {
    const file = fs.readFileSync(path.join(FRONTEND_SRC, "pages/Projects.jsx"), "utf8");
    assert.ok(file.includes("useDeferredSkeleton"), "Projects must use useDeferredSkeleton");
  });

  it("ProjectDetails.jsx and TaskDetails.jsx use deferred skeleton", () => {
    const projFile = fs.readFileSync(path.join(FRONTEND_SRC, "pages/ProjectDetails.jsx"), "utf8");
    const taskFile = fs.readFileSync(path.join(FRONTEND_SRC, "pages/TaskDetails.jsx"), "utf8");
    assert.ok(projFile.includes("useDeferredSkeleton"), "ProjectDetails must use useDeferredSkeleton");
    assert.ok(taskFile.includes("useDeferredSkeleton"), "TaskDetails must use useDeferredSkeleton");
  });

  it("TaskDetailsModal.jsx uses deferred skeleton and cache lookup", () => {
    const file = fs.readFileSync(path.join(FRONTEND_SRC, "components/TaskDetailsModal.jsx"), "utf8");
    assert.ok(file.includes("useDeferredSkeleton"), "TaskDetailsModal must use useDeferredSkeleton");
    assert.ok(file.includes("api.getCached(`/tasks/${taskId}`)"), "TaskDetailsModal must check cache");
  });
});
