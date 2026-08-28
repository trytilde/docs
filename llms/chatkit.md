# Configure ChatKit over Tilde Global MCP

Use `https://api.trytilde.ai/mcp`. Call `tilde_whoami` first. Team ChatKit sessions, routines, and agents use `team` ownership; private resources use `user_team`, retaining both the effective owner and execution team. A private session may grant conversation access to selected team users. Every message, attachment, event, task, reply, and queued turn inherits its session audience.

Agents, sessions, routines, signal providers, and signal rules have independent visibility and ownership modes. Visibility governs discovery, conversation/delivery reads, messaging, and realtime delivery. Ownership governs settings, membership, grants, target policy, and deletion. Ownership and administrator authority never imply visibility. Use the standard REST mode and user/group grant operations under the exact resource path published by OpenAPI.

## Build the endpoint first

Start from the [Hello World agent](https://github.com/trytilde/examples/tree/main/hello-world-agent). For a provider-rich implementation, use the [code review bot](https://github.com/trytilde/examples/tree/main/code-review-bot). Browse the full [examples repository](https://github.com/trytilde/examples) before creating a new pattern.

For Linq, create one common-provider installation from either ChatKit or Tools. Obtain the Partner API token from `https://dashboard.linqapp.com/api-tooling`; Tilde then provisions ChatKit, tools, Signals, and Reverse Proxy together and creates the signed Linq webhook subscription automatically. Do not ask the user to create a second webhook for the managed path. Use `/guides/linq` for phone-line scoping and the standalone Signals fallback.

In `@trytilde/sdk-vercel-ai-node`, use `context.linq` / `LinqChatKitMessageMetadata` for inbound Linq ChatKit metadata and `LinqSignalByType["linq.message.received"]` (or another `LinqSignalType`) for event-narrowed Signal handlers under `onUnprocessed.linq`.

Use Vercel AI SDK and Tilde SDK `chatKitEndpoint`. Preserve webhook signature verification, `context.session.history()`, `convertToAiSdkMessages`, streaming, and server-side secrets.

Set the required top-level `responseMode` to `agentLoop` or `tool`. In `tool` mode, assistant text is private reasoning and only `sendMessage` produces a visible ChatKit message. Use `context.session.tools` or `context.$provider.tools`; routing identifiers are server-bound and must never be requested from the model. `context.session.createMCPClient({ serverId })` exposes the same session-bound tools through MCP.

Provider actions currently include Slack/GitHub reactions and thread reads, Linq reactions and poll operations, and AgentMail thread reads. AgentMail `sendMessage` accepts `to`, `cc`, `bcc`, subject, HTML, and reply-all. Non-message actions appear as canonical `tool.execution` realtime events; `sendMessage` uses normal ChatKit message streaming.

Participant visibility changes emit `participant.joined` / `participant.left` realtime events and persisted system messages with compact participant handles, display names, and external IDs when available. They do not invoke an agent turn.

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

Team agent create, update, and delete events are broadcast to authenticated ChatKit realtime connections for the team. Private agent lifecycle events are sent to current user or group visibility grantees.

Realtime audiences are derived from current visibility and session membership on every event. A private visibility grant may admit an authorized user or group to the root, while private-session members receive that session's message and agent-turn stream. Client payloads do not expose authorization grants or internal audience identifiers.

## Manage private session members

Private sessions use `user_team` ownership. The creator is inserted as the owner automatically, and an optional `member_user_ids` list may add other users from the same team during creation. Use the private-session membership API to list, add, or remove non-owner members later. Do not confuse these authorization members with ChatKit inbox participants.

Owners and team, organization, or system administrators manage membership. Members may list/read the session, send messages and attachments, and receive its ChatKit realtime message, delta, queue, turn, task, and error events. Members cannot change ownership or manage other members. A grant stops authorizing new access when the user is removed from the execution team.

Realtime clients consume the closed `agent.*`, `session.*`, `message.*`, `queue_item.*`, `turn.*`, `activity.*`, `task.*`, and `chat.error` union. They must refresh the workspace projection after `access.changed`. Use `PUT /api/v1/team/{team_id}/chatkit/workspace/sessions/{session_id}/read-state` with `{ "unread": false }` after presenting a session and `{ "unread": true }` for a manual unread override. Read state is per user and must never be copied into shared session metadata.

## Enable agent-to-agent messaging

1. Take `message_tool_provider_id` from the child agent's registration response, or find its `chatkit_agent_message` provider with `tilde_search_enabled_capabilities`.
2. Add both `chatkit_agent_message_send` and `chatkit_agent_message_wait_for_response` from that provider to the parent agent's runtime MCP server with `tilde_set_mcp_server_tool_enabled`.
3. Call the exposed `message` tool with `message.parts` and optional `message.metadata`. Pass `session_id` only to continue an existing child conversation.
4. Immediately call the exposed `wait_for_response` tool with the returned `ticket_id`.
5. Keep the MCP request open. Consume `message_streaming` and `agent_turn_status` progress notifications. Clients that omit an MCP progress token receive the same structured payload through `tilde.agent_response` logging notifications.
6. Use the final `response` as the canonical persisted ChatKit message. Terminal `status` is `completed`, `failed`, or `cancelled`; queue notifications report `pending` or `running`, the applied concurrency policy, trigger count, and whether the turn was batched.

Bound tenant, target-agent, and ingress-channel fields are supplied by Tilde and cannot be overridden by the caller. Do not configure the removed pairwise internal-agent ChatKit channel.

Delegation is authorized by a visibility check on the target agent. A caller that cannot see an agent cannot message it and must not be told it exists.

## Delegate through a session-scoped connection

Preferred over adding a per-agent provider. Scope the runtime's MCP connection to the calling session by sending the `x-tilde-chatkit-session-id` header, or by passing `chatkit: { sessionId }` to `createMCPClient` in `@trytilde/sdk-vercel-ai-node`. Tilde then offers four extra tools on that connection:

| Tool | Purpose |
| --- | --- |
| `chatkit_list_agents` | Agents you may delegate to. Agents you cannot see are not returned. |
| `chatkit_delegate` | Ask an agent to do something. Opens a private child conversation off the current session and returns a `ticket_id` and `session_id`. |
| `chatkit_wait_for_response` | Wait for that ticket. Streams progress notifications and returns the final message. |
| `chatkit_list_participants` | Who is in the current conversation, including external participants. |

None of them accept `org_id`, `team_id`, or a session id: the session comes from the connection, so a session you were not authorized for cannot be addressed. Reuse the `session_id` returned by `chatkit_delegate` to continue the same delegation; omit it to start a new one.

Delegation is recorded as a child of the connection's session, so Mission Control shows the two together. A header naming a session the caller may not use rejects the connection rather than silently dropping the scoped tools, and a personal MCP server cannot be session-scoped at all.

Reaching a newly created agent needs no provisioning step; it appears in `chatkit_list_agents` as soon as you have visibility on it. The per-agent `chatkit_agent_message` provider still exists for a deliberately fixed direct line, but it is no longer created automatically.

## Identify who is speaking

Every session participant resolves to a ChatKit identity: a Tilde user, an agent, or an external chat address such as a GitHub login, an email address, or a mobile number. Addresses are unique per provider account, so the same handle in two GitHub organizations stays two people.

Messages delivered to an agent carry an `identity` block with `display_name`, `kind`, `external_id`, `is_agent`, and a pre-rendered `speaker_label`. Use the block, not the label, when branching: a display name is chosen by whoever sent the message. `@trytilde/sdk-vercel-ai-node` prefixes the first text part with the label automatically and leaves the agent's own replies unlabelled.

`tilde_user_id` appears only when a verified flow linked the address to a Tilde user. Its absence means the sender proved nothing about who they are. Treat that participant as anonymous and never derive permissions from an address, a display name, or an email header.

## Reply to external platforms

When a session originated on an external ChatKit provider, Tilde delivers the agent's final message back to that platform itself. The request body carries a `session` block with `provider_display_name` and `replies_route_to_provider`; when the flag is set, put a line in the system prompt telling the model its reply is delivered to the participants on that platform. `sessionProvenanceInstruction` in `@trytilde/sdk-vercel-ai-node` builds that line.

Do not also post the reply with a provider write tool for the thread the session owns, or the recipient receives it twice. Provider tools remain available for every other thread.

Delivery is queued per recipient and retried with backoff. Reasoning and tool-call content is stripped before anything leaves the platform boundary, and files become attachments or links depending on what the channel accepts.

## Configure a ChatKit provider

1. Call `tilde_search_available_capabilities` with `kinds: ["chatkit_provider"]` and `include_schemas: true`.
2. Select the provider ID from the results.
3. Call `tilde_configure_chatkit_provider` with `provider_id`, `display_name`, the registered agent inbox ID, and any provider-specific configuration from the returned schema.
4. If setup requires human authorization, present the returned approval URL and wait with the returned continuation tool.
5. Call `tilde_search_enabled_capabilities` with `kinds: ["chatkit_channel", "chatkit_agent"]` to verify both resources.

Use the Vercel AI Endpoint provider when the user wants to test the agent in [ChatKit workspace](https://api.trytilde.ai/chatkit-workspace).

## Search ChatKit conversations

Use `GET /api/v1/team/{team_id}/chatkit/workspace/search` with the selected workspace's `team_id` and a required `q` parameter. Authenticate with the same API key or bearer token used for ChatKit workspace.

- Omit `session_id` to search visible session titles, visible agent IDs and display names, and message bodies across the workspace. Private resources require a matching visibility grant.
- Pass `session_id` to search messages only inside that session.
- Set `page_size` from 1 to 100. The default is 25.
- Pass the returned opaque `next_page_token` unchanged to fetch the next relevance-ordered page.
- Inspect each result's `kind`: `session_title`, `agent`, or `message`. Every result carries session context; agent and message details appear only for their matching kinds.

Queries must contain 1 to 256 non-whitespace characters. Search is case-insensitive full-text matching, not fuzzy or substring matching. A session scope that is hidden from the caller or outside the selected organization and workspace returns `404` without revealing whether it exists elsewhere.

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
