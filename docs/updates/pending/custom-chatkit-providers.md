# Custom ChatKit provider documentation

PR: Pending

## Intent of the change

Explain how customers register, host, configure, and operate TypeScript ChatKit
providers, including session tools, private delivery, and streaming clients.

## Architecture changes

ADR review: no new decision. This documentation records the approved companion
API and SDK contracts; it introduces no independent runtime architecture change.
The existing repository documentation convention remains applicable. Runtime
boundaries are recorded in the companion API ADR-0023 and SDK ADR-0001.

```mermaid
flowchart LR
  API[API contracts and lifecycle] --> Guide[Custom provider guide]
  SDK[SDK authoring and examples] --> Guide
  Guide --> People[Dashboard and SDK users]
  API --> MCP[Agent-facing MCP instructions]
```

## Summarized changes

- Add the custom provider guide and navigation entry; link it from ChatKit.
- Explain discovery/setup, OAuth resume, scoped ingestion, session tools, rich
  email/BCC semantics, delivery recovery, streaming authorization, and imports.
- Add exact Global MCP management actions and secret-handling instructions to
  the hidden ChatKit agent guide.
- Mintlify build validation, broken-link checks, and accessibility checks passed
  during implementation; diff checks passed during PR preparation.
- The draft predates subsequent main-branch documentation changes and needs
  integration review before publishing. No documentation deployment or live
  API-backed tool catalog regeneration was performed.
- Related API PR: Pending. Related SDK PR: Pending.

## Critical to apply

yes

Publish this guide with the compatible API and SDK releases. Deploy the additive
API and upgrade workers before enabling custom providers, then release the SDK.
Regenerate API-backed tool catalog pages from that deployment; do not advertise
these endpoints as available on older deployments. Keep the hidden agent guide
out of sidebar navigation.
