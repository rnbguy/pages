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

function generateOgSvg(
  title: string,
  siteName: string,
  author: string,
  bodyPreview: string,
): string {
  const bg = "#24292e";
  const fg = "#e1e4e8";
  const muted = "#6a737d";
  const accent = "#4493f8";

  const marginX = 100;
  const marginY = 80;
  const contentWidth = OG_WIDTH - marginX * 2;

  const isSiteTitle = title === siteName;
  const titleFontSize = isSiteTitle ? 96 : 72;
  const titleLines = wrapSvgText(title || siteName, isSiteTitle ? 12 : 18);
  const lineHeight = titleFontSize * 1.25;
  const titleBlockHeight = titleLines.length * lineHeight;
  const titleY = marginY + titleFontSize;

  const titleTexts = titleLines.map((line, i) =>
    `<text x="${OG_WIDTH / 2}" y="${
      titleY + i * lineHeight
    }" text-anchor="middle" fill="${fg}" font-size="${titleFontSize}" font-family="Iosevka" font-weight="700">${
      svgEscape(line)
    }</text>`
  ).join("\n  ");

  const bodyY = titleY + titleBlockHeight + 40;
  const bodyFontSize = 28;
  const bodyLineHeight = bodyFontSize * 1.4;
  const maxBodyChars = Math.floor(contentWidth / (bodyFontSize * 0.55));
  const bodyLines = wrapSvgText(bodyPreview, maxBodyChars).slice(0, 3);

  const bodyTexts = bodyLines.map((line, i) =>
    `<text x="${OG_WIDTH / 2}" y="${
      bodyY + i * bodyLineHeight
    }" text-anchor="middle" fill="${muted}" font-size="${bodyFontSize}" font-family="Iosevka">${
      svgEscape(line)
    }</text>`
  ).join("\n  ");

  const footerY = OG_HEIGHT - marginY;
  const footerParts = [author, siteName].filter(Boolean);
  const footer = footerParts.join(" / ");

  const ctaY = footerY - 55;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}">
  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="${bg}"/>
  ${titleTexts}
  ${bodyTexts}
  <text x="${
    OG_WIDTH / 2
  }" y="${ctaY}" text-anchor="middle" fill="${accent}" font-size="24" font-family="Iosevka" font-weight="400">Read more at ${
    svgEscape(siteName)
  }</text>
  <line x1="${marginX}" y1="${footerY - 50}" x2="${OG_WIDTH - marginX}" y2="${
    footerY - 50
  }" stroke="${accent}" stroke-width="2"/>
  <text x="${
    OG_WIDTH / 2
  }" y="${footerY}" text-anchor="middle" fill="${muted}" font-size="32" font-family="Iosevka">${
    svgEscape(footer)
  }</text>
</svg>`;
}

export function generateOgImage(
  title: string,
  siteName: string,
  author: string,
  bodyPreview: string,
  fontBuffers: Uint8Array[],
): Uint8Array {
  const svg = generateOgSvg(title, siteName, author, bodyPreview);
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
