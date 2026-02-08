import type { Config, ImageConfig } from "./core/types.ts";

function toAbsoluteUrl(baseUrl: string, path: string): string {
  if (path.startsWith("http")) return path;
  return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function resolveImageUrl(cfg: Config, image: ImageConfig): string {
  const githubImg = cfg.github
    ? `https://github.com/${encodeURIComponent(cfg.github)}.png?size=256`
    : "";
  if (!image) return githubImg;
  if (image === "github") return githubImg;
  if (image === "twitter") {
    const profile = cfg.twitter.profile?.trim() ?? "";
    return profile
      ? `https://unavatar.io/twitter/${
        encodeURIComponent(profile.replace(/^@/, ""))
      }`
      : "";
  }
  const path = (typeof image === "object" && "file" in image)
    ? image.file.trim()
    : (typeof image === "string" ? image.trim() : "");
  return path ? toAbsoluteUrl(cfg.url, path) : githubImg;
}

export function resolvePageImage(cfg: Config, pageImage?: string): string {
  if (pageImage) return toAbsoluteUrl(cfg.url, pageImage);
  return resolveImageUrl(cfg, cfg.image);
}
