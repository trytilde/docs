# Configure memory over Tilde Global MCP

Tilde has two related knowledge resources:

- A **memory bank** stores durable semantic memories and supports recall, retain, reflect, and deletion.
- A **wiki** stores structured Markdown pages, schemas, relationships, revisions, graph data, and assets. Schema packs are reusable page and relationship schemas applied to a wiki; they are not a third memory system.

Use `https://api.trytilde.ai/mcp`. Call `tilde_whoami`, select a workspace, and pass its `team_id` to every function below.

## Memory banks

1. Call `tilde_list_memory_providers` to confirm the hosted provider.
2. Call `tilde_create_memory_bank` with a clear name and purpose.
3. Save the returned memory bank ID.
4. Use `tilde_get_memory_bank` and `tilde_check_memory_bank_health` to verify provisioning.

Memory banks are hosted through Hindsight. They currently cost $20 per bank each month; this pricing is expected to change.

## Wikis and schema packs

1. Call `tilde_create_wiki`. Set `memory_bank_ids` when its content should also be ingested into memory.
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

## Expose memory and wiki tools

Creating a bank or wiki automatically enables a private tool provider. It does not expose those functions on an agent's MCP server.

1. Call `tilde_search_enabled_capabilities` for the bank or wiki name.
2. Select the exact tool functions the agent needs. Avoid destructive functions unless required.
3. Map each function to the agent's runtime MCP server with `tilde_set_mcp_server_tool_enabled`.
4. Prefer dynamic mode for the full wiki toolset.

Treat the wiki as the source of truth for structured and relational knowledge. A useful maintenance pattern is a daily agent run that reviews the previous 24 hours, updates the wiki first, and retains only concise durable facts that do not belong in the wiki. See the [human Memory guide](https://docs.trytilde.ai/memory).
