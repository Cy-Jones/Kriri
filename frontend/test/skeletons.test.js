import { describe, it } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

const FRONTEND_SRC = path.resolve("src");

describe("Application-Wide Contextual Skeleton Loading System Suite", () => {
  const skeletonsFile = fs.readFileSync(path.join(FRONTEND_SRC, "components/skeletons/PageSkeletons.jsx"), "utf8");

  it("exports all required contextual skeletons", () => {
    const requiredSkeletons = [
      "TasksListSkeleton",
      "TasksBoardSkeleton",
      "ProjectsListSkeleton",
      "ProjectsBoardSkeleton",
      "ProjectsTimelineSkeleton",
      "DashboardSkeleton",
      "InboxSkeleton",
      "AnalyticsSkeleton",
      "TeamSkeleton",
      "ProjectDetailsSkeleton",
      "TaskDetailsSkeleton",
      "SettingsSkeleton",
      "AgentSkeleton",
      "ContextualRouteSkeleton",
    ];

    for (const skeletonName of requiredSkeletons) {
      assert.ok(
        skeletonsFile.includes(`export function ${skeletonName}`),
        `PageSkeletons.jsx must export ${skeletonName}`
      );
    }
  });

  it("DashboardSkeleton implements KRIRI 12-column Bento Grid structure", () => {
    assert.ok(skeletonsFile.includes("kriri-grid"), "Must include kriri-grid class");
    assert.ok(skeletonsFile.includes("kriri-s1"), "Must include kriri-s1 stat card");
    assert.ok(skeletonsFile.includes("kriri-s2"), "Must include kriri-s2 stat card");
    assert.ok(skeletonsFile.includes("kriri-s3"), "Must include kriri-s3 stat card");
    assert.ok(skeletonsFile.includes("kriri-s4"), "Must include kriri-s4 stat card");
    assert.ok(skeletonsFile.includes("kriri-an"), "Must include kriri-an velocity chart frame");
    assert.ok(skeletonsFile.includes("kriri-re"), "Must include kriri-re reminders card");
    assert.ok(skeletonsFile.includes("kriri-pr"), "Must include kriri-pr projects card");
    assert.ok(skeletonsFile.includes("kriri-tm"), "Must include kriri-tm team card");
  });

  it("ProjectsTimelineSkeleton implements Gantt date scale and tracks", () => {
    assert.ok(skeletonsFile.includes("ProjectsTimelineSkeleton"), "Must define ProjectsTimelineSkeleton");
    assert.ok(skeletonsFile.includes("Gantt"), "Must contain Gantt scale comments/structure");
    assert.ok(skeletonsFile.includes("months"), "Must render month date scale");
  });

  it("InboxSkeleton implements 320px split-pane notification list", () => {
    assert.ok(skeletonsFile.includes("w-[320px]"), "Must include 320px notification list width");
  });

  it("ContextualRouteSkeleton dispatches across all routes", () => {
    const routes = [
      "/dashboard",
      "/inbox",
      "/tasks",
      "/tasks/",
      "/projects",
      "/projects/",
      "/analytics",
      "/team",
      "/agent",
      "/settings",
    ];

    for (const route of routes) {
      assert.ok(
        skeletonsFile.includes(`"${route}"`) || skeletonsFile.includes(`'${route}'`),
        `ContextualRouteSkeleton must handle route ${route}`
      );
    }
  });

  it("all skeletons respect motion-reduce:animate-none for accessibility", () => {
    const matchCount = (skeletonsFile.match(/motion-reduce:animate-none/g) || []).length;
    assert.ok(matchCount >= 13, `Expected at least 13 motion-reduce annotations, found ${matchCount}`);
  });

  it("no generic PageLoading spinner remains in any application route", () => {
    const routeFiles = [
      "pages/Dashboard.jsx",
      "pages/Inbox.jsx",
      "pages/Analytics.jsx",
      "pages/Team.jsx",
      "pages/ProjectDetails.jsx",
      "pages/TaskDetails.jsx",
      "pages/Settings.jsx",
      "components/TaskDetailsModal.jsx",
      "layouts/AppLayout.jsx",
      "App.jsx",
    ];

    for (const file of routeFiles) {
      const content = fs.readFileSync(path.join(FRONTEND_SRC, file), "utf8");
      assert.ok(
        !content.includes("<PageLoading"),
        `${file} must not contain generic <PageLoading /> component`
      );
    }
  });

  it("AppLayout uses ContextualRouteSkeleton for Suspense fallback", () => {
    const appLayout = fs.readFileSync(path.join(FRONTEND_SRC, "layouts/AppLayout.jsx"), "utf8");
    assert.ok(
      appLayout.includes("<ContextualRouteSkeleton pathname={location.pathname} />"),
      "AppLayout Suspense fallback must use ContextualRouteSkeleton with location.pathname"
    );
  });
});
