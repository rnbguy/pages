import { Monitor, Moon, Sun } from "lucide-static";
import { siGithub, siGmail, siTwitter } from "simple-icons";
import { readSiteCss } from "./styles.ts";
import { escapeAttr, escapeHtml, sanitizeHref } from "./core/security.ts";
import { fnv1a, THEMES } from "./core/themes.ts";
import type { Config, Page } from "./core/types.ts";
import {
  FONT_CSS_400,
  FONT_CSS_400_INTEGRITY,
  FONT_CSS_700,
  FONT_CSS_700_INTEGRITY,
  PAGES_TOOL_URL,
} from "./core/constants.ts";
import { applyBasePath, basePathFromUrl } from "./core/url.ts";
import { resolveImageUrl, resolvePageImage } from "./image.ts";

function iconSvg(svg: string): string {
  return svg
    .replace("<svg", '<svg aria-hidden="true" focusable="false"')
    .replace(/<title>.*?<\/title>/, "");
}

const ICON_SUN = iconSvg(Sun.trim());
const ICON_MOON = iconSvg(Moon.trim());
const ICON_MONITOR = iconSvg(Monitor.trim());
const ICON_MAIL = iconSvg(siGmail.svg);

export async function renderSiteCss(): Promise<string> {
  return await readSiteCss();
}

export function renderThemesJson(): string {
  const themePairs = Object.entries(THEMES).map(([name, pair]) => [name, {
    light: pair.light.id,
    dark: pair.dark.id,
  }]);
  return JSON.stringify(Object.fromEntries(themePairs));
}

export function renderSiteJs(themesJson: string, defaultTheme: string): string {
  return (
    `(() => {\n` +
    `  var d = document, h = d.documentElement;\n` +
    `  var T = ${themesJson};\n` +
    `  var sun = ${JSON.stringify(ICON_SUN)};\n` +
    `  var moon = ${JSON.stringify(ICON_MOON)};\n` +
    `  var monitor = ${JSON.stringify(ICON_MONITOR)};\n` +
    `  var mb = d.querySelector('.mode-btn'), db = d.querySelector('.drop-btn'), menu = d.querySelector('.theme-menu');\n` +
    `  var ls = window.localStorage;\n` +
    `  var mode = ls.getItem('mode') || 'system', theme = ls.getItem('theme') || '${defaultTheme}';\n` +
    `  var prefers = () => window.matchMedia('(prefers-color-scheme: dark)').matches;\n` +
    `  var isDark = () => mode === 'dark' || (mode === 'system' && prefers());\n` +
    `  var apply = () => {\n` +
    `    var p = T[theme] || T['${defaultTheme}'];\n` +
    `    h.setAttribute('data-theme', isDark() ? p.dark : p.light);\n` +
    `    d.querySelectorAll('[data-theme-pick]').forEach(function(x){\n` +
    `      var active = x.getAttribute('data-theme-pick') === theme;\n` +
    `      x.classList.toggle('active', active);\n` +
    `    });\n` +
    `    mb.innerHTML = mode === 'light' ? sun : (mode === 'dark' ? moon : monitor);\n` +
    `  };\n` +
    `  mb.onclick = function(){ mode = mode === 'dark' ? 'light' : (mode === 'light' ? 'system' : 'dark'); ls.setItem('mode', mode); apply(); };\n` +
    `  db.onclick = function(){ var open = menu.classList.toggle('open'); db.setAttribute('aria-expanded', open ? 'true' : 'false'); };\n` +
    `  d.onclick = function(e){ if (!d.querySelector('.theme-picker').contains(e.target)){ menu.classList.remove('open'); db.setAttribute('aria-expanded','false'); } };\n` +
    `  menu.onclick = function(e){ var btn = e.target.closest('button'); if (!btn) return; var t = btn.getAttribute('data-theme-pick'); if (t){ theme = t; ls.setItem('theme', t); apply(); menu.classList.remove('open'); db.setAttribute('aria-expanded','false'); db.focus(); } };\n` +
    `  apply();\n` +
    `  if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', apply);\n` +
    `})();\n`
  );
}

