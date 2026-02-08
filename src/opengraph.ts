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

function generateOgSvg(
  title: string,
  siteName: string,
  author: string,
): string {
  const bg = "#24292e";
  const fg = "#e1e4e8";
  const muted = "#b1b8c0";
  const accent = "#4493f8";
  const surface = "#1f2428";

  const isSiteTitle = title === siteName;
  const baseFontSize = isSiteTitle ? 144 : 112;
  const titleLines = wrapSvgText(title || siteName, isSiteTitle ? 11 : 14);
  const titleFontSize = titleLines.length > 2
    ? baseFontSize - 24
    : baseFontSize;
  const lineHeight = titleFontSize * 1.3;
  const titleBlockHeight = titleLines.length * lineHeight;
  const titleStartY = (OG_HEIGHT - titleBlockHeight) / 2 + titleFontSize * 0.8;

  const titleTexts = titleLines.map((line, i) =>
    `<text x="80" y="${
      titleStartY + i * lineHeight
    }" fill="${fg}" font-size="${titleFontSize}" font-family="Iosevka" font-weight="700">${
      svgEscape(line)
    }</text>`
  ).join("\n  ");

  const bottomY = OG_HEIGHT - 80;
  const subtitleParts = [author, siteName].filter(Boolean);
  const subtitle = subtitleParts.join(" / ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}">
  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="${bg}"/>
  <rect x="0" y="0" width="6" height="${OG_HEIGHT}" fill="${accent}"/>
  <rect x="0" y="${
    OG_HEIGHT - 4
  }" width="${OG_WIDTH}" height="4" fill="${surface}"/>
  ${titleTexts}
  <text x="80" y="${bottomY}" fill="${muted}" font-size="64" font-family="Iosevka">${
    svgEscape(subtitle)
  }</text>
</svg>`;
}

export function generateOgImage(
  title: string,
  siteName: string,
  author: string,
  fontBuffers: Uint8Array[],
): Uint8Array {
  const svg = generateOgSvg(title, siteName, author);
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: OG_WIDTH },
    font: { fontBuffers, loadSystemFonts: false },
  });
  return resvg.render().asPng();
}

export function ogImagePath(slug: string): string {
  return slug === "" ? "og-index.png" : `og-${slug.replace(/\//g, "-")}.png`;
}
