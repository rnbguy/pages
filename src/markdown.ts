import { Marked, type Token } from "marked";
import markedAlert from "marked-alert";
import { createHighlighter, type Highlighter } from "shiki";
import { transformerStyleToClass } from "@shikijs/transformers";
import { renderMermaidAscii } from "beautiful-mermaid";
import { dirname } from "@std/path";
import { applyBasePath } from "./core/url.ts";
import { escapeAttr, escapeHtml, sanitizeHref } from "./core/security.ts";
import { resolveMdLink, splitHref } from "./core/paths.ts";
import { allThemeIds, DEFAULT_THEME, THEMES } from "./core/themes.ts";
import type { MermaidConfig } from "./core/types.ts";

export type StyleTransformer = ReturnType<typeof transformerStyleToClass>;

export async function initHighlighter(): Promise<Highlighter> {
  return await createHighlighter({
    themes: allThemeIds(),
    langs: [
      "typescript",
      "javascript",
      "bash",
      "sh",
      "json",
      "yaml",
      "toml",
      "html",
      "css",
      "rust",
      "go",
      "python",
      "sql",
      "diff",
      "markdown",
      "solidity",
      "tsx",
      "jsx",
    ],
  });
}

export function createStyleTransformer(): StyleTransformer {
  return transformerStyleToClass({ classPrefix: "sk-" });
}

function parseLangInfo(raw: string | undefined): {
  lang: string;
  filename: string;
} {
  const info = (raw ?? "").trim();
  if (!info) return { lang: "", filename: "" };
  const lang = info.split(/\s+/)[0] ?? "";
  const match = info.match(/(?:^|\s)(file|filename)[:=]("[^"]+"|\S+)/);
  const filename = match ? match[2].replace(/^"|"$/g, "").trim() : "";
  return { lang, filename };
}

function extractCodeMeta(
  text: string,
  filenameFromLang = "",
): { body: string; filename: string } {
  const match = text.match(/^\s*#!\s*file:\s*([^\n]+)\n/);
  let body = text;
  let filename = filenameFromLang;
  if (match) {
    body = text.slice(match[0].length);
    if (!filename) filename = match[1].trim();
  }
  return { body, filename };
}

function wrapCodeBlock(preHtml: string, filename: string): string {
  const nameHtml = filename
    ? `<span class="code-filename">${escapeHtml(filename)}</span>`
    : "";
  const cls = filename ? "code-block has-filename" : "code-block";
  const actions = filename
    ? `<div class="code-actions"><button class="code-download" type="button" data-download data-filename="${
      escapeAttr(filename)
    }" aria-label="download file" title="download">save</button><button class="code-copy" type="button" data-copy aria-label="copy code" title="copy">copy</button></div>`
    : `<div class="code-actions"><button class="code-copy" type="button" data-copy aria-label="copy code" title="copy">copy</button></div>`;
  return `<div class="${cls}">${nameHtml}${actions}${preHtml}</div>`;
}

export function createMarkedForPage(
  hl: Highlighter,
  srcRelPath: string,
  mermaid: MermaidConfig,
  basePath: string,
  styleToClass?: StyleTransformer,
): Marked {
  const srcDir = dirname(srcRelPath).replace(/\\/g, "/");
  const ids = allThemeIds();

  const marked = new Marked({
    renderer: {
      code({ text, lang }: { text: string; lang?: string }) {
        const info = parseLangInfo(lang);
        const meta = extractCodeMeta(text, info.filename);
        if (info.lang === "mermaid") {
          try {
            const ascii = renderMermaidAscii(meta.body, mermaid);
            return wrapCodeBlock(
              `<pre class="mermaid-diagram"><code>${
                escapeHtml(ascii)
              }</code></pre>`,
              meta.filename,
            );
          } catch {
            return wrapCodeBlock(
              `<pre class="mermaid-diagram"><code>${
                escapeHtml(meta.body)
              }</code></pre>`,
              meta.filename,
            );
          }
        }
        const resolved = hl.getLoadedLanguages().includes(info.lang)
          ? info.lang
          : "text";
        const preHtml = hl.codeToHtml(meta.body, {
          lang: resolved,
          themes: Object.fromEntries(ids.map((id) => [id, id])),
          defaultColor: THEMES[DEFAULT_THEME].light.id,
          transformers: styleToClass ? [styleToClass] : undefined,
        });
        return wrapCodeBlock(preHtml, meta.filename);
      },
      html({ text }: { text: string }) {
        const SAFE_TAG = /^<\/?\s*(br|hr|wbr)\s*\/?\s*>$/i;
        return SAFE_TAG.test(text.trim()) ? text : escapeHtml(text);
      },
      link(
        { href, title, text }: {
          href: string;
          title?: string | null;
          text: string;
          tokens: Token[];
        },
      ): string {
        const { path } = splitHref(href);
        if (path.endsWith(".md") && !href.startsWith("http")) {
          const resolved = applyBasePath(basePath, resolveMdLink(srcDir, href));
          const t = title ? ` title="${escapeAttr(title)}"` : "";
          return `<a href="${escapeAttr(resolved)}"${t}>${text}</a>`;
        }
        const safeHref = sanitizeHref(href);
        if (!safeHref) return text;
        const finalHref = safeHref.startsWith("/") && !safeHref.startsWith("//")
          ? applyBasePath(basePath, safeHref)
          : safeHref;
        const t = title ? ` title="${escapeAttr(title)}"` : "";
        return `<a href="${escapeAttr(finalHref)}"${t}>${text}</a>`;
      },
      image(
        { href, title, text }: {
          href: string;
          title?: string | null;
          text: string;
        },
      ) {
        const safeHref = sanitizeHref(href);
        if (!safeHref) return "";
        const finalHref = safeHref.startsWith("/") && !safeHref.startsWith("//")
          ? applyBasePath(basePath, safeHref)
          : safeHref;
        const t = title ? ` title="${escapeAttr(title)}"` : "";
        return `<img src="${escapeAttr(finalHref)}" alt="${
          escapeHtml(text)
        }"${t} loading="lazy" decoding="async">`;
      },
    },
  });
  marked.use(markedAlert());
  return marked;
}
