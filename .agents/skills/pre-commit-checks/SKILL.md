---
name: pre-commit-checks
description: Validate public documentation without publishing internal engineering records.
---

# Validate public documentation

Follow [docs/README.md](../../../docs/README.md). Do not create, copy, commit, or
publish `docs/adrs/` or `docs/updates/`, including templates and historical files.
Keep architecture decisions and complete update records in the owning source
repository; record docs-only changes and validation in the PR body.

Inspect the actual base and preserve unrelated work. Verify public claims and
examples against source contracts, and update affected guides, setup instructions,
and navigation. Link companion API/SDK PRs and explain deployment order.

Run `npm run check:publication-boundary`, `mint validate`, `mint broken-links`,
`mint a11y`, and `git diff --check`. Report actual results and remaining external
publication work. When authorized, commit/push the reviewed files and create or
update the PR; do not add a PR-numbered update file. Merge only when authorized.
