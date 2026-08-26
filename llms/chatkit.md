# Configure ChatKit over Tilde Global MCP

Use `https://api.trytilde.ai/mcp`. Call `tilde_whoami` first. Team ChatKit sessions, routines, and agents use `team` ownership; private resources use `user_team`, retaining both the effective owner and execution team. A private session may grant conversation access to selected team users. Every message, attachment, event, task, reply, and queued turn inherits its session audience.

Agents, sessions, routines, signal providers, and signal rules have independent visibility and ownership modes. Visibility governs discovery, conversation/delivery reads, messaging, and realtime delivery. Ownership governs settings, membership, grants, target policy, and deletion. Ownership and administrator authority never imply visibility. Use the standard REST mode and user/group grant operations under the exact resource path published by OpenAPI.

## Build the endpoint first

Start from the [Hello World agent](https://github.com/trytilde/examples/tree/main/hello-world-agent). For a provider-rich implementation, use the [code review bot](https://github.com/trytilde/examples/tree/main/code-review-bot). Browse the full [examples repository](https://github.com/trytilde/examples) before creating a new pattern.

Use Vercel AI SDK and Harness SDK `chatKitEndpoint`. Preserve webhook signature verification, `context.session.history()`, `convertToAiSdkMessages`, streaming, and server-side secrets.

## Register an agent

Call `tilde_register_chatkit_agent` with:

- `team_id`
- optional `access_scope`: `team` (default) or `user_team`; private agent ownership is inferred from the effective caller
- `display_name`
- `endpoint_url`: an HTTPS URL in production, or an endpoint path such as `api/agent` for local development
- `local_running_endpoint: true` for a Dev Tunnel endpoint
- optional `concurrency_policy`: `queue`, `interrupt`, or `queue_and_batch` (defaults to `queue`)
- optional `memory_bank_ids` to ingest this agent's conversations continuously

The create response returns the plaintext Tilde API key and webhook signing key once, plus `message_tool_provider_id`. Give both secrets to the human for secure storage in the agent's server environment. Never print them into source, state, logs, or chat history. The message provider is credentialless and already bound to the new agent.

Team agent create, update, and delete events are broadcast to authenticated Mission Control connections for the team. Private agent lifecycle events are sent to current user or group visibility grantees.

Realtime audiences are derived from current visibility and session membership on every event. A private visibility grant may admit an authorized user or group to the root, while private-session members receive that session's message and agent-turn stream. Client payloads do not expose authorization grants or internal audience identifiers.

## Manage private session members

Private sessions use `user_team` ownership. The creator is inserted as the owner automatically, and an optional `member_user_ids` list may add other users from the same team during creation. Use the private-session membership API to list, add, or remove non-owner members later. Do not confuse these authorization members with ChatKit inbox participants.

Owners and team, organization, or system administrators manage membership. Members may list/read the session, send messages and attachments, and receive its Mission Control WebSocket message, streaming, task, and agent-turn events. Members cannot change ownership or manage other members. A grant stops authorizing new access when the user is removed from the execution team.

## Enable agent-to-agent messaging

1. Take `message_tool_provider_id` from the child agent's registration response, or find its `chatkit_agent_message` provider with `tilde_search_enabled_capabilities`.
2. Add both `chatkit_agent_message_send` and `chatkit_agent_message_wait_for_response` from that provider to the parent agent's runtime MCP server with `tilde_set_mcp_server_tool_enabled`.
3. Call the exposed `message` tool with `message.parts` and optional `message.metadata`. Pass `session_id` only to continue an existing child conversation.
4. Immediately call the exposed `wait_for_response` tool with the returned `ticket_id`.
5. Keep the MCP request open. Consume `message_streaming` and `agent_turn_status` progress notifications. Clients that omit an MCP progress token receive the same structured payload through `tilde.agent_response` logging notifications.
6. Use the final `response` as the canonical persisted ChatKit message. Terminal `status` is `completed`, `failed`, or `cancelled`; queue notifications report `pending` or `running`, the applied concurrency policy, trigger count, and whether the turn was batched.

Bound tenant, target-agent, and ingress-channel fields are supplied by Tilde and cannot be overridden by the caller. Do not configure the removed pairwise internal-agent ChatKit channel.

## Configure a ChatKit provider

1. Call `tilde_search_available_capabilities` with `kinds: ["chatkit_provider"]` and `include_schemas: true`.
2. Select the provider ID from the results.
3. Call `tilde_configure_chatkit_provider` with `provider_id`, `display_name`, the registered agent inbox ID, and any provider-specific configuration from the returned schema.
4. If setup requires human authorization, present the returned approval URL and wait with the returned continuation tool.
5. Call `tilde_search_enabled_capabilities` with `kinds: ["chatkit_channel", "chatkit_agent"]` to verify both resources.

Use the Vercel AI Endpoint provider when the user wants to test the agent in [Mission Control](https://api.trytilde.ai/mission-control).

## Trigger work with Signals

Signals turn provider events into ChatKit messages.

Signal providers and rules may be personal `user` resources with no owning team. A personal rule must supply `target_team_id`, and the owner must belong to that team. It cannot bind a fixed shared session; sessions it creates are `user_team` sessions for the same owner. Personal webhook providers currently use polling ingress, while team providers may use webhook or polling ingress.

Provider/rule visibility controls discovery and delivery reads. Ownership controls configuration, target/session policy, grants, state-changing retries, and deletion. Deliveries inherit their rule; do not grant individual delivery rows.

1. Call `tilde_list_signal_providers` and inspect the selected provider's signal schemas and authentication requirements.
2. Call `tilde_create_signal_provider` with the provider-specific `body`.
3. Call `tilde_create_signal_rule` with a `body` that selects the event type, target agent, action, and stable session-key mapping.
4. Use one stable session key when related events should continue the same body of work, such as all updates to one Sentry issue or GitHub pull request.
5. Call `tilde_trigger_fake_signal` to test routing where the provider supports it.
6. Inspect execution with `tilde_list_signal_deliveries`. Use `tilde_retry_signal_delivery` only for a failed delivery that is safe to repeat.

Use `tilde_list_signal_provider_instances` and `tilde_list_signal_rules` before updating or deleting resources. Their mutation functions are `tilde_update_signal_provider`, `tilde_delete_signal_provider`, `tilde_update_signal_rule`, and `tilde_delete_signal_rule`.

In application code, handle typed GitHub, Slack, Sentry, and Firecrawl metadata as shown in the [human ChatKit guide](https://trytilde.ai/docs/chatkit). `onUnprocessed` runs once per unprocessed message; later conversions reuse its cached result.
