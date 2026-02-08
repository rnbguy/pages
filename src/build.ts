import { pooledMap } from "@std/async/pool";
import { test } from "@std/front-matter";
import { extract } from "@std/front-matter/yaml";
import { walk } from "@std/fs/walk";
import { dirname, extname, join, relative } from "@std/path";
import { resolveUrl } from "./core/config.ts";
import { escapeXml } from "./core/security.ts";
import {
  resolveMdLinkRaw,
  splitHref,
  srcToOutPath,
  srcToRawMdPath,
  srcToSlug,
  srcToUrl,
} from "./core/paths.ts";
import { DEFAULT_THEME, THEMES } from "./core/themes.ts";
import type { Config, Page, PageMeta } from "./core/types.ts";
import { applyBasePath, basePathFromUrl } from "./core/url.ts";
import {
  createMarkedForPage,
  createStyleTransformer,
  initHighlighter,
} from "./markdown.ts";
import {
  fetchFonts,
  generateOgImage,
  initResvg,
  ogImagePath,
} from "./opengraph.ts";
import {
  renderPage,
  renderSiteCss,
  renderSiteJs,
  renderThemesJson,
} from "./render.ts";

async function runLimited<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>,
) {
  for await (const _ of pooledMap(limit, items, fn)) {
    // consume iterator
  }
}

type BuildContent = {
  pages: Page[];
  assets: string[];
};

export async function build(cfg: Config) {
  cfg = { ...cfg, url: resolveUrl(cfg) };
  const basePath = basePathFromUrl(cfg.url);
  const start = performance.now();

  try {
    await Deno.remove(cfg.dest, { recursive: true });
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) throw err;
  }
  await Deno.mkdir(cfg.dest, { recursive: true });

  const hl = await initHighlighter();
  const styleToClass = createStyleTransformer();
  const siteCss = renderSiteCss();
  const { pages, assets } = await collectContent(
    cfg,
    basePath,
    hl,
    styleToClass,
  );
  const resolvedPages = resolveSlugConflicts(pages);

  const assetDir = await writeSiteAssets(cfg.dest, styleToClass, siteCss);
  await writeFavicons(cfg, siteCss, assetDir);
  const ogMap = await generateOgImages(resolvedPages, cfg, assetDir);
  await Promise.all([
    writeRenderedPages(resolvedPages, cfg, ogMap),
    writeRawMarkdown(resolvedPages, cfg, basePath),
    copyStaticAssets(assets, cfg),
  ]);

  const listed = resolvedPages.filter((p) => p.slug !== "404");
  await writeMetadataOutputs(listed, cfg);
  await Deno.writeTextFile(join(cfg.dest, ".nojekyll"), "");

  const elapsed = ((performance.now() - start) / 1000).toFixed(2);
  console.log(
    `built ${resolvedPages.length} pages + ${assets.length} assets in ${elapsed}s -> ${cfg.dest}/`,
  );
}

async function collectContent(
  cfg: Config,
  basePath: string,
  hl: Awaited<ReturnType<typeof initHighlighter>>,
  styleToClass: ReturnType<typeof createStyleTransformer>,
): Promise<BuildContent> {
  const pages: Page[] = [];
  const assets: string[] = [];
  for await (const entry of walk(cfg.src, { includeDirs: false })) {
    const rel = relative(cfg.src, entry.path);
    if (extname(entry.name) === ".md") {
      const raw = await Deno.readTextFile(entry.path);
      let meta: PageMeta = {};
      let body = raw;
      if (test(raw)) {
        const parsed = extract(raw);
        meta = parsed.attrs as PageMeta;
        body = parsed.body;
      }
      if (meta.tags != null && !Array.isArray(meta.tags)) {
        meta.tags = [String(meta.tags)];
      }
      if (meta.title != null && typeof meta.title !== "string") {
        meta.title = String(meta.title);
      }
      if (meta.description != null && typeof meta.description !== "string") {
        meta.description = String(meta.description);
      }
      if (meta.draft) continue;

      const marked = createMarkedForPage(
        hl,
        rel,
        cfg.mermaid,
        basePath,
        styleToClass,
      );
      const html = await marked.parse(body);
      const url = srcToUrl(rel);
      const slug = srcToSlug(rel);
      pages.push({ url, slug, meta, html, raw, srcPath: rel });
    } else {
      assets.push(rel);
    }
  }
  return { pages, assets };
}

