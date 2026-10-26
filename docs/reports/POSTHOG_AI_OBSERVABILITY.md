# PostHog AI Observability Setup

## Status

**Wired, unverified.** This Node/Express service currently has no LLM provider SDK, model request, conversation handler, or LLM tool loop in its manifest or source. The manual-capture workflow was selected because there was no provider-specific integration to apply. No model behavior or existing analytics instrumentation was changed.

## Changes made

- Installed `posthog-node` (version `5.55.1`) and recorded it in `package.json` and `package-lock.json`.
- Configured the real project values in the local `.env` file using `POSTHOG_API_KEY` and `POSTHOG_HOST`. Values are not included in this report.
- Initialized the environment-driven AI Observability client from `src/app.js` after dotenv configuration.
- Added `src/services/ai-observability.service.js`, which exports `captureAiGeneration()` for explicit `$ai_generation` capture when a model call is added.
- Added `.posthog-wizard-cache/.posthog-ai.json` to record this manual-capture setup.

The helper initializes with `privacyMode: false` and is a production no-op when either PostHog environment variable is missing. In non-production environments, it throws a clear configuration error instead of silently dropping events.

## Instrumentation boundary

There was no existing LLM request to instrument. Consequently, no `$ai_generation` event is emitted yet, and no session, trace, distinct ID, provider, model, prompt, completion, token count, latency, or tool span was invented.

When this service adds a real model request, call `captureAiGeneration()` immediately after that request with the data returned by the real provider. Use:

- one `$ai_session_id` for the application's real conversation or workflow;
- one `$ai_trace_id` for every user turn, shared by all generations and tool spans in that turn;
- the authenticated stable user ID as `distinctId` when one is in scope;
- the real `$ai_provider`, `$ai_model`, input/output, token counts, and latency from the provider response.

If the future model flow executes application tools, capture one `$ai_span` event per tool execution with the same trace ID. Do not use email addresses or names as a distinct ID or ordinary event property.

## Verification

- Confirmed `posthog-node` is installed in `node_modules` and declared in both manifests.
- Confirmed the application entry point loads the helper after dotenv initialization.
- Confirmed both required PostHog environment keys are present without reading or exposing their values.
- No build, typecheck, or lint script is defined. The only test script intentionally exits with an error, so it is not a verification path.
- No LLM request can be triggered in the current codebase, so no AI trace has been sent or verified in PostHog.

After an LLM route or job exists, trigger one real turn, then open **AI Observability → Traces** in PostHog. Verify one generation appears with the correct provider/model and that a second turn in the same conversation reuses the session ID while using a new trace ID.

## Privacy mode

The effective setting is `privacyMode: false` in `src/services/ai-observability.service.js` (the `PostHog` constructor). This means prompt and completion payloads supplied to future `$ai_generation` events can be captured. No request-level override exists.

Before sending prompts or responses whose sensitive content must not be stored in PostHog, change that constructor setting to `privacyMode: true` (or apply the supported per-request privacy control for the eventual provider integration). Privacy mode excludes `$ai_input` and `$ai_output_choices` from SDK-captured events; it does not remove arbitrary custom properties, manually captured payloads, or previously stored events.

See [AI Observability privacy mode](https://posthog.com/docs/ai-observability/privacy-mode) for details.
