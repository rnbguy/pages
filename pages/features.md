---
title: "features"
description: "what pages can do"
---

# features

pages is a minimal static site generator. here's what it does:

## content

- **markdown pages** with yaml frontmatter for metadata
- **ascii mermaid diagrams** rendered as preformatted text
- **code blocks** with optional filename headers
- **tables**, **alerts**, and standard gfm syntax
- **heading anchors** for direct linking to sections

## seo & social

- **og images** auto-generated per page (1200x630 png)
- **sitemap.xml** and **robots.txt**
- **llms.txt** and **llms-full.txt** for ai crawlers
- canonical urls with proper base path handling

## theming

- **light/dark themes** with system preference detection
- theme picker in header
- persistent preference via localstorage

## developer experience

- **raw .md links** for every page
- **live reload** during development
- **github pages ready** (works under subpaths like `/pages`)

## security

- safe html escaping
- strict url/path handling
- content security policy headers

---

see also:

- [markdown features](/markdown) - frontmatter, mermaid, code blocks, alerts
- [configuration](/config) - config.yaml reference
- [deployment](/deploy) - github pages setup
