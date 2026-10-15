const { PostHog } = require("posthog-node");

const apiKey = process.env.POSTHOG_API_KEY;
const host = process.env.POSTHOG_HOST;
const missingVariable = !apiKey
  ? "POSTHOG_API_KEY"
  : !host
    ? "POSTHOG_HOST"
    : null;

if (missingVariable && process.env.NODE_ENV !== "production") {
  console.warn(
    `[ai-observability] ${missingVariable} is not configured; AI observability events will be skipped.`,
  );
}

const aiObservability = missingVariable
  ? null
  : new PostHog(apiKey, {
      host,
      privacyMode: false,
    });

function captureAiGeneration({ distinctId, properties }) {
  if (!aiObservability) {
    return;
  }

  aiObservability.capture({
    distinctId,
    event: "$ai_generation",
    properties,
  });
}

module.exports = { captureAiGeneration };
