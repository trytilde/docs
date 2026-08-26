# Configure ChatKit over Tilde Global MCP

Use `https://api.trytilde.ai/mcp`. Call `tilde_whoami`, select a workspace, and pass its `team_id` to every function below.

## Build the endpoint first

Start from the [Hello World agent](https://github.com/trytilde/examples/tree/main/hello-world-agent). For a provider-rich implementation, use the [code review bot](https://github.com/trytilde/examples/tree/main/code-review-bot). Browse the full [examples repository](https://github.com/trytilde/examples) before creating a new pattern.

Use Vercel AI SDK and Harness SDK `chatKitEndpoint`. Preserve webhook signature verification, `context.session.history()`, `convertToAiSdkMessages`, streaming, and server-side secrets.

## Register an agent

Call `tilde_register_chatkit_agent` with:

- `team_id`
- `display_name`
- `endpoint_url`: an HTTPS URL in production, or an endpoint path such as `api/agent` for local development
- `local_running_endpoint: true` for a Dev Tunnel endpoint
- optional `memory_bank_ids` to ingest this agent's conversations continuously

The create response returns the plaintext Tilde API key and webhook signing key once. Give both to the human for secure storage in the agent's server environment. Never print them into source, state, logs, or chat history.

## Configure a ChatKit provider

1. Call `tilde_search_available_capabilities` with `kinds: ["chatkit_provider"]` and `include_schemas: true`.
2. Select the provider ID from the results.
3. Call `tilde_configure_chatkit_provider` with `provider_id`, `display_name`, the registered agent inbox ID, and any provider-specific configuration from the returned schema.
4. If setup requires human authorization, present the returned approval URL and wait with the returned continuation tool.
5. Call `tilde_search_enabled_capabilities` with `kinds: ["chatkit_channel", "chatkit_agent"]` to verify both resources.

Use the Vercel AI Endpoint provider when the user wants to test the agent in [Mission Control](https://api.trytilde.ai/mission-control).

## Trigger work with Routines and Signals

Routines unify scheduled and provider-event automation. Signals still owns provider setup, normalized deliveries, deduplication, inspection, and retry.

1. Call `tilde_list_signal_providers` and inspect the selected provider's signal schemas and authentication requirements.
2. Call `tilde_create_signal_provider` with the provider-specific `body`.
3. Call `tilde_create_routine` with a `body` containing shared fields and one to eight triggers. For an event trigger include `kind: "event"`, `signal_provider_instance_id`, `signal_type`, `filter`, `session_policy`, `action`, and `instruction_policy`. For a schedule trigger include `kind: "schedule"` and a UTC `schedule` cron expression.
4. Use one stable session key when related events should continue the same body of work, such as all updates to one Sentry issue or GitHub pull request.
5. Call `tilde_trigger_fake_signal` to test routing where the provider supports it.
6. Inspect execution with `tilde_list_signal_deliveries`. Use `tilde_retry_signal_delivery` only for a failed delivery that is safe to repeat.

Use `tilde_list_signal_provider_instances` and `tilde_list_routines` before updating or deleting resources. Provider mutations are `tilde_update_signal_provider` and `tilde_delete_signal_provider`. Routine mutations are `tilde_update_routine` and `tilde_delete_routine`; pass the current `version` as `expected_version` when replacing triggers.

Use `enabled` on the Routine as a global override and `enabled` on each trigger for individual control. Event triggers preserve fixed-session, keyed-session, and new-session-per-delivery policies plus both agent-invocation and message-only actions. Use `signal_and_instruction` when the shared Routine instruction must be delivered beside the normalized signal; use `signal_only` to preserve signal-only execution.

In application code, handle typed GitHub, Slack, Sentry, and Firecrawl metadata as shown in the [human ChatKit guide](https://trytilde.ai/docs/chatkit). `onUnprocessed` runs once per unprocessed message; later conversions reuse its cached result.
