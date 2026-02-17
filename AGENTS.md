# AGENTS

This file defines how AI/code agents should operate in this repository.

## Goal

Ship small, correct changes that match runtime behavior, schema validation,
docs, and PR workflow.

## Lessons from Recent Work

1. Keep config layers in sync
   - Any new config key must be updated in all relevant places:
     - `src/core/types.ts` (runtime schema + types)
     - `src/core/config.ts` (defaults)
     - `config.schema.json` (editor/schema validation)
     - `pages/config.md` (user-facing docs)

2. Do not drift from declared shapes
   - If `navBar` is a list, keep it a list everywhere.
   - Avoid introducing alternate shapes unless explicitly requested.

3. Security for user-provided links is mandatory
   - Always sanitize link-like values before rendering (`sanitizeHref`).
   - Keep escaping in HTML output (`escapeAttr`, `escapeHtml`).

4. Optional social fields should behave consistently
   - `github`, `twitter`, and `email` are optional.
   - If omitted/empty/invalid, do not render the icon/link.

5. Branch hygiene
   - If a PR was merged while work is in progress, rebase/reapply onto latest
     `main`.
   - Prefer a fresh branch for follow-up work.
   - Remove stale branches after replacement PRs are created.

## Required Verification Before Saying "Done"

- `deno check src/core/types.ts src/core/config.ts src/render.ts`
- `deno test --allow-read --allow-write`
- Confirm docs examples reflect real supported behavior.
- Confirm PR branch includes all expected file changes.

## Change Scope Rules

- Keep fixes focused; no unrelated refactors.
- Match existing style and naming in touched files.
- If behavior changes, update docs in the same change.
