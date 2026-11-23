import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.resolve(__dirname, "../src");

import posthog, {
  trackAsync,
  debounceTrack,
  cancelDebounceTrack,
  trackPageView,
} from "../src/lib/posthog.js";
import { viewStateStore } from "../src/lib/viewStateStore.js";

describe("KRIRI Asynchronous Telemetry & Telemetry Hooks Suite", () => {
  let capturedEvents = [];
  let originalCapture;

  beforeEach(() => {
    capturedEvents = [];
    originalCapture = posthog.capture;
    posthog.capture = (eventName, properties) => {
      capturedEvents.push({ eventName, properties });
    };

    // Setup global window mock if running in bare Node test
    if (typeof global.window === "undefined") {
      global.window = {
        location: {
          href: "http://localhost:5173/dashboard",
          pathname: "/dashboard",
          origin: "http://localhost:5173",
        },
        requestIdleCallback: (cb) => setTimeout(cb, 5),
      };
    }
  });

  afterEach(() => {
    posthog.capture = originalCapture;
    cancelDebounceTrack();
  });

  it("exports all required non-blocking telemetry helpers", () => {
    assert.strictEqual(typeof trackAsync, "function");
    assert.strictEqual(typeof debounceTrack, "function");
    assert.strictEqual(typeof cancelDebounceTrack, "function");
    assert.strictEqual(typeof trackPageView, "function");
  });

  it("trackAsync dispatches events asynchronously without blocking main thread", async () => {
    trackAsync("test_async_event", { foo: "bar" });
    
    // Immediately after call, should NOT be captured synchronously
    assert.strictEqual(capturedEvents.length, 0);

    // After microtask / idle timer
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.strictEqual(capturedEvents.length, 1);
    assert.strictEqual(capturedEvents[0].eventName, "test_async_event");
    assert.strictEqual(capturedEvents[0].properties.foo, "bar");
    assert.strictEqual(capturedEvents[0].properties.pathname, "/dashboard");
  });

  it("debounceTrack coalesces high-frequency filter events and preserves latest payload", async () => {
    debounceTrack("tasks_filter_applied", { activeFilter: "all" }, 30);
    debounceTrack("tasks_filter_applied", { activeFilter: "in_progress" }, 30);
    debounceTrack("tasks_filter_applied", { activeFilter: "urgent" }, 30);

    // Should not fire immediately
    assert.strictEqual(capturedEvents.length, 0);

    // Wait past debounce threshold
    await new Promise((resolve) => setTimeout(resolve, 120));

    // Only the last call should have triggered
    assert.strictEqual(capturedEvents.length, 1);
    assert.strictEqual(capturedEvents[0].eventName, "tasks_filter_applied");
    assert.strictEqual(capturedEvents[0].properties.activeFilter, "urgent");
  });

  it("trackPageView asynchronously fires $pageview and deduplicates identical consecutive calls", async () => {
    trackPageView("/tasks");
    trackPageView("/tasks"); // duplicate call should be suppressed

    await new Promise((resolve) => setTimeout(resolve, 20));

    const pageviews = capturedEvents.filter((e) => e.eventName === "$pageview");
    assert.strictEqual(pageviews.length, 1);
    assert.strictEqual(pageviews[0].properties.$pathname, "/tasks");

    // Navigating to a different path fires a new pageview
    trackPageView("/projects");
    await new Promise((resolve) => setTimeout(resolve, 20));

    const updatedPageviews = capturedEvents.filter((e) => e.eventName === "$pageview");
    assert.strictEqual(updatedPageviews.length, 2);
    assert.strictEqual(updatedPageviews[1].properties.$pathname, "/projects");
  });

  it("ViewStateStore triggers view_mode_switched on activeView change without wrapping in heavy HOCs", async () => {
    viewStateStore.reset();
    viewStateStore.tasksView.activeView = "list";

    // Switch view to board
    viewStateStore.setTasksView({ activeView: "board" });

    await new Promise((resolve) => setTimeout(resolve, 20));

    const viewEvents = capturedEvents.filter((e) => e.eventName === "view_mode_switched");
    assert.strictEqual(viewEvents.length, 1);
    assert.strictEqual(viewEvents[0].properties.scope, "tasks");
    assert.strictEqual(viewEvents[0].properties.from_view, "list");
    assert.strictEqual(viewEvents[0].properties.to_view, "board");
  });

  it("AppLayout and App.jsx integrate route telemetry on navigation transitions", () => {
    const appLayout = fs.readFileSync(path.join(SRC_DIR, "layouts/AppLayout.jsx"), "utf8");
    assert.ok(
      appLayout.includes("trackPageView(location.pathname"),
      "AppLayout must track pageviews when location changes"
    );

    const appJsx = fs.readFileSync(path.join(SRC_DIR, "App.jsx"), "utf8");
    assert.ok(
      appJsx.includes("RouteTelemetryTracker") || appJsx.includes("trackPageView"),
      "App.jsx must include route telemetry tracker"
    );
  });
});