export function renderPage(page: Page, cfg: Config, ogPath?: string): string {
  const basePath = basePathFromUrl(cfg.url);

  const assetBase = applyBasePath(basePath, "/assets");
  const faviconLight = `${assetBase}/favicon-light.svg`;
  const faviconDark = `${assetBase}/favicon-dark.svg`;
  const rootHref = applyBasePath(basePath, "/");
  const pagesToolUrl = PAGES_TOOL_URL;

  const canonical = `${cfg.url}${page.url}`;
  const is404 = page.slug === "404";
  const title = is404
    ? `Not Found - ${cfg.title}`
    : page.meta.title
    ? `${page.meta.title} - ${cfg.title}`
    : cfg.title;
  const desc = page.meta.description ?? cfg.description;
  const pageImage = ogPath
    ? `${cfg.url}/assets/${ogPath}`
    : resolvePageImage(cfg, page.meta.image);
  const date = page.meta.date instanceof Date
    ? page.meta.date.toISOString()
    : page.meta.date ?? "";
  const keywords = page.meta.tags?.join(", ") ?? "";

  const twitterProfile = cfg.twitter.profile?.trim() ?? "";
  const twitterUrl = twitterProfile
    ? `https://twitter.com/${twitterProfile.replace(/^@/, "")}`
    : "";
  const twitterIcon = twitterUrl
    ? `<a class="social-link" href="${
      escapeAttr(twitterUrl)
    }" aria-label="twitter profile" title="twitter">${
      iconSvg(siTwitter.svg)
    }</a>`
    : "";
  const githubUrl = cfg.github ? `https://github.com/${cfg.github}` : "";
  const githubIcon = githubUrl
    ? `<a class="social-link" href="${
      escapeAttr(githubUrl)
    }" aria-label="github profile" title="github">${iconSvg(siGithub.svg)}</a>`
    : "";
  const emailValue = cfg.email?.trim() ?? "";
  const emailHref = emailValue
    ? sanitizeHref(
      emailValue.toLowerCase().startsWith("mailto:")
        ? emailValue
        : `mailto:${emailValue}`,
    )
    : "";
  const emailIcon = emailHref
    ? `<a class="social-link" href="${
      escapeAttr(emailHref)
    }" aria-label="email" title="email">${ICON_MAIL}</a>`
    : "";
  const twitterSite = cfg.twitter.site ||
    (twitterProfile ? `@${twitterProfile.replace(/^@/, "")}` : "");

  const topLinks = (cfg.navBar ?? []).flatMap((item) => {
    if (typeof item === "object" && item !== null) {
      const entries = Object.entries(item);
      if (entries.length !== 1) return [];
      const [label, url] = entries[0];
      const safeHref = sanitizeHref(url);
      if (!safeHref) return [];
      const isExternal = /^https?:\/\//.test(safeHref);
      const attrs = isExternal
        ? ' target="_blank" rel="noopener noreferrer"'
        : "";
      return [
        `<a class="top-link" href="${escapeAttr(safeHref)}"${attrs}>${
          escapeHtml(label)
        }</a>`,
      ];
    }

    const slug = String(item).trim().toLowerCase();
    const label = slug.replace(/[_-]+/g, " ");
    return [
      `<a class="top-link" href="${
        escapeAttr(applyBasePath(basePath, `/${slug}`))
      }">${escapeHtml(label)}</a>`,
    ];
  }).join("");

  const themeLabels = Object.keys(THEMES).sort((a, b) => fnv1a(a) - fnv1a(b));
  const themesHtml = themeLabels.map((label) =>
    `<button data-theme-pick="${escapeAttr(label)}">${
      escapeHtml(label)
    }</button>`
  ).join("");

  const rawMdUrl = `${cfg.url}/${page.slug === "" ? "index" : page.slug}.md`;

  const twitterCard = cfg.twitter.card;
  const resolvedLogo = cfg.logo ? resolveImageUrl(cfg, cfg.logo) : "";
  const logoSrc = resolvedLogo?.startsWith("/")
    ? applyBasePath(basePath, resolvedLogo)
    : resolvedLogo;
  const logoHtml = logoSrc
    ? `<img class="site-logo" src="${escapeAttr(logoSrc)}" alt="logo">`
    : "";

  return `<!doctype html>
<html lang="${escapeAttr(cfg.lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">

<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeAttr(desc)}">
${keywords ? `<meta name="keywords" content="${escapeAttr(keywords)}">` : ""}
${
    is404
      ? `<meta name="robots" content="noindex, nofollow">`
      : `<meta name="robots" content="${escapeAttr(cfg.robots)}">`
  }
${cfg.author ? `<meta name="author" content="${escapeAttr(cfg.author)}">` : ""}
${is404 ? "" : `<link rel="canonical" href="${escapeAttr(canonical)}">`}
${
    !is404 && date
      ? `<meta property="article:published_time" content="${escapeAttr(date)}">`
      : ""
  }
${
    is404 ? "" : `<meta property="og:type" content="${escapeAttr(cfg.og.type)}">
<meta property="og:title" content="${escapeAttr(page.meta.title ?? cfg.title)}">
<meta property="og:description" content="${escapeAttr(desc)}">
<meta property="og:url" content="${escapeAttr(canonical)}">
<meta property="og:site_name" content="${escapeAttr(cfg.title)}">
<meta property="og:locale" content="${escapeAttr(cfg.og.locale)}">
${
      pageImage
        ? `<meta property="og:image" content="${escapeAttr(pageImage)}">`
        : ""
    }
<meta name="twitter:card" content="${escapeAttr(twitterCard)}">
<meta name="twitter:title" content="${
      escapeAttr(page.meta.title ?? cfg.title)
    }">