function resolveSlugConflicts(pages: Page[]): Page[] {
  const slugMap = new Map<string, Page[]>();
  for (const page of pages) {
    const existing = slugMap.get(page.slug) ?? [];
    existing.push(page);
    slugMap.set(page.slug, existing);
  }
  const resolved = [...pages];
  for (const [slug, dupes] of slugMap) {
    if (dupes.length < 2) continue;
    console.warn(
      `warning: conflict at /${slug} -- ${
        dupes.map((p) => p.srcPath).join(", ")
      }. index.md takes precedence.`,
    );
    for (const p of dupes.filter((p) => !p.srcPath.endsWith("index.md"))) {
      const idx = resolved.indexOf(p);
      if (idx >= 0) resolved.splice(idx, 1);
    }
  }
  return resolved;
}

async function writeSiteAssets(
  dest: string,
  styleToClass: ReturnType<typeof createStyleTransformer>,
  siteCss: string,
): Promise<string> {
  const assetDir = join(dest, "assets");
  await Deno.mkdir(assetDir, { recursive: true });
  const themesJson = renderThemesJson();
  await Deno.writeTextFile(join(assetDir, "site.css"), siteCss);
  await Deno.writeTextFile(
    join(assetDir, "site.js"),
    renderSiteJs(themesJson, DEFAULT_THEME),
  );
  await Deno.writeTextFile(join(assetDir, "shiki.css"), styleToClass.getCSS());
  return assetDir;
}

type ThemeColors = {
  bg: string;
  fg: string;
  accent: string;
};

async function writeFavicons(
  cfg: Config,
  siteCss: string,
  assetDir: string,
): Promise<void> {
  const themePair = THEMES[DEFAULT_THEME] ?? Object.values(THEMES)[0];
  if (!themePair) return;
  const text = normalizeFaviconText(cfg);
  const light = resolveThemeColors(siteCss, themePair.light.id);
  const dark = resolveThemeColors(siteCss, themePair.dark.id);
  await Deno.writeTextFile(
    join(assetDir, "favicon-light.svg"),
    generateFaviconSvg(text, light),
  );
  await Deno.writeTextFile(
    join(assetDir, "favicon-dark.svg"),
    generateFaviconSvg(text, dark),
  );
}

function normalizeFaviconText(cfg: Config): string {
  const raw = (cfg.faviconText || cfg.title || "r").trim();
  return raw ? Array.from(raw)[0] : "r";
}

function resolveThemeColors(css: string, themeId: string): ThemeColors {
  const block = matchThemeBlock(css, themeId);
  const bg = extractVar(block, "--bg") ?? "#ffffff";
  const fg = extractVar(block, "--fg") ?? "#111111";
  const accent = extractVar(block, "--accent") ?? fg;
  return { bg, fg, accent };
}

function matchThemeBlock(css: string, themeId: string): string {
  const re = new RegExp(
    `\\[data-theme="${escapeRegex(themeId)}"\\]\\s*\\{([\\s\\S]*?)\\}`,
    "m",
  );
  const match = css.match(re);
  return match?.[1] ?? "";
}

