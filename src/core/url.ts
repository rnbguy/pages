export function basePathFromUrl(url: string): string {
  if (!url) return "";
  try {
    return new URL(url).pathname.replace(/\/$/, "");
  } catch {
    return "";
  }
}

export function applyBasePath(basePath: string, path: string): string {
  if (!basePath || basePath === "/") return path;
  if (!path.startsWith("/")) return path;
  if (path === basePath || path.startsWith(basePath + "/")) return path;
  return `${basePath}${path}`;
}
