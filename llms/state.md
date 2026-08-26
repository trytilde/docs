# Export and import Tilde state over Global MCP

Tilde resource state is portable even though Tilde does not require Terraform. Keep `tilde.state.yaml` beside a custom agent so another workspace can reproduce its agents, ChatKit providers, tools, MCP servers, skills, wikis, memory bindings, reverse proxies, and relationships.

State does not contain API keys, signing keys, provider credentials, conversation history, or memory content.

Portable resources use tagged `team`, `user`, or `user_team` ownership. Team export remains team-only by default. Personal and private-team resources require explicit inclusion and authorization, and import requires an `owner_mappings` entry from every source user ID to its target user ID. Missing mappings fail validation; never remove ownership or convert it to team ownership to make an import pass.

Selected skills are exported as checksum-bound packages. Their `SKILL.md` entrypoint and package-local references, templates, scripts, examples, and media are embedded so import can verify and recreate the complete package without fetching mutable upstream content. Provider source and revision metadata remain attached as provenance.

Curated hosted MCP connections export their stable catalog provider identity and declarative endpoint/authentication configuration. Dynamic OAuth client IDs, token endpoints discovered for that registration, access tokens, and refresh tokens are environment-specific and are not exported. On import, Tilde repeats discovery and dynamic client registration, then returns a one-time authorization URL. Manual OAuth configuration remains portable, while its user credential is reconnected through the normal pending-credential flow.

Use `https://api.trytilde.ai/mcp`. Call `tilde_whoami`, select a workspace, and pass its `team_id` to every function below.

## Export

1. Call `tilde_export_state` with `format: "yaml"`.
2. Write the returned `state` string unchanged to `tilde.state.yaml`.
3. Review and commit the file with the agent source.

For custom deployed agents, compare the state file and implementation with the [Hello World agent](https://github.com/trytilde/examples/tree/main/hello-world-agent), the [code review bot](https://github.com/trytilde/examples/tree/main/code-review-bot), and the rest of the [examples repository](https://github.com/trytilde/examples).

## Import

1. Read the complete state file as text.
2. Inspect each resource's `ownership`. For every `user` or `user_team` owner, build one `owner_mappings` object whose keys are source user IDs from the state and whose values are destination Tilde user IDs, for example `{ "source-user-id": "destination-user-id" }`. An empty object is valid only when the state has no user-owned resources.
3. Call `tilde_validate_state` with `state`, `format: "yaml"`, any declared string `variables`, and that `owner_mappings` object. Stop if `valid` is false.
4. Call `tilde_plan_state_import` with the identical `state`, `format`, `variables`, and `owner_mappings` fields.
5. Show the plan to the user. Do not apply conflicts, destructive changes, or unexpected replacements without approval.
6. Call `tilde_import_state` only after the plan is approved, again passing the same `owner_mappings` object beside `state`, `format`, and `variables`.
7. Poll `tilde_get_state_import` with the returned `import_id` until the status is `applied`, `failed`, or `rolled_back`.
8. Capture generated outputs the first time an applied result returns them. Applied outputs are one-time secrets and are cleared from later summary reads.
9. Save any one-time OAuth authorization URL returned in the import outputs and send it to the user immediately.
10. Tell the user to complete any remaining pending credential setup in Tilde.

Never call import as a substitute for plan. Use the same exact state, variables, and owner mappings for validation, planning, and application.

See the [human portable state guide](https://trytilde.ai/docs/terraform) for dashboard, CLI, multi-environment, and Deploy with Tilde workflows.
