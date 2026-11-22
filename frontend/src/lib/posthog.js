import posthog from "posthog-js";

/**
 * KRIRI High-Performance Telemetry Layer
 * 
 * Guarantees 100% asynchronous, non-blocking telemetry event capture.
 * Uses requestIdleCallback / setTimeout(0) to ensure analytics dispatches
 * NEVER block React commits, renders, or paint frames (maintaining 0ms/1ms latencies).
 */

export const initPostHog = () => {
  if (typeof window !== "undefined" && import.meta.env?.VITE_POSTHOG_KEY) {
    posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
      api_host: import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com",
      autocapture: false,
      capture_pageview: false,
      disable_session_recording: true,
      advanced_disable_decide: true,
      enable_recording_console_log: false,
      request_batching: true,
    });
  }
};

/**
 * Safely dispatch analytics events asynchronously during browser idle periods.
 */
export const trackAsync = (eventName, properties = {}) => {
  if (typeof window === "undefined" || !eventName) return;

  const dispatch = () => {
    try {
      if (posthog && typeof posthog.capture === "function") {
        posthog.capture(eventName, {
          ...properties,
          $current_url: window.location.href,
          pathname: window.location.pathname,
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      // Swallowed silently so analytics never affects application logic
    }
  };

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(dispatch, { timeout: 2000 });
  } else {
    setTimeout(dispatch, 0);
  }
};

/**
 * Debounced async tracker for high-frequency interactions (search, filter changes).
 */
const activeDebounceTimers = new Map();

export const debounceTrack = (eventName, properties = {}, wait = 300) => {
  if (typeof window === "undefined" || !eventName) return;

  if (activeDebounceTimers.has(eventName)) {
    clearTimeout(activeDebounceTimers.get(eventName));
  }

  const timer = setTimeout(() => {
    activeDebounceTimers.delete(eventName);
    trackAsync(eventName, properties);
  }, wait);

  activeDebounceTimers.set(eventName, timer);
};

export const cancelDebounceTrack = (eventName) => {
  if (eventName) {
    if (activeDebounceTimers.has(eventName)) {
      clearTimeout(activeDebounceTimers.get(eventName));
      activeDebounceTimers.delete(eventName);
    }
  } else {
    for (const timer of activeDebounceTimers.values()) {
      clearTimeout(timer);
    }
    activeDebounceTimers.clear();
  }
};

/**
 * Asynchronously track route navigation ($pageview).
 * De-duplicates identical consecutive calls to prevent duplicate events on component re-renders.
 */
let lastPageviewKey = "";

export const trackPageView = (pathname, search = "") => {
  const pageviewKey = `${pathname || ""}${search || ""}`;
  if (pageviewKey === lastPageviewKey) return;
  lastPageviewKey = pageviewKey;

  trackAsync("$pageview", {
    $pathname: pathname,
    $search: search,
    $current_url: typeof window !== "undefined" ? window.location.href : pathname,
  });
};

export default posthog;
