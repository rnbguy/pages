---
title: "configuration"
description: "config.yaml reference"
---

# configuration

all site settings live in `config.yaml` at the project root.

## paths

| key    | type   | description                                                 |
| ------ | ------ | ----------------------------------------------------------- |
| `src`  | string | source directory for markdown files (default: `src`)        |
| `dest` | string | output directory for built site (default: `dist`)           |
| `port` | number | dev server port (default: `8000`)                           |
| `url`  | string | base url for the site (used for canonical links, og images) |

## site metadata

| key           | type   | description                              |
| ------------- | ------ | ---------------------------------------- |
| `title`       | string | site title shown in header and og images |
| `description` | string | default meta description                 |
| `lang`        | string | html lang attribute (default: `en`)      |
| `author`      | string | default author for pages                 |

## branding

| key           | type   | description                            |
| ------------- | ------ | -------------------------------------- |
| `logo`        | string | path to logo image (optional)          |
| `faviconText` | string | single character for generated favicon |

## seo

| key        | type          | description                                                            |
| ---------- | ------------- | ---------------------------------------------------------------------- |
| `robots`   | string        | robots meta directive (default: `index, follow`)                       |
| `github`   | string        | optional github username for footer icon                               |
| `linkedin` | string        | optional linkedin username for footer icon                             |
| `email`    | string        | optional email address for footer icon                                 |
| `image`    | string/object | default og image - `"github"`, `"twitter"`, `{ file: "path" }`, or url |

## opengraph

```yaml
og:
  type: website
  locale: en_US
```

## twitter cards

```yaml
twitter:
  card: summary_large_image
  site: "@handle"
  profile: "@handle"
```

github, linkedin, twitter (`site`/`profile`), and email are optional. if omitted
or empty, the related footer icon is not rendered.

## mermaid

```yaml
mermaid:
  useAscii: true # render as ascii art (vs svg)
  paddingX: 5 # horizontal padding
  paddingY: 5 # vertical padding
  boxBorderPadding: 1 # padding inside boxes
```

## navigation

```yaml
navBar:
  - about # links to /about
  - projects # links to /projects
  - GitLab: https://gitlab.com/yourname # custom external link
  - Contact: /reach-me # custom internal link
```

array of navigation items shown in the header. each item can be:

- a string slug (`about`) that links to `/<slug>`
- a single-key object (`Label: URL`) for arbitrary links

## example

```yaml
#! file: config.yaml
src: src
dest: dist
port: 8000
url: "https://example.com"

title: "my site"
description: "a personal site"
lang: en
author: "your name"

faviconText: "m"

robots: "index, follow"
# optional social links (omit or set empty to hide icon)
github: "your-github-handle"
linkedin: "your-linkedin-username"
twitter:
  card: summary_large_image
  site: "@yourhandle"
  profile: "@yourhandle"
email: "you@example.com"

mermaid:
  useAscii: true

navBar:
  - about # links to /about
  - blog # links to /blog
  - GitLab: https://gitlab.com/yourname # custom external link
  - Contact: /reach-me # custom internal link
```

---

see also:

- [features](/features) - what pages can do
- [markdown](/markdown) - content authoring
- [deployment](/deploy) - github pages setup
