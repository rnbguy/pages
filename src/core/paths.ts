import { dirname, join } from "@std/path";

export function isIndex(relPath: string): boolean {
  return relPath.replace(/\\/g, "/").endsWith("index.md");
}

export function srcToSlug(relPath: string): string {
  const p = relPath.replace(/\\/g, "/");
  if (isIndex(p)) return dirname(p) === "." ? "" : dirname(p);
  return p.replace(/\.md$/, "");
}

export function srcToUrl(relPath: string): string {
  const slug = srcToSlug(relPath);
  return slug === "" ? "/" : `/${encodePath(slug)}`;
}

export function srcToOutPath(dest: string, relPath: string): string {
  const p = relPath.replace(/\\/g, "/");
  return join(dest, p.replace(/\.md$/, ".html"));
}

export function srcToRawMdPath(dest: string, relPath: string): string {
  const slug = srcToSlug(relPath);
  if (slug === "") return join(dest, "index.md");
  return join(dest, slug + ".md");
}

export function resolveSlug(srcDir: string, href: string): string {
  const base = href.startsWith("/") ? "." : srcDir;
  const resolved = join(base, href).replace(/\\/g, "/").replace(
    /^\.?\/?/,
    "",
  );
  const parts = resolved.split("/");
  if (parts.some((p: string) => p === ".." || p === ".")) return "";
  return isIndex(resolved)
    ? (dirname(resolved) === "." ? "" : dirname(resolved))
    : resolved.replace(/\.md$/, "");
}

export function splitHref(href: string): { path: string; suffix: string } {
  let cut = href.length;
  const q = href.indexOf("?");
  const h = href.indexOf("#");
  if (q >= 0) cut = Math.min(cut, q);
  if (h >= 0) cut = Math.min(cut, h);
  return { path: href.slice(0, cut), suffix: href.slice(cut) };
}

export function resolveMdLink(srcDir: string, href: string): string {
  const { path, suffix } = splitHref(href);
  const slug = resolveSlug(srcDir, path);
  const base = slug === "" ? "/" : `/${encodePath(slug)}`;
  return base + suffix;
}

export function resolveMdLinkRaw(srcDir: string, href: string): string {
  const { path, suffix } = splitHref(href);
  const slug = resolveSlug(srcDir, path);
  const base = slug === "" ? "index" : slug;
  return `/${encodePath(base)}.md${suffix}`;
}

export function encodePath(p: string): string {
  return p.split("/").map((part: string) => encodeURIComponent(part)).join("/");
}
