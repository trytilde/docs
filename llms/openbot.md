# Hosted OpenBot

Create a complete cloud-hosted OpenBot instance with the REST API. This is organization-admin work and is not a team-scoped Global MCP function.

`POST /api/v1/identity/organizations/{org_id}/openbot/deployments`

```json
{
  "title": "Research workspace",
  "slug": "research-workspace"
}
```

Use a human bearer token when acting for an organization administrator. The slug is a globally unique lowercase DNS label of 3–48 characters. The call creates a dedicated `openbot-<slug>` team, agent-owned instance API key and OIDC audience, Vercel control and agent projects, persistent Vercel Sandbox, project-OIDC AI Gateway access, a deterministic `openbot-<slug>-control.vercel.app` hostname, and starts OpenBot deployment. That installation API key can create and reconcile ChatKit agents under its ordinary team permissions. Custom Cloudflare hostnames are a follow-up and do not block provisioning.

The response returns `status: "provisioning"`, `team_id`, `hostname`, `deployment_url`, `vercel_control_project`, `vercel_agent_project`, `vercel_sandbox`, `bootstrap_command_id`, and `oauth`. Repeating the request reconciles deterministic infrastructure for the same organization and slug.

Hosted Git is local to the persistent Sandbox. Do not add GitHub credentials unless the owner later chooses an external forge. Never copy the Tilde-owned Vercel token into the repository, SOPS document, logs, or project environment.

Tilde-managed Vercel project OIDC enables OpenBot hosted-inference billing. The managed release forwards only the non-secret billing marker; it never forwards the Vercel token or a static Gateway key. Reserve organization AI credits before every Gateway call. Persist intent and generation through the current AgentRun effect ledger. Commit authoritative system/fallback receipts and release authoritative BYOK receipts. Vercel BYOK can fall back to charged system credentials, so BYOK does not bypass reservation and zero-credit organizations cannot start Gateway calls. Direct owner Gateway keys and Codex subscription inference remain outside hosted metering.

Never replay a planned, uncertain, or reconciled inference effect. If billing can be reconciled but the model response cannot be recovered, terminally fail the old run; a later owner trigger creates a new run. Hosted run cost uses the authoritative receipt after each call. A run-level `max_cost_microusd` guard can overshoot by that final call, while the organization balance is still preflight-gated.

OpenBot automatic memory is shipped and defaults to `none`. Persist `OPENBOT_AUTOMATIC_MEMORY_MODE` or `AGENT_<ID>_AUTOMATIC_MEMORY_MODE`. Only `personal_plus_agent` provisions an owned bank. The bundle field `memory.bank.synthesizer_agent_id` names a stable same-team ChatKit agent key; OpenBot uses `memory-catcher`. Omission preserves the current/server-default assignment, and `memory.bank.enabled: false` deletes the lifecycle-owned bank. Memory Catcher inherits the selected Codex, direct Gateway, or managed-OIDC inference adapter and submits every synthesis mutation and completion with the job's exact batch, complete evidence set, and fresh lease owner.

For managed OIDC, Memory Catcher must call the synthesis session's `validate-batch` endpoint before creating its AgentRun, reserving credits, or invoking Gateway. Tilde accepts only the deterministic current prompt chunk under the active lease. Use generation-stable effect identity with current generation/worker-fenced writes. Retry a committed credit receipt or BYOK release without another reservation or provider call, then terminally fail the response-less run.

For redeployment, use the team-scoped hosted-instance routes under `/api/v1/team/{team_id}/identity/openbot/instances/{instance_id}`. Create a service-specific release, upload each declared SHA-1 Build Output API file, finalize it, then poll the release. Never send a Vercel project ID: Tilde derives it from the hosted instance. Runtime configuration accepts only user-owned OpenBot values and rejects Vercel, AWS, SOPS, static AI Gateway, and caller-supplied Tilde tenant credentials. Tilde installs canonical tenant, OAuth, origin, and Computer identity from authenticated server state. Computer image updates must be immutable `vcr.vercel.com/...@sha256:...` references owned by the instance control project, which also owns the persistent Sandbox.
