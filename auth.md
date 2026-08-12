# Tilde auth.md

Tilde supports anonymous, agent-first registration followed by an optional human claim. An agent can create a temporary Tilde organization without waiting for a person to sign in, use the returned machine API key, and later transfer the temporary workspace and its supported resources to a human-owned organization.

This flow issues an API key directly. It is not an OAuth identity-assertion or token-exchange flow.

## Register anonymously

Send an unauthenticated request to:

```http
POST https://api.trytilde.ai/api/v1/identity/temporary-accounts
Content-Type: application/json
```

Both fields are optional:

```json
{
  "label": "code review agent",
  "human_email": "owner@example.com"
}
```

A successful response creates a temporary organization, team, and machine user. It returns:

- `org_id` and `team_id`
- `api_key` and `api_key_id`
- `claim_url` and a six-digit `claim_pin`
- `claim_token_expires_at` and `expires_at`

The temporary account lasts 24 hours. The initial claim URL lasts one hour.

## Use the credential

Send the returned API key in the `x-api-key` header:

```http
GET https://api.trytilde.ai/api/v1/identity/auth/whoami
x-api-key: <temporary-api-key>
```

You can also connect to the Tilde Global MCP server at `https://api.trytilde.ai/mcp` with the same header. Call `tilde_whoami` first and use its `team_id` for team-scoped tools.

Store the API key, claim URL, and PIN as secrets. Do not commit them, include them in logs, or send them to anyone other than the intended owner.

## Refresh an expired claim URL

If the claim URL expires while the temporary account is still active, create a new one with the temporary API key:

```http
POST https://api.trytilde.ai/api/v1/identity/temporary-accounts/claim-url
x-api-key: <temporary-api-key>
```

The six-digit PIN does not change.

## Hand off to a human

Give the intended owner the `claim_url` and `claim_pin` together. The human must:

1. Sign in to Tilde.
2. Select the organization that should own the temporary workspace.
3. Open the claim URL.
4. Enter the six-digit PIN on Tilde's claim page.
5. Wait for the page to confirm the transfer.

Five incorrect PIN attempts expire the current claim link. Generate a fresh link with the temporary API key if that happens.

Claiming transfers the temporary team and supported resources into the human's selected organization. Tilde revokes the temporary API key after a successful claim. Reconnect with human OAuth or create a new team-scoped machine API key, call `tilde_whoami` again, and update any organization-qualified URLs.

## Discovery and API reference

- OpenAPI: `https://trytilde.ai/openapi.json`
- Agent context: `https://trytilde.ai/llms.txt`
- Documentation: `https://trytilde.ai/docs`
- OAuth protected-resource metadata: `https://trytilde.ai/.well-known/oauth-protected-resource`
- OAuth authorization-server metadata: `https://trytilde.ai/.well-known/oauth-authorization-server`
- OpenID Connect metadata: `https://trytilde.ai/.well-known/openid-configuration`
- MCP server card: `https://trytilde.ai/.well-known/mcp/server-card.json`
- Platform agent card: `https://trytilde.ai/.well-known/agent-card.json`

Use OAuth when an agent acts on behalf of a signed-in human. Use a team-scoped machine API key for a deployed agent.
