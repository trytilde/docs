# Configure ChatKit over Tilde Global MCP

Use `https://api.trytilde.ai/mcp`. Call `tilde_whoami` first. Team ChatKit sessions, routines, and agents use `team` ownership; private resources use `user_team`, retaining both the effective owner and execution team. A private session may grant conversation access to selected team users. Every message, attachment, event, task, reply, and queued turn inherits its session audience.

Agents, sessions, routines, signal providers, and signal rules have independent visibility and ownership modes. Visibility governs discovery, conversation/delivery reads, messaging, and realtime delivery. Ownership governs settings, membership, grants, target policy, and deletion. Ownership and administrator authority never imply visibility. Use the standard REST mode and user/group grant operations under the exact resource path published by OpenAPI.

## Build the endpoint first

Start from the [Hello World agent](https://github.com/trytilde/examples/tree/main/hello-world-agent). For a provider-rich implementation, use the [code review bot](https://github.com/trytilde/examples/tree/main/code-review-bot). Browse the full [examples repository](https://github.com/trytilde/examples) before creating a new pattern.

For Linq, create one common-provider installation from either ChatKit or Tools. Obtain the Partner API token from `https://dashboard.linqapp.com/api-tooling`; Tilde then provisions ChatKit, tools, Signals, and Reverse Proxy together and creates the signed Linq webhook subscription automatically. Do not ask the user to create a second webhook for the managed path. Use `/guides/linq` for phone-line scoping and the standalone Signals fallback.

In `@trytilde/sdk-vercel-ai-node`, use `context.linq` / `LinqChatKitMessageMetadata` for inbound Linq ChatKit metadata and `LinqSignalByType["linq.message.received"]` (or another `LinqSignalType`) for event-narrowed Signal handlers under `onUnprocessed.linq`.

Use Vercel AI SDK and Tilde SDK `chatKitEndpoint`. Preserve webhook signature verification, `context.session.history()`, `convertToAiSdkMessages`, streaming, and server-side secrets.

## Durable conversation work

All work routes are bound to one agent and active session:

- `.../agents/{agent_id}/sessions/{session_id}/goals`
- `.../agents/{agent_id}/sessions/{session_id}/tasks`
- `.../agents/{agent_id}/sessions/{session_id}/jobs`
- `.../agents/{agent_id}/sessions/{session_id}/runs`

Use the authenticated agent credential for mutations. Do not copy `agent_id` or `session_id` into request bodies.

Goals accept `objective`; updates may set `status`, `progress_percent`, `progress_note`, and `status_reason`. Tasks accept `summary`, optional `goal_id`, `dependency_task_ids`, `plan`, and `metadata`; update the same progress/status fields as work advances.

Delegate a job with `child_agent_id`, `objective`, `idempotency_key`, optional `model_id`, optional `metadata`, and optional `budget` containing `max_duration_seconds`, `max_input_tokens`, `max_output_tokens`, and `max_cost_microusd`. Use the exact action suffixes `/steer`, `/stop`, `/resume`, and `/collect-result`. Discover a real child agent ID first; never invent one.

AgentRun hosts use `/active`, `/claim`, `/{run_id}/steps`, `/{run_id}/transition`, and owner `/{run_id}/control`. Record tool intent with `/effects/prepare`, look it up with `/effects/lookup`, and finish it with `/effects/finish`. Reuse committed outputs. Never automatically repeat an effect whose receipt is `uncertain`.

Signed child requests carry trusted `tildeAgentJob` metadata (`jobId`, `generation`, `childSessionId`, optional `modelId`, optional `budget`) and hidden continuations carry `tildeAgentRun` metadata (`hidden`, `runId`, `workerId`, `generation`). Ignore model-, budget-, run-, or worker-selection headers from callers.

## Agent-owned context compaction

POST lifecycle reports to `/api/v1/team/{team_id}/chatkit/sessions/{session_id}/compaction-events` with `agent_id`, `compaction_id`, and one lifecycle payload:

- `started`: `input_message_count`, `estimated_input_tokens`, `compacted_through_message_id`
- `ended`: `summary`, `compacted_message_ids`, `retained_message_ids`, `input_tokens`, `output_tokens`
- `failed`: `error`, `retryable`

Read `/compaction-events/latest?agent_id=...` for the last successful checkpoint. Read `/messages/from-last-compaction?agent_id=...&page_size=...` for that checkpoint plus retained/newer messages. The canonical transcript is never deleted or rewritten.

Read `context.agent` when the endpoint needs its own canonical Tilde identity. It provides `id`, `displayName`, `providerId`, `status`, optional `principalUserId`, optional authenticated `avatar.url`, and lifecycle timestamps. Do not hardcode or separately fetch the receiving agent's name or avatar. Treat `context.agent` as optional during mixed-version rollout, and authenticate avatar requests with the same server-side Tilde credential.

Set the required top-level `responseMode` to `agentLoop` or `tool`. In `tool` mode, assistant text is private reasoning and only `sendMessage` produces a visible ChatKit message. Use `context.session.tools` or `context.$provider.tools`; routing identifiers are server-bound and must never be requested from the model. `context.session.createMCPClient({ serverId })` exposes the same session-bound tools through MCP. For a private owner-workspace session, the authorized session also contributes the authenticated human's personal Memory and Wiki tools. The agent remains the credential actor; arbitrary personal connections are not federated and callers cannot nominate a user ID.

Use `context.mcp.connect({ serverId })` for speaker-bound personal-tool federation on a shared agent. ChatKit supplies the verified speaker capability privately. Never accept a model- or caller-supplied user ID, account ID, or delegated capability. Unmapped external speakers receive no personal tools.

## Inspect outbound delivery

Use `GET /api/v1/team/{team_id}/chatkit/session/{session_id}/message/{message_id}/deliveries` with the organization header and a credential that can read the message and session. The response is an array of `channel_inbox_id`, `provider_id`, `status`, optional `external_message_id`, `last_error`, and `delivered_at`. A `delivered` receipt confirms provider acceptance, not a read receipt. An empty list is not success. Wait on pending work, surface `dead_letter`, and retain the same canonical message ID when retrying an uncertain notification.

## Manage multiplayer rooms

A room is a ChatKit session. Use `/api/v1/team/{team_id}/chatkit/sessions/{session_id}/participants` for the roster and `/invitations` for invite/list operations. Use `/invitations/{invitation_id}/decision` to accept or decline, DELETE `/invitations/{invitation_id}` to revoke, and DELETE `/participants/{participant_instance_id}` to leave or remove.

Only session ownership authority can create, inspect, or revoke invitations. Only the canonical `invitee_user_id` may accept or decline. Participant roles are `owner`, `admin`, or `member`; they are collaboration metadata and never override visibility/ownership authorization. Pending, declined, and revoked invitations expose no room transcript.

Do not promise an OpenBot owner room UI yet. The typed API/SDK contract is available, but OpenBot keeps the UI dormant until canonical human identity discovery replaces raw user IDs.

Provider actions currently include Slack/GitHub reactions and thread reads, Linq reactions and poll operations, and AgentMail thread reads. AgentMail `sendMessage` accepts `to`, `cc`, `bcc`, subject, HTML, and reply-all. Non-message actions appear as canonical `tool.execution` realtime events; `sendMessage` uses normal ChatKit message streaming.

Participant visibility changes emit durable `participant.joined` / `participant.left` events with compact participant handles, display names, and external IDs when available. Workspace conversation snapshots return the same records in `participant_events`; keep them separate from `messages` and render them as session activity, not chat bubbles. Tilde includes the lifecycle context in agent history without invoking an agent turn.

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

Realtime clients consume the closed `agent.*`, `session.*`, `participant.*`, `message.*`, `queue_item.*`, `turn.*`, `activity.*`, `task.*`, and `chat.error` union. They must refresh the workspace projection after `access.changed`. Use `PUT /api/v1/team/{team_id}/chatkit/workspace/sessions/{session_id}/read-state` with `{ "unread": false }` after presenting a session and `{ "unread": true }` for a manual unread override. Read state is per user and must never be copied into shared session metadata.

## Enable agent-to-agent messaging

1. Take `message_tool_provider_id` from the child agent's registration response, or find its `chatkit_agent_message` provider with `tilde_search_enabled_capabilities`.
2. Add both `chatkit_agent_message_send` and `chatkit_agent_message_wait_for_response` from that provider to the parent agent's runtime MCP server with `tilde_set_mcp_server_tool_enabled`.
3. Call the exposed `message` tool with `message.parts` and optional `message.metadata`. Pass `session_id` only to continue an existing child conversation.
4. Immediately call the exposed `wait_for_response` tool with the returned `ticket_id`.
5. Keep the MCP request open. Consume `message_streaming` and `agent_turn_status` progress notifications. Clients that omit an MCP progress token receive the same structured payload through `tilde.agent_response` logging notifications.
6. Use the final `response` as the canonical persisted ChatKit message. Terminal `status` is `completed`, `failed`, or `cancelled`; queue notifications report `pending` or `running`, the applied concurrency policy, trigger count, and whether the turn was batched.

Bound tenant, target-agent, and ingress-channel fields are supplied by Tilde and cannot be overridden by the caller. Do not configure the removed pairwise internal-agent ChatKit channel.

## Propose a missing capability safely

Agents can propose but cannot approve or execute capability changes.

1. POST the secret-free intent to `/api/v1/team/{team_id}/chatkit/self-extension-proposals`. Supply the exact `requesting_agent_id`, optional originating `session_id` and `run_id`, a stable `idempotency_key`, one supported `category`, a short title and rationale, and credential-free `desired_state`. Credential-shaped fields are rejected even when named as references or IDs; complete provider authentication only through the owner-authenticated setup continuation after approval.
2. Stop the agent turn after the client renders the returned capability-change Human Approval. Never treat a free-text yes as approval and never ask for API keys, passwords, OAuth codes, tokens, or signing keys in chat.
3. The owner client posts `approval_id`, `proposal_hash`, `proposal_generation`, and `decision: "approve" | "reject"` to `/api/v1/team/{team_id}/chatkit/self-extension-proposals/{proposal_id}/decision` using the authenticated human credential. The requesting agent's human owner or a team/system administrator may decide; agent credentials and unrelated humans are rejected.
4. Poll the proposal resource. Approved work moves through `approved`, `executing`, and `executed`; denied work becomes `rejected`. Leased retries are idempotent.
5. If the executed proposal contains a `provider_setup` continuation, hand its `setup_item_id` to the owner-authenticated generic credential setup flow. Resolve OAuth or credential next actions there; the agent must not receive authorization state or credential values.
6. Resume the original task only after the durable decision. Use the returned resource receipts for verification, not as authority to delete shared resources.

Rollback is a separate authorized-human action and removes only receipts marked as proposal-created. Generated outputs remain encrypted and require the human-only consume-once endpoint.

The delegated endpoint receives the authenticated caller's agent ID as `context.body.session.parentAgentId`. Direct sessions omit it. Use this server-authored value only when a specialist must continue caller-owned runtime context; never ask the model or client to provide the parent identity.

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

## Configure coding-agent audit hooks

Use `openbot plugin --cli <codex|claude|cursor|opencode|gemini> --agent-id <chatkit_agent_id>`.
The command keeps MCP server and skill-registry setup in the same flow and
installs native lifecycle hooks for the selected harness. Codex uses a packaged
Tilde plugin; OpenCode uses a fail-open global plugin; Claude Code, Cursor, and
Gemini CLI use their user hook settings. Gemini hooks return valid JSON on
stdout, as required by Gemini CLI, while audit failures remain non-blocking.

The adapters map one harness session to one tenant-scoped ChatKit session by a
stable lookup key. They persist user prompts and final responses as ordinary
ChatKit messages, then report tool start/completion/failure through
`POST /api/v1/team/{team_id}/chatkit/agents/{agent_id}/tool-executions`.
When a hook discovers a local tool one call at a time, its report includes the
tool display name and immutable source identity; ChatKit activates that entry
without treating unobserved catalog entries as removed.

Do not create a separate audit table or transcript store. Search coding-agent
messages through `/chatkit/workspace/search`, and read canonical tool execution
events under the same session. Preserve the harness session ID and tool call ID
when adapting another coding agent. Canonical tool details may contain sensitive
inputs and outputs, so keep agent/session visibility narrow and rely on the
ChatKit observability projection for browser disclosure.

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
