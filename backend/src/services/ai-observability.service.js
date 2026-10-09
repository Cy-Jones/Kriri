const { PostHog } = require('posthog-node');

const apiKey = process.env.POSTHOG_API_KEY;
const host = process.env.POSTHOG_HOST;
const missingVariable = !apiKey ? 'POSTHOG_API_KEY' : !host ? 'POSTHOG_HOST' : null;

if (missingVariable && process.env.NODE_ENV !== 'production') {
  throw new Error(
    `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`
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
    event: '$ai_generation',
    properties,
  });
}

module.exports = { captureAiGeneration };
