# CONTRIBUTION

Thanks for contributing to `pages`.

## Development Workflow

1. Branch from latest `main`.
2. Make focused changes (one concern per PR).
3. Run format/lint/check/test locally.
4. Update docs when behavior or config changes.
5. Open PR with a short summary and verification notes.

## Local Verification

Run these before opening or updating a PR:

```bash
deno fmt --check
deno lint
deno check src/core/types.ts src/core/config.ts src/render.ts
deno test --allow-read --allow-write
```

## Render and Preview (for content/UI changes)

When changes affect rendered output (templates, styles, markdown/pages, config
shape), verify the final site locally:

```bash
deno task build
deno task serve
```

Then open `http://localhost:8000` and confirm the rendered page looks correct.

For quick local iteration, you can run the same pair after each UI/content
change before pushing updates.

## Config Change Checklist

When adding/changing config behavior, update all of:

- `src/core/types.ts` (schema and TypeScript types)
- `src/core/config.ts` (defaults)
- `config.schema.json` (YAML/JSON schema validation)
- `pages/config.md` (user docs and examples)

## Consistency Requirements

Keep related sources consistent when behavior changes. If a change touches one,
review and update the others as needed:

- Code (`src/**`) and runtime behavior
- Validation schema (`config.schema.json`)
- Config docs/examples (`pages/config.md`)
- Project docs (`README.md`, rendered by this tool as the site/landing page)
- Source markdown content under `src/` when relevant

## Security and Data Handling

- Validate and sanitize user-provided values before rendering.
- Escape rendered HTML attributes/text using existing helpers.
- Do not render optional links/icons when values are missing, empty, or invalid.

## PR Hygiene

- If your branch falls behind because another PR merged, reapply work onto
  latest `main`.
- Close or delete stale branches once replacement PRs are opened.
- Keep commit messages concise and descriptive.

## Scope and Style

- Keep fixes minimal; avoid unrelated refactors.
- Match existing naming and code style in touched files.
- Add tests for behavior changes when practical.
