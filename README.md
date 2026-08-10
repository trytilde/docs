# Tilde documentation

This repository contains the Tilde documentation site built with Mintlify.

## Tool provider catalog

The public Tilde API is the source of truth for tool providers, authentication methods, icons, and tools:

```text
https://api.trytilde.ai/api/v1/mcp/available-tool-groups
```

The catalog fetches this endpoint in the browser so provider and tool information stays current. Mintlify requires a physical MDX file for every indexable route, so the repository also stores API-generated provider pages and a generated catalog fallback.

Regenerate them whenever the API catalog changes:

```bash
npm run generate:tool-providers
```

The generator:

- fetches every page of the public catalog without authentication;
- creates or updates `/tool-providers/<provider>.mdx` with SEO metadata and API content;
- updates `snippets/generated-tool-providers.jsx` for the initial catalog render;
- removes stale files only when they carry the generator marker;
- fails instead of replacing the catalog when the API is unavailable or empty.

Do not edit generated provider pages or `snippets/generated-tool-providers.jsx` by hand. Change the API data or the generator template, then regenerate.

Check that committed files match the current API without writing changes:

```bash
npm run check:tool-providers
```

Set `TILDE_TOOL_PROVIDER_CATALOG_URL` to test against another compatible catalog endpoint.

## Development

Use Node.js 20 through 24. Install the [Mintlify CLI](https://www.npmjs.com/package/mint):

```bash
npm i -g mint
```

Generate the API-backed pages and start the local preview:

```bash
npm run dev
```

View your local preview at `http://localhost:3000`.

Before publishing, regenerate and commit any API-derived changes, then run:

```bash
npm run check
```

## AI-assisted writing

Install Mintlify's documentation skill for your coding tools:

```bash
npx skills add https://mintlify.com/docs
```

## Publishing changes

Mintlify deploys committed changes through its GitHub app. Generated tool-provider files must be committed because Mintlify maps indexable routes to MDX files in the repository.

## Need help?

### Troubleshooting

- If your dev environment isn't running: Run `mint update` to ensure you have the most recent version of the CLI.
- If a page loads as a 404: Make sure you are running in a folder with a valid `docs.json`.

### Resources
- [Mintlify documentation](https://mintlify.com/docs)
