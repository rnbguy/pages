---
title: "pages"
description: "minimal static site generator built on deno and markdown"
---

# pages

minimal static site generator for a personal site. built on deno, markdown, and
a tiny amount of custom glue.

## quick start

```bash
deno task build   # build to dist/
deno task serve   # preview locally
```

## example page

<!-- deno-fmt-ignore -->
```markdown
---
title: "hello world"
description: "my first page"
---

# hello world

this is a markdown page with **bold**, *italic*, and `code`.
```

## structure

```
pages/        # markdown + static assets
src/          # ssg code
dist/         # build output
config.yaml   # site settings
```

## learn more

- [features](/features) - what pages can do
- [markdown](/markdown) - frontmatter, mermaid, code blocks, alerts
- [configuration](/config) - config.yaml reference
- [deployment](/deploy) - github pages setup
