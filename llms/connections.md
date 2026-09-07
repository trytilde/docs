# Enable connections

Use this managed Tilde skill before enabling a provider, choosing an account, or mapping connector tools. Native permissions control which operations the caller can perform. Chain the native API/MCP functions; do not create capability proposals or add a separate approval ceremony.

## Discover before changing anything

1. Identify the authenticated user, requesting agent, current session, and source channel from trusted runtime context. Read the relevant native records when an identifier is missing; do not infer identity or permissions from message prose.
2. Search the agent's enabled tools and the target user's enabled resources for the needed capability. Read the account identity (for example the Gmail address) and enabled functions. If the correct account and required functions are already usable, continue the task with no setup UI.
3. If multiple accounts could fit, ask which account to use. Do not add a duplicate provider account to avoid resolving the choice.

## Choose ownership and access

- Prefer a user/personal connection when it is the user's account and should be reusable by their other bots.
- Use an agent/bot connection when the account is explicitly dedicated to that bot and should not be generally available to the user's other bots.
- If unclear, ask: “Should your other bots also have access to this account?” A yes normally means user/personal ownership; a no normally means this bot's MCP.
- Discover the exact target MCP/resource IDs and inspect existing mappings. The agent's own bundle IDs are not substitutes for the user's IDs.

## Enable and broker

1. Discover the provider and credential-source IDs from `tilde_search_available_capabilities`; use returned schemas. Never guess IDs.
2. Invoke the native enable/setup operation, such as `tilde_enable_toolkit_provider` or provider auto-provisioning, with the selected ownership/target. Reuse an existing account whenever possible.
3. When the operation requires OAuth, managed credentials or an API key, its structured setup result drives the client. In API chat, the client renders one “Click to enable Provider” event card outside message bubbles and opens secure setup modals. Do not emit an extra account-selection card before discovery, and never ask for credential values in chat.
4. In WhatsApp, iMessage, Slack and other non-API channels, rich client modals are unavailable. Use the channel's `sendMessage` operation to send the server-returned broker URL or the supported Heyash/Dispatch/Tilde hosted setup URL. Use the native session/channel addressing from context. Do not invent a URL, send private tokens separately, or assume the recipient can see an API-chat card.
5. Follow the returned continuation/wait operation until credentials are active. On cancellation or failure, report the specific state; retry the same setup rather than creating a duplicate.

## Map and verify

Enable only the required provider functions, then map them to the selected user's or bot's MCP with native tool-enablement/mapping operations. Keep dependent calls ordered: first obtain the actual account/resource IDs, then use them in later calls. `MULTI_EXECUTE_TOOL` is a batching convenience, not a substitute for dependencies or authorization.

Read back account identity, active status and target MCP mappings before resuming the original task. Respect authorization errors; do not widen permissions, impersonate another user, copy credentials between owners, or fall back to a different account silently.
