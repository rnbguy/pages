import { initWasm, Resvg } from "resvg-wasm";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const FONT_CDN = "https://cdn.jsdelivr.net/npm/@fontsource/iosevka@5.2.5/files";

export async function initResvg(): Promise<void> {
  const pkgPath = import.meta.resolve("resvg-wasm");
  const wasmPath = new URL("./index_bg.wasm", pkgPath);
  await initWasm(await Deno.readFile(wasmPath));
}

export async function fetchFonts(): Promise<Uint8Array[]> {
  const urls = [
    `${FONT_CDN}/iosevka-latin-400-normal.woff2`,
    `${FONT_CDN}/iosevka-latin-700-normal.woff2`,
    `${FONT_CDN}/iosevka-latin-400-italic.woff2`,
  ];
  return await Promise.all(
    urls.map(async (u) => {
      const res = await fetch(u);
      if (!res.ok) {
        throw new Error(
          `failed to fetch font ${u}: ${res.status} ${res.statusText}`,
        );
      }
      return new Uint8Array(await res.arrayBuffer());
    }),
  );
}

function svgEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapSvgText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (test.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function extractBodyPreview(raw: string): string {
  let body = raw.replace(/^---[\s\S]*?---\s*/, "");
  body = body
    .replace(/^#{1,6}\s+.*$/gm, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/[*_~]+/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return body.slice(0, 300);
}

function basenameFromSlug(slug: string): string {
  const parts = slug.replace(/-/g, "/").split("/");
  const last = parts[parts.length - 1];
  return last || slug;
}

function generateOgSvg(
  title: string,
  siteName: string,
  author: string,
  slug: string,
): string {
  const bg = "#24292e";
  const fg = "#e1e4e8";
  const muted = "#6a737d";
  const accent = "#4493f8";

  const marginX = 100;

  const pageTitle = title || basenameFromSlug(slug);
  const titleFontSize = 96;
  const titleLines = wrapSvgText(pageTitle, 18);
  const titleLineHeight = titleFontSize * 1.2;
  const titleBlockHeight = titleLines.length * titleLineHeight;

  const authorFontSize = 28;
  const authorLineHeight = authorFontSize * 1.5;
  const siteFontSize = 32;
  const siteLineHeight = siteFontSize * 1.5;
  const separatorHeight = 40;

  const hasAuthor = author.trim().length > 0;
  const authorHeight = hasAuthor ? authorLineHeight : 0;

  const totalContentHeight = titleBlockHeight + 40 + authorHeight +
    separatorHeight + siteLineHeight;
  const startY = (OG_HEIGHT - totalContentHeight) / 2 + titleFontSize;

  const titleTexts = titleLines.map((line, i) =>
    `<text x="${OG_WIDTH / 2}" y="${
      startY + i * titleLineHeight
    }" text-anchor="middle" fill="${fg}" font-size="${titleFontSize}" font-family="Iosevka" font-weight="700">${
      svgEscape(line)
    }</text>`
  ).join("\n  ");

  let authorText = "";
  if (hasAuthor) {
    const authorY = startY + titleBlockHeight + 40;
    authorText = `
  <text x="${
      OG_WIDTH / 2
    }" y="${authorY}" text-anchor="middle" fill="${muted}" font-size="${authorFontSize}" font-family="Iosevka" font-weight="400">by: <tspan font-style="italic">${
      svgEscape(author)
    }</tspan></text>`;
  }

  const separatorY = startY + titleBlockHeight + 40 + authorHeight + 25;
  const siteY = separatorY + separatorHeight;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}">
  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="${bg}"/>
  ${titleTexts}${authorText}
  <line x1="${marginX}" y1="${separatorY}" x2="${
    OG_WIDTH - marginX
  }" y2="${separatorY}" stroke="${accent}" stroke-width="2"/>
  <text x="${
    OG_WIDTH / 2
  }" y="${siteY}" text-anchor="middle" fill="${muted}" font-size="${siteFontSize}" font-family="Iosevka" font-weight="400">${
    svgEscape(siteName)
  }</text>
</svg>`;
}

export function generateOgImage(
  title: string,
  siteName: string,
  author: string,
  slug: string,
  fontBuffers: Uint8Array[],
): Uint8Array {
  const svg = generateOgSvg(title, siteName, author, slug);
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: OG_WIDTH },
    font: { fontBuffers, loadSystemFonts: false },
  });
  return resvg.render().asPng();
}

export function ogImagePath(slug: string): string {
  return slug === "" ? "og-index.png" : `og-${slug.replace(/\//g, "-")}.png`;
}

export { extractBodyPreview };
