import posthog from 'posthog-js'

export const initPostHog = () => {
  if (typeof window !== 'undefined' && import.meta.env.VITE_POSTHOG_KEY) {
    posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
      api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
      // Disable broad console-log capture by default as requested
      enable_recording_console_log: false,
    })
  }
}

export default posthog
