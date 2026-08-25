# Configure tools over Tilde Global MCP

Use `https://api.trytilde.ai/mcp`. Call `tilde_whoami`. Team operations target a workspace; personal REST operations use `/api/v1/user/{user_id}/...` and infer the effective user for ordinary creates.

Configured tool accounts and MCP servers support `team` or `user` ownership. Personal resources have no team ID. Runtime MCP servers use `user_tool_federation_mode: none | all | selected`, defaulting to `none`. Selected policies contain provider/tool-definition pairs only—not credentials, aliases, bound parameters, or user account IDs. At connection time Tilde authenticates and pins the effective user to the MCP session, then exposes the caller's active matching personal accounts under stable `user__<provider>__<account>__<tool>` names.

## Recommended workflow

1. Call `tilde_search_available_capabilities` with a specific intent such as `"GitHub pull request tools"`. Use `include_schemas: true` when you need provider or tool input details.
2. Configure the source:
   - Managed provider: `tilde_enable_toolkit_provider`.
   - Provider app that Tilde should provision: `tilde_auto_provision_toolkit_provider`.
   - Existing Streamable HTTP MCP server: `tilde_connect_proxied_mcp_server`.
   - Harness SDK `toolEndpoint` backend: `tilde_register_custom_tool_backend`.
3. If the response contains `approval_url`, send it to the user. Immediately invoke the returned `next_tool_name` with `next_tool_arguments`. Do not continue until it returns `approved`.
4. Enable only the required provider functions with `tilde_set_toolkit_tool_enabled`.
5. Create a runtime server with `tilde_create_mcp_server`. Supply a stable lowercase `id`, a human-readable `name`, and `is_dynamic_tool_discovery: true` unless the toolset is very small and fixed.
6. Call `tilde_search_enabled_capabilities` to obtain the exact `tool_group_instance_id`, `tool_group_source_type_id`, and `tool_source_type_id` values.
7. Map each function with `tilde_set_mcp_server_tool_enabled`.
8. Call `tilde_search_enabled_capabilities` again, filtered by `mcp_server_instance_id`, to verify the final mapping.

Do not confuse the global configuration MCP server with the runtime MCP server created in step 5.

Static MCP mappings may reference workspace configured tools only. Personal configured tools are federation-only.

Ownership-change endpoints never accept a different target owner. Personal-to-team promotion requires membership in the target team; narrowing a team resource requires team-or-higher administration and targets the effective user. Remove static mappings before narrowing an MCP server.

## Add a registered agent as an MCP tool

Each ChatKit agent registration creates one credentialless `chatkit_agent_message` provider bound to that target agent. Use the returned `message_tool_provider_id`, or find the provider with `tilde_search_enabled_capabilities`, then map both provider functions onto an existing runtime MCP server:

- `chatkit_agent_message_send` persists an inbound ChatKit message and immediately returns `ticket_id`, `session_id`, `next_tool`, and `next_arguments`.
- `chatkit_agent_message_wait_for_response` subscribes to the live ChatKit session, emits streaming and queue-status MCP notifications, and returns the final persisted ChatKit message.

The model-facing tool names may be customized on the MCP server; follow the returned `next_tool` instruction rather than guessing. Pass a prior `session_id` to continue the same child conversation. The target agent's `concurrency_policy` controls queueing, interruption, and batching.

## Managed providers

Never guess provider IDs or credential source IDs. Take them from `tilde_search_available_capabilities`.

Call `tilde_enable_toolkit_provider` with:

- `team_id`
- `tool_group_source_type_id`
- `credential_source_type_id`
- `display_name`
- an existing credential ID only when the user supplied one

Use `tilde_auto_provision_toolkit_provider` when search results advertise an auto-provisioned provider app. It requires the provider and app identifiers returned by search.

## Proxied MCP and custom HTTP tools

Use `tilde_connect_proxied_mcp_server` for an existing Streamable HTTP MCP URL. Set its declared `auth_mode`; do not put secrets in names, URLs, or descriptions. Call `tilde_refresh_proxied_mcp_server` after the upstream tool catalog changes.

For the server-authored hosted-provider catalog, direct the user to **Tools** → **Proxied MCP servers** → **Browse provider catalog**. Every published entry exposes reviewed tool definitions before credentials are supplied; providers without a validated snapshot are not published as connectable. Tilde records whether each snapshot is an exact public `tools/list` result or was inferred from official source or documentation; an authenticated `tools/list` response replaces the snapshot after connection.

Do not ask the user to paste provider secrets into chat or into MCP arguments. OAuth client secrets, API keys, and bearer tokens must be entered through Tilde's credential setup. Dynamic OAuth client registrations are environment-specific and require authorization again after state import; pre-registered manual OAuth configurations remain declarative and their user credential is reconnected separately.

Use `tilde_register_custom_tool_backend` for a signed discovery endpoint created with Harness SDK `toolEndpoint`. Save the one-time signing key in the tool server, then call `tilde_refresh_custom_tool_backend` after its manifest changes.

For implementation patterns, inspect the [code review bot](https://github.com/trytilde/examples/tree/main/code-review-bot) and the rest of the [examples repository](https://github.com/trytilde/examples).

## Reverse proxies

Reverse proxies let application code call a provider's native API while Tilde injects its credential. Supported provider profiles are enabled by default.

- Call `tilde_list_reverse_proxies` to find profile IDs and proxy base URLs.
- Call `tilde_set_reverse_proxy_enabled` only when you need to change live traffic for a profile.

## Connect the deployed agent

Pass the runtime MCP server ID to Harness SDK `createMCPClient`. Follow the [human Tools guide](https://trytilde.ai/docs/tools) for the client code. The code review bot is the preferred reference for custom agents that combine MCP tools, local tools, and reverse proxies.
