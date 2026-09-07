# Configure memory over Tilde Global MCP

Tilde has two related knowledge resources:

- A **memory bank** stores durable semantic memories and supports recall, retain, reflect, and deletion.
- A **wiki** stores structured Markdown pages, schemas, relationships, revisions, graph data, and assets. Schema packs are reusable page and relationship schemas applied to a wiki; they are not a third memory system.

Use `https://api.trytilde.ai/mcp`. Call `tilde_whoami` first. Memory banks and wikis may be `team` or personal `user` resources; personal REST routes use `/api/v1/user/{user_id}/...` and do not carry a team ID.

Both roots have independent visibility and ownership modes. Visibility is required for list/get/read and memory or wiki content operations. Ownership is required for bank configuration, source policy, wiki schema/settings, grants, lifecycle, and deletion. User/group ownership grants and administrator status do not imply visibility. Pages, revisions, assets, memories, source projections, and generated tools inherit the root planes.

Use the standard REST `/{id}/visibility`, `/{id}/ownership`, and `/{id}/{plane}/grants` operations under the team or personal bank/wiki path. Private group grants must name a same-tenant Identity group. A personal target may consume a workspace source the caller can see, but a workspace target cannot bind a personal source. Do not copy a personal source into durable workspace projections.

Memory-bank and wiki ownership can move between `user` and `team` through their dedicated `/ownership` operation. Detach and purge source bindings first. The API does not expose transfer to a different user.

## Memory banks

1. Call `tilde_list_memory_providers` to confirm the hosted provider.
2. Call `tilde_create_memory_bank` for a workspace bank or `tilde_create_personal_memory_bank` for the authenticated human's private bank, with a clear name and purpose.
3. Save the returned memory bank ID.
4. Use `tilde_get_memory_bank` and `tilde_check_memory_bank_health` to verify provisioning.

Memory banks use Tilde's managed Helix graph and vector store. Tenant and bank predicates scope every query and mutation. Recall fuses semantic, lexical, exact-title, and graph candidates before reranking a bounded result set with evidence, source, and learning-agent provenance. Callers never supply raw tenant or graph predicates.

Retained documents use typed `memory_type`, `title`, `importance`, `authorship`, `relations`, and `provenance` fields. Put evidence IDs, subjects, supersession, source identity, and learning-agent identity in those fields. Use `metadata` only for provider-native or caller-owned extension facts that Tilde does not interpret.

## Automatic ChatKit memory

Set `automatic_memory_mode` on the ChatKit agent or channel to exactly `none`, `personal`, `personal_plus_agent`, or `team`; default to `none`. `memory_bank_ids` controls conversation ingestion and is not a substitute for recall authorization.

For one recipient-bound recall, POST `/api/v1/team/{team_id}/chatkit/agents/{agent_id}/sessions/{session_id}/automatic-memory/recall` with the durable triggering `message_id` and optional `max_tokens`. Never supply or infer a user ID. Tilde derives the effective actor from the stored message/session and returns only visible, provenance-bearing memory.

OpenBot automatic-memory wiring is shipped and default-off. Persist `OPENBOT_AUTOMATIC_MEMORY_MODE` or a per-agent `AGENT_<ID>_AUTOMATIC_MEMORY_MODE` override. `personal_plus_agent` alone provisions an agent-owned bank; `personal` and `team` enable their corresponding authorized recall without creating that bank. Memory Catcher uses the installation's selected Codex, direct Gateway, or managed-OIDC inference provider and has mode `none` plus no bank of its own.

For an Agent Resource Bundle, `memory.bank.synthesizer_agent_id` is an optional stable same-team ChatKit agent key. Set it to `memory-catcher` for an OpenBot-owned bank. Omission preserves the current or server-default synthesizer; it never clears an assignment. `memory.bank.enabled: false` deletes the lifecycle-owned bank. Portable state carries the synthesizer as a ChatKit agent resource reference and resolves it in the destination team.

## Personal-bank synthesis

PUT `/api/v1/user/{user_id}/memory/banks/{bank_id}/synthesizer` with `synthesizer_agent_id` and `synthesizer_team_id`. The authenticated human must own the bank. Tilde creates a stable private synthesis session and queues visible completed-turn evidence.

The assigned agent uses these session-bound paths:

- `POST /api/v1/team/{team_id}/memory/synthesis-sessions/{session_id}/validate-batch`
- `POST /api/v1/team/{team_id}/memory/synthesis-sessions/{session_id}/recall`
- `POST /api/v1/team/{team_id}/memory/synthesis-sessions/{session_id}/retain`
- `DELETE /api/v1/team/{team_id}/memory/synthesis-sessions/{session_id}/documents`

DELETE the bank's `/synthesizer` assignment to stop processing while retaining queued evidence.

For synthesis retain, supersede, forget, and completion, copy the exact current `batch_id`, complete duplicate-free `evidence_ids` in their supplied order, and fresh `lease_owner` supplied by the job. Never reorder the evidence sequence or reuse a prior claim's lease. OpenBot exposes these as the bank-free `memory_upsert`, `memory_supersede`, `memory_forget`, and `finish_synthesis` tools; Memory Catcher must finish the durable receipt before emitting the requested completion marker.

