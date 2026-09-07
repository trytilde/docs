# Tilde documentation agent guide

This is the canonical Mintlify documentation repository for Tilde. Public guides
live in the root MDX pages and feature/guide directories; `docs.json` owns navigation.
Internal architecture and PR records live under `docs/adrs` and `docs/updates` and
are excluded from site publication by `.mintignore`.

## Documentation maintenance

For every change, follow [docs/README.md](docs/README.md) and
[maintain-docs](.agents/skills/maintain-docs/SKILL.md). Read governing ADRs, record
resolved durable decisions, maintain the current pending/PR-numbered update record,
and keep affected public pages and navigation synchronized. Do not ask again about
already-authorized decisions or preserve obsolete setup prompts.

## Public content

- Confirm API/SDK examples against the owning source and generated contract.
- Use `@trytilde/sdk` and the corresponding adapters for the current SDK.
- Distinguish Tilde login accounts, organization-owned runtime identities, teams,
  and organization proxy credentials. Runtime identities do not imply paid seats.
- Keep application proxy credentials server-only and document trusted session/team
  resolution for frontend integrations.
- Link related API/SDK/application PRs and coordinate publication with their release.
  Do not claim unreleased features are already deployed or simulated checks are live.
- Use concise active prose, sentence-case headings, and descriptive links. Prefer
  Mintlify components and match surrounding pages. Give images meaningful alt text.
- Never include secret values, private transcripts, or environment-owned data.

## Validation and publication

Run `mint validate`, `mint broken-links`, and `mint a11y` after content/navigation
changes. Review the final diff and keep the same update record current through PR
revisions. Use the [create-pr workflow](.agents/skills/create-pr/SKILL.md) when PR
publication is authorized; never fabricate a PR number or claim a deployment.
