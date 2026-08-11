# Configure local agents with Tilde Dev Tunnels

Global MCP configures the local endpoint, but it cannot start a process on the user's machine. The authenticated tunnel command is a local CLI step.

## Global MCP step

Call `tilde_register_chatkit_agent` with:

- the target `team_id`
- `display_name`
- `endpoint_url` set to the local route path, for example `api/hello-world`
- `local_running_endpoint: true`

Give the returned API key and webhook signing key to the human for secure server-side storage.

## Local CLI steps

Ask the user or local coding agent to run:

```bash
pnpm add -D @trytilde/cli
pnpm exec tilde auth login
pnpm exec tilde tunnel -- pnpm dev
```

Replace `pnpm dev` with the application's normal development command. If the selected workspace is wrong, run `pnpm exec tilde auth set-team`.

The CLI starts a managed Cloudflare tunnel and passes the chosen local port to the process as `PORT` and `TUNNEL_PORT`. Keep the process running while Tilde delivers ChatKit messages, webhooks, and tool invocations.

Signed Harness SDK wrappers such as `chatKitEndpoint` reject ChatKit requests without a valid Tilde signature. That protects the wrapped agent endpoint; it does not secure unrelated routes.

**Warning:** the tunnel exposes every page and API route served by the development process to the public internet. Disable unneeded routes or protect them with authentication.

Test the registered agent in [Mission Control](https://api.trytilde.ai/mission-control). Select the same workspace before starting a session. See the [human Dev Tunnels guide](https://trytilde.ai/docs/dev-tunnels).
