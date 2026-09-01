# Export and import Tilde state over Global MCP

Tilde resource state is portable even though Tilde does not require Terraform. Keep `tilde.state.yaml` beside a custom agent so another workspace can reproduce its agents, ChatKit providers, tools, MCP servers, skills, wikis, memory bindings, reverse proxies, and relationships.

State does not contain API keys, signing keys, provider credentials, conversation history, or memory content.

Self-extension proposal state contains only secret-free intent, the server-authored preview, an optional secret-free setup continuation, and source receipts for audit. It excludes approval principals, Human Approval tokens, worker leases, runtime status, one-time outputs, and rollback authority. Import creates a new pending proposal with a new destination approval; it never imports an executed or approved state, and it never uses source receipts to delete destination resources.

Portable resources use tagged `team`, `user`, or `user_team` ownership. Team export remains team-only by default. Personal and private-team resources require explicit inclusion and authorization, and import requires an `owner_mappings` entry from every source user ID to its target user ID. Missing mappings fail validation; never remove ownership or convert it to team ownership to make an import pass.

Selected skills are exported as checksum-bound packages. Their `SKILL.md` entrypoint and package-local references, templates, scripts, examples, and media are embedded so import can verify and recreate the complete package without fetching mutable upstream content. Provider source and revision metadata remain attached as provenance.

Curated hosted MCP connections export their stable catalog provider identity and declarative endpoint/authentication configuration. Dynamic OAuth client IDs, token endpoints discovered for that registration, access tokens, and refresh tokens are environment-specific and are not exported. On import, Tilde repeats discovery and dynamic client registration, then returns a one-time authorization URL. Manual OAuth configuration remains portable, while its user credential is reconnected through the normal pending-credential flow.

Use `https://api.trytilde.ai/mcp`. Call `tilde_whoami`, select a workspace, and pass its `team_id` to every function below.

## Export

1. Call `tilde_export_state` with `format: "yaml"`.
2. Write the returned `state` string unchanged to `tilde.state.yaml`.
3. Review and commit the file with the agent source.

For custom deployed agents, compare the state file and implementation with the [Hello World agent](https://github.com/trytilde/examples/tree/main/hello-world-agent), the [code review bot](https://github.com/trytilde/examples/tree/main/code-review-bot), and the rest of the [examples repository](https://github.com/trytilde/examples).

Common providers such as Linq export as one `common_provider/installation` root plus a `credential/setup_item`. Generated Tool, ChatKit, Signal, and Reverse Proxy resources are common-owned aliases, not independent installations. Never place API tokens, webhook subscription IDs, or signing secrets in state. After import, complete the pending credential once so reconciliation restores the whole bundle.

## Import

1. Read the complete state file as text.
2. Call `tilde_validate_state` with `state`, `format: "yaml"`, and any declared string `variables`. Stop if `valid` is false.
3. Call `tilde_plan_state_import` with the identical state, format, and variables.
4. Show the plan to the user. Do not apply conflicts, destructive changes, or unexpected replacements without approval.
5. Call `tilde_import_state` only after the plan is approved.
6. Poll `tilde_get_state_import` with the returned `import_id` until the status is `applied`, `failed`, or `rolled_back`.
7. Capture generated outputs the first time an applied result returns them. Applied outputs are one-time secrets and are cleared from later summary reads.
8. Save any one-time OAuth authorization URL returned in the import outputs and send it to the user immediately.
9. Tell the user to complete any remaining pending credential setup in Tilde.

Never call import as a substitute for plan. Use the same exact state and variables for validation, planning, and application.

See the [human portable state guide](https://trytilde.ai/docs/terraform) for dashboard, CLI, multi-environment, and Deploy with Tilde workflows.
