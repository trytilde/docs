# Tilde documentation agent guide

This is the canonical Mintlify documentation repository for Tilde. Public guides
live in the root MDX pages and feature/guide directories; `docs.json` owns navigation.
Architecture decisions and detailed change records belong in the owning source
repository, never in this public docs repository.

## Documentation maintenance

Follow [docs/README.md](docs/README.md). Never create, copy, commit, or publish
`docs/adrs/` or `docs/updates/`, including historical records or templates.
Record docs-only intent, verification, and publication requirements in the PR
body. Link source-repository decisions/PRs when useful. Keep public pages,
examples, setup instructions, and navigation synchronized.

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
changes. Run `npm run check:publication-boundary` and review the final diff through PR
revisions. Use the [create-pr workflow](.agents/skills/create-pr/SKILL.md) when PR
publication is authorized; never fabricate a PR number or claim a deployment.