Before inference, call `validate-batch` with the batch ID, exact ordered evidence-ID sequence, and lease owner. Tilde recomputes the digest and accepts only the current prompt-sized evidence chunk under the unexpired lease. Each later mutation repeats the same typed binding, so a stale worker, reordered set, or arbitrary subset cannot authorize a mutation or completion.

## Organization AI credits

These are agent-authenticated billing operations, not Global MCP tools:

1. POST `/api/v1/billing/ai-credits/reservations` with `estimated_cost_microusd` and `idempotency_key` before inference.
2. POST `/api/v1/billing/ai-credits/receipts` with `reservation_id`, `actual_cost_microusd`, `model_id`, `input_tokens`, `output_tokens`, `tags`, and `idempotency_key`; include `generation_id` and `provider` when available.
3. DELETE `/api/v1/billing/ai-credits/reservations` with `reservation_id` when no provider charge occurred.

OpenBot hosted-inference metering is shipped for every Tilde-managed Vercel project-OIDC Gateway call, including Memory Catcher. Before each call, reserve credits and prepare a generation- and worker-fenced AgentRun effect. Persist the Gateway generation for recovery. Commit authoritative system/fallback receipts and release authoritative BYOK receipts. Direct owner Gateway keys and Codex subscription inference are outside this meter.

Do not let BYOK skip reservation: Vercel may fall back to charged system credentials, so zero-credit organizations cannot start any Gateway call. Do not replay planned, uncertain, or reconciled effects. If no model response is recoverable, terminally fail the old run; a later owner trigger creates a new run. Hosted `max_cost_microusd` uses authoritative post-call receipt cost and may overshoot by one final call. Non-hosted cost budgets require configured input/output price rates. Human top-up authorization remains separate.

## Wikis and schema packs

1. Call `tilde_create_wiki` for workspace knowledge or `tilde_create_personal_wiki` for the authenticated human. Set same-scope `memory_bank_ids` when its content should also be ingested into memory.
2. Call `tilde_list_wiki_schema_packs` to inspect reusable schemas.
3. Call `tilde_apply_wiki_schema_pack` with `wiki_id` and `schema_pack_key`. Tilde records the authenticated caller as the actor.
4. Use `tilde_get_wiki` to verify provisioning. Use `tilde_retry_wiki_provisioning` only after an errored provisioning attempt.

`tilde_update_wiki` can rename a wiki and replace its complete memory-bank selection. An empty `memory_bank_ids` array detaches it from all banks.

## Continuously ingest sources

Call `tilde_set_memory_source_bindings` to replace the complete bank selection for a source. Supply:

- `source_kind`: `chatkit_channel`, `chatkit_session`, `signal_provider`, `signal_delivery`, `skill_registry`, `skill`, `mcp_server`, `wiki`, or `wiki_page`
- `source_id`: the configured resource ID
- `memory_bank_ids`: target bank IDs; pass an empty array to detach the source

ChatKit agents and wikis can also accept `memory_bank_ids` when created. Use explicit source bindings for other resources or when changing bindings later.

Inspect ingestion with `tilde_list_memory_bank_sources`. Call `tilde_retry_memory_sync` with the source kind and ID after fixing the cause of a failed sync.

For personal Signal providers and personal Wikis, call `tilde_set_personal_memory_source_bindings`. Tilde infers the human user from authenticated credentials; never supply or guess a user ID. A personal source can bind only to a personal bank owned by that user in the same organization. New deliveries and Wiki changes are queued automatically after the explicit binding is created.

## Expose memory and wiki tools

Creating a bank or wiki automatically enables a private tool provider. It does not expose those functions on an agent's MCP server.

1. Call `tilde_search_enabled_capabilities` for the bank or wiki name.
2. Select the exact tool functions the agent needs. Avoid destructive functions unless required.
3. Map each function to the agent's runtime MCP server with `tilde_set_mcp_server_tool_enabled`.
4. Prefer dynamic mode for the full wiki toolset.

Treat the wiki as the source of truth for structured and relational knowledge. A useful maintenance pattern is a daily agent run that reviews the previous 24 hours, updates the wiki first, and retains only concise durable facts that do not belong in the wiki. See the [human Memory guide](https://trytilde.ai/docs/memory).

## Background synthesis

Assign one synthesizer agent to each bank. Tilde queues source evidence by bank
and invokes the assigned agent when the queue reaches 1,000 estimated tokens.
The synthesis session exposes only that bank's tools. Every retain, supersede,
or delete command is bound to the exact batch, evidence IDs, and worker lease.
The agent must complete the batch with `mutated` or a cited `noop` outcome.

Owner-written explicit facts are protected from automatic overwrite and
deletion. Synthesis leases and receipts are operational state and are not part
of exported bank configuration.

Every bound Wiki provides `grep_pages` in addition to full-text `list_pages`. Use literal mode for exact text and regex mode for patterns. Results contain stable page identity, path, one-based line number, the matching Markdown line, and bounded context; page and match limits prevent unbounded scans.
