---
title: "deployment"
description: "deploying to github pages"
---

# deployment

pages is designed to work with github pages, including project sites served
under a subpath.

## quick start

```bash
deno run -A jsr:@rnbguy/pages build
```

this generates the static site in `dist/`.

## github pages setup

### 1. configure base url

if your site is served at `https://username.github.io/repo-name`, set the url in
`config.yaml`:

```yaml
url: "https://username.github.io/repo-name"
```

this ensures:

- canonical links point to the right place
- og images resolve correctly
- assets load from the correct path

### 2. github actions

create `.github/workflows/deploy.yml`:

```yaml
#! file: .github/workflows/deploy.yml
name: deploy

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: denoland/setup-deno@v2
        with:
          deno-version: v2.x
      - run: deno run -A jsr:@rnbguy/pages build
      - uses: actions/upload-pages-artifact@v4
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

### 3. enable pages

1. go to repo settings > pages
2. set source to "github actions"
3. push to main

## local preview

```bash
deno run -A jsr:@rnbguy/pages serve
```

opens a local server at `http://localhost:8000` with the built site.

## custom domain

if using a custom domain like `example.com/pages`:

1. set up dns for your domain
2. add a `CNAME` file in `src/` with your domain
3. update `url` in `config.yaml`

---

see also:

- [features](/features) - what pages can do
- [configuration](/config) - config.yaml reference
- [markdown](/markdown) - content authoring
