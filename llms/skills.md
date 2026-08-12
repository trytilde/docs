# Configure skills over Tilde Global MCP

A skill is a focused instruction document. A registry groups skills and exposes progressive discovery tools so an agent loads full instructions only when relevant.

Tilde also synchronizes trusted upstream `SKILL.md` providers. Built-in sources are restricted to official repositories and, for monorepos such as Cursor plugins and YC Software QM, server-authored include and exclude paths. QM contributes only its portable `popular-web-designs` and `taste-skill` packages; runtime-specific QM administration, credential, connector, memory, browser, and publishing instructions are excluded. Do not construct arbitrary trusted-provider URLs or assume that every MCP provider publishes skills. Select only skills returned by Tilde's provider and skill listing functions.

Successful provider syncs retain each complete bounded skill package: `SKILL.md` plus package-local references, templates, scripts, examples, and media. Relative paths and media types are preserved; unsafe paths and symbolic links are rejected. Sync is failure-atomic, so an unreadable or invalid file does not purge the last valid provider snapshot. Deleted and renamed upstream skills stop being advertised only after a complete successful reconciliation.

Exported state embeds selected package files with checksums so import can verify and recreate every referenced asset in the target workspace. It never includes a plaintext credential or an unverified repository payload.

When a loaded `SKILL.md` refers to another package file, call `GET /api/v1/team/{team_id}/skill/{skill_id}/package` to inspect the immutable manifest. Then call `POST /api/v1/team/{team_id}/skill/{skill_id}/package/download` with the manifest `path` to obtain a short-lived download URL.

For example, if the manifest contains `examples/analyze.py`, download and access it like this:

```bash
API_BASE="https://api.trytilde.ai/api/v1"

MANIFEST=$(curl --fail --silent --show-error \
  -H "x-api-key: $TILDE_API_KEY" \
  "$API_BASE/team/$TILDE_TEAM_ID/skill/$TILDE_SKILL_ID/package")

PYTHON_PATH=$(printf '%s' "$MANIFEST" | \
  jq -r '.files[] | select(.path == "examples/analyze.py") | .path')
PYTHON_SHA256=$(printf '%s' "$MANIFEST" | \
  jq -r '.files[] | select(.path == "examples/analyze.py") | .checksum_sha256')

DOWNLOAD_URL=$(curl --fail --silent --show-error \
  -X POST \
  -H "x-api-key: $TILDE_API_KEY" \
  -H "content-type: application/json" \
  --data "$(jq -n --arg path "$PYTHON_PATH" '{path: $path}')" \
  "$API_BASE/team/$TILDE_TEAM_ID/skill/$TILDE_SKILL_ID/package/download" | \
  jq -r '.url')

curl --fail --silent --show-error "$DOWNLOAD_URL" -o /tmp/analyze.py
printf '%s  %s\n' "$PYTHON_SHA256" /tmp/analyze.py | sha256sum --check
sed -n '1,160p' /tmp/analyze.py
python3 /tmp/analyze.py
```

Use `https://api.trytilde.ai/mcp`. Call `tilde_whoami`, select a workspace, and pass its `team_id` to every function below.

## Create a registry from team-owned skills

1. Call `tilde_create_skill` for each focused instruction document. Use a lowercase, hyphenated name, a concise discovery description, and complete Markdown content.
2. Call `tilde_list_skills` if you need to recover the created skill IDs.
3. Call `tilde_create_skill_registry` with a focused name, description, and `skill_ids`.
4. To change membership, call `tilde_update_skill_registry` with the complete desired `skill_ids` array. It replaces the current selection.
5. Call `tilde_list_skill_registries` to verify the registry and obtain its ID.

A registry's private provider is created and enabled automatically. It exposes `list_skills`, `search_skills`, `read_skill_description`, and `read_skill`.

## Expose discovery to an agent

1. Call `tilde_search_enabled_capabilities` using the registry name.
2. Find the registry-bound provider and its four discovery functions.
3. Map each function to the agent's runtime MCP server with `tilde_set_mcp_server_tool_enabled`.
4. Verify the mappings with `tilde_search_enabled_capabilities`, filtered by `mcp_server_instance_id`.

Tell the runtime agent to search summaries first, read one description, and load the full skill only when it is relevant.

## Inspect a registry from Global MCP

- `tilde_list_skill_summaries`: list concise entries without full content.
- `tilde_search_skill_registry`: semantically search one registry.
- `tilde_read_skill_description`: inspect one candidate.
- `tilde_read_skill`: load the complete content.

Harness SDK also exposes programmatic access through `context.skills` inside `chatKitEndpoint`. Use it when application code already knows the registry or skill to load. See the [human Skills guide](https://trytilde.ai/docs/skills).