function extractVar(block: string, name: string): string | undefined {
  const re = new RegExp(`${escapeRegex(name)}:\\s*([^;]+);`);
  return block.match(re)?.[1]?.trim();
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function generateFaviconSvg(text: string, colors: ThemeColors): string {
  const size = 64;
  const center = size / 2;
  const radius = 26;
  const fontSize = 30;
  const bg = escapeXml(colors.bg);
  const fg = escapeXml(colors.fg);
  const accent = escapeXml(colors.accent);
  const safeText = escapeXml(text);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <circle cx="${center}" cy="${center}" r="${radius}" fill="${bg}" stroke="${accent}" stroke-width="2"/>
  <text x="${center}" y="${center}" text-anchor="middle" dominant-baseline="central" fill="${fg}" font-family="Iosevka, 'Iosevka Web', monospace" font-size="${fontSize}" font-weight="900">${safeText}</text>
</svg>`;
}

async function generateOgImages(
  pages: Page[],
  cfg: Config,
  assetDir: string,
): Promise<Map<string, string>> {
  await initResvg();
  const fontBuffers = await fetchFonts();
  const ogMap = new Map<string, string>();
  await runLimited(
    pages.filter((p) => p.slug !== "404"),
    8,
    async (page) => {
      const ogFile = ogImagePath(page.slug);
      const png = generateOgImage(
        page.meta.title ?? cfg.title,
        cfg.title,
        cfg.author,
        fontBuffers,
      );
      await Deno.writeFile(join(assetDir, ogFile), png);
      ogMap.set(page.slug, ogFile);
    },
  );
  return ogMap;
}

async function writeRenderedPages(
  pages: Page[],
  cfg: Config,
  ogMap: Map<string, string>,
): Promise<void> {
  await runLimited(pages, 32, async (page) => {
    const outPath = srcToOutPath(cfg.dest, page.srcPath);
    await Deno.mkdir(dirname(outPath), { recursive: true });
    await Deno.writeTextFile(
      outPath,
      renderPage(page, cfg, ogMap.get(page.slug)),
    );
  });
}

async function writeRawMarkdown(
  pages: Page[],
  cfg: Config,
  basePath: string,
): Promise<void> {
  await runLimited(pages, 32, async (page) => {
    const mdDest = srcToRawMdPath(cfg.dest, page.srcPath);
    await Deno.mkdir(dirname(mdDest), { recursive: true });
    const srcDir = dirname(page.srcPath).replace(/\\/g, "/");
    const rewriteLinks = (text: string) =>
      text.replace(
        /\[([^\]]*)\]\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g,
        (_, linkText, href) => {
          if (href.startsWith("http")) return `[${linkText}](${href})`;
          const { path } = splitHref(href);
          if (!path.endsWith(".md")) return `[${linkText}](${href})`;
          return `[${linkText}](${
            applyBasePath(basePath, resolveMdLinkRaw(srcDir, href))
          })`;
        },
      );
    const parts = page.raw.split(/^(```|~~~)/m);
    let inCode = false;
    const rewritten = parts.map((part, i) => {
      if (i > 0 && (part === "```" || part === "~~~")) {
        inCode = !inCode;
        return part;
      }
      return inCode ? part : rewriteLinks(part);
    }).join("");
    await Deno.writeTextFile(mdDest, rewritten);
  });
}

async function copyStaticAssets(assets: string[], cfg: Config): Promise<void> {
  await runLimited(assets, 32, async (rel) => {
    const dest = join(cfg.dest, rel);
    await Deno.mkdir(dirname(dest), { recursive: true });
    await Deno.copyFile(join(cfg.src, rel), dest);
  });
}

async function writeMetadataOutputs(pages: Page[], cfg: Config): Promise<void> {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${
    pages.map((p) => {
      const d = p.meta.date instanceof Date
        ? p.meta.date.toISOString().split("T")[0]
        : p.meta.date;
      return `<url><loc>${escapeXml(cfg.url)}${escapeXml(p.url)}</loc>${
        d ? `<lastmod>${escapeXml(String(d))}</lastmod>` : ""
      }</url>`;
    }).join("\n")
  }
</urlset>`;
  await Deno.writeTextFile(join(cfg.dest, "sitemap.xml"), sitemap);

  const robots = `User-agent: *\nAllow: /\n\nSitemap: ${cfg.url}/sitemap.xml\n`;
  await Deno.writeTextFile(join(cfg.dest, "robots.txt"), robots);

  const mdName = (p: Page) => p.slug === "" ? "index" : p.slug;
  const llms = `# ${cfg.title}\n\n> ${cfg.description}\n\n${
    pages.map((p) => {
      const label = p.meta.title ?? mdName(p);
      const link = `${cfg.url}/${mdName(p)}.md`;
      const desc = p.meta.description;
      return desc ? `- [${label}](${link}): ${desc}` : `- [${label}](${link})`;
    }).join("\n")
  }\n`;
  await Deno.writeTextFile(join(cfg.dest, "llms.txt"), llms);

  const llmsFull = pages.map((p) =>
    `# ${p.meta.title ?? mdName(p)}\nSource: ${cfg.url}/${
      mdName(p)
    }.md\n\n${p.raw}`
  ).join("\n\n---\n\n");
  await Deno.writeTextFile(join(cfg.dest, "llms-full.txt"), llmsFull);
}
