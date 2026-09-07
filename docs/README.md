# Documentation publication boundary

This repository contains public Tilde documentation. Do not create, copy, commit,
or publish ADRs or PR/change update records here. In particular, `docs/adrs/` and
`docs/updates/` must remain absent, including historical records and templates.

Keep durable architecture decisions and detailed change records in the owning
API, Dispatch, or other source-code repository. Link their PRs or records from
this repository's PR description when useful. Describe docs-only rationale,
validation, and publication requirements in the PR description itself.

For each change, verify public examples against their owning API/SDK contracts,
update affected guides/navigation/setup instructions, and run
`npm run check:publication-boundary`, `mint validate`, `mint broken-links`, and
`mint a11y`. The publication guard rejects tracked or local internal-record
folders; `.mintignore` independently excludes internal repository documentation.

This policy supersedes the earlier requirement to keep ADRs and PR-numbered
update records in the documentation repository. Source repositories retain their
own record-maintenance requirements.
