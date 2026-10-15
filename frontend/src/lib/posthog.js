import posthog from "posthog-js";

export const initPostHog = () => {
  if (typeof window !== "undefined" && import.meta.env.VITE_POSTHOG_KEY) {
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

export default posthog;