<meta name="twitter:description" content="${escapeAttr(desc)}">
${
      twitterSite
        ? `<meta name="twitter:site" content="${escapeAttr(twitterSite)}">`
        : ""
    }
${
      pageImage
        ? `<meta name="twitter:image" content="${escapeAttr(pageImage)}">`
        : ""
    }`
  }
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" href="${FONT_CSS_400}" integrity="${FONT_CSS_400_INTEGRITY}" crossorigin="anonymous">
<link rel="stylesheet" href="${FONT_CSS_700}" integrity="${FONT_CSS_700_INTEGRITY}" crossorigin="anonymous">
<link rel="icon" type="image/svg+xml" href="${
    escapeAttr(faviconLight)
  }" media="(prefers-color-scheme: light)">
<link rel="icon" type="image/svg+xml" href="${
    escapeAttr(faviconDark)
  }" media="(prefers-color-scheme: dark)">
${
    is404
      ? ""
      : `<link rel="alternate" type="text/markdown" href="${
        escapeAttr(rawMdUrl)
      }">`
  }
<link rel="stylesheet" href="${escapeAttr(assetBase)}/shiki.css">
<link rel="stylesheet" href="${escapeAttr(assetBase)}/site.css">
</head>
<body>
<a class="skip-link" href="#content">skip to content</a>
<header>
<nav class="site">
<div class="site-brand">${logoHtml}<a class="site-title" href="${
    escapeAttr(rootHref)
  }">${escapeHtml(cfg.title)}</a></div>
<div class="site-actions">
  <nav class="top-links">${topLinks}
  <div class="theme-picker">
  <div class="theme-ctrl">
    <button type="button" class="mode-btn" aria-label="toggle light/dark" title="system"><svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></button>
    <button type="button" class="drop-btn" aria-label="select theme" aria-expanded="false" aria-haspopup="true" aria-controls="theme-menu"><span class="tri"></span></button>
  </div>
  <div id="theme-menu" class="theme-menu">
    ${themesHtml}
  </div>
</div>
  </nav>
</div>
</nav>
</header>
<main id="content" tabindex="-1">
<article>
${page.html}
</article>
</main>
${
    page.slug !== "404"
      ? `<footer>\n<div class="footer-left"><a class="md-link" href="${
        escapeAttr(rawMdUrl)
      }">raw <span class="md-ext">.md</span></a></div>\n<div class="footer-center"><a class="built-link" href="${pagesToolUrl}">built by <span class="md-ext">/pages</span></a></div>\n<div class="footer-right">${twitterIcon}${githubIcon}${emailIcon}</div>\n</footer>`
      : ""
  }
<script src="${escapeAttr(assetBase)}/site.js" defer></script>
</body>
</html>`;
}
