# Hosted OpenBot

Create a complete cloud-hosted OpenBot instance with the REST API. This is organization-admin work and is not a team-scoped Global MCP function.

`POST /api/v1/identity/organizations/{org_id}/openbot/deployments`

```json
{
  "title": "Research workspace",
  "slug": "research-workspace"
}
```

Use human OAuth when acting for an organization administrator. The slug is a globally unique lowercase DNS label of 3–48 characters. The call creates a dedicated `openbot-<slug>` team, instance API key and OIDC audience, Vercel control and agent projects, persistent Vercel Sandbox, project-OIDC AI Gateway access, a deterministic `openbot-<slug>-control.vercel.app` hostname, and starts OpenBot deployment. Custom Cloudflare hostnames are a follow-up and do not block provisioning.

The response returns `status: "provisioning"`, `team_id`, `hostname`, `deployment_url`, `vercel_control_project`, `vercel_agent_project`, `vercel_sandbox`, `bootstrap_command_id`, and `oauth`. Repeating the request reconciles deterministic infrastructure for the same organization and slug.

Hosted Git is local to the persistent Sandbox. Do not add GitHub credentials unless the owner later chooses an external forge. Never copy the Tilde-owned Vercel token into the repository, SOPS document, logs, or project environment.

For redeployment, use the team-scoped hosted-instance routes under `/api/v1/team/{team_id}/identity/openbot/instances/{instance_id}`. Create a service-specific release, upload each declared SHA-1 Build Output API file, finalize it, then poll the release. Never send a Vercel project ID: Tilde derives it from the hosted instance. Runtime configuration accepts only user-owned OpenBot values and rejects Vercel, AWS, SOPS, static AI Gateway, and caller-supplied Tilde tenant credentials. Tilde installs canonical tenant, OAuth, origin, and Computer identity from authenticated server state. Computer image updates must be immutable `vcr.vercel.com/...@sha256:...` references owned by the instance control project, which also owns the persistent Sandbox.
