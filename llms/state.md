# Export and import Tilde state over Global MCP

Tilde resource state is portable even though Tilde does not require Terraform. Keep `tilde.state.yaml` beside a custom agent so another workspace can reproduce its agents, ChatKit providers, tools, MCP servers, skills, wikis, memory bindings, reverse proxies, and relationships.

State does not contain API keys, signing keys, provider credentials, conversation history, or memory content.

Use `https://api.trytilde.ai/mcp`. Call `tilde_whoami`, select a workspace, and pass its `team_id` to every function below.

## Export

1. Call `tilde_export_state` with `format: "yaml"`.
2. Write the returned `state` string unchanged to `tilde.state.yaml`.
3. Review and commit the file with the agent source.

For custom deployed agents, compare the state file and implementation with the [Hello World agent](https://github.com/trytilde/examples/tree/main/hello-world-agent), the [code review bot](https://github.com/trytilde/examples/tree/main/code-review-bot), and the rest of the [examples repository](https://github.com/trytilde/examples).

## Import

1. Read the complete state file as text.
2. Call `tilde_validate_state` with `state`, `format: "yaml"`, and any declared string `variables`. Stop if `valid` is false.
3. Call `tilde_plan_state_import` with the identical state, format, and variables.
4. Show the plan to the user. Do not apply conflicts, destructive changes, or unexpected replacements without approval.
5. Call `tilde_import_state` only after the plan is approved.
6. Poll `tilde_get_state_import` with the returned `import_id` until the status is `applied`, `failed`, or `rolled_back`.
7. Capture generated outputs the first time an applied result returns them. Applied outputs are one-time secrets and are cleared from later summary reads.
8. Tell the user to complete any pending credential setup in Tilde.

Never call import as a substitute for plan. Use the same exact state and variables for validation, planning, and application.

See the [human portable state guide](https://trytilde.ai/docs/terraform) for dashboard, CLI, multi-environment, and Deploy with Tilde workflows.
