# Contributing to Auto

Thank you for helping grow the AI tool catalog. Auto only recommends tools that exist in `data/tools/` — your PR directly improves what users discover.

## Adding a tool

1. Create a new YAML file: `data/tools/your-tool-id.yaml`
2. Use lowercase `id` with hyphens only (e.g. `my-cool-tool`)
3. Fill every required field honestly — users trust this list

### Template

```yaml
id: example-tool
name: Example Tool
url: https://example.com
category: general          # search | coding | app-builder | writing | image | video | automation | local | general
deployment: saas           # saas | local | api | hybrid
pricing: freemium          # free | freemium | paid
description: One or two sentences describing what the product does.
bestFor:
  - specific use case one
  - specific use case two
notFor:
  - when another tool type is better
tags: [tag1, tag2]
```

### Editorial bar

- **Real product** with a working public URL
- **Accurate** `bestFor` / `notFor` — help users avoid wrong picks
- **No duplicates** — check existing tools for overlap
- **English** descriptions
- One tool per PR when possible

## Validate locally

```bash
pnpm install
pnpm build
pnpm validate-catalog
```

## Regenerate embeddings

After changing any tool YAML, re-index so search stays accurate:

```bash
export OPENAI_API_KEY=sk-...
pnpm index-catalog
```

For local dev without indexing API access, `pnpm index-catalog:mock` uses deterministic mock vectors (lower quality retrieval).

Commit both the YAML and updated `data/embeddings.json`.

## Code changes

- TypeScript, English comments only when needed
- Match existing package structure
- Run `pnpm typecheck` before opening a PR

## Questions

Open a GitHub issue with the **Suggest a tool** label if you are unsure whether a product fits the catalog.
