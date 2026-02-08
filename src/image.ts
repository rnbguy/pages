import type { Config, ImageConfig } from "./core/types.ts";

export function resolveImageUrl(cfg: Config, image: ImageConfig): string {
  const githubImg = cfg.github
    ? `https://github.com/${encodeURIComponent(cfg.github)}.png?size=256`
    : "";
  const twitterProfile = cfg.twitter.profile?.trim() ?? "";
  const twitterImg = twitterProfile
    ? `https://unavatar.io/twitter/${
      encodeURIComponent(twitterProfile.replace(/^@/, ""))
    }`
    : "";
  if (!image) return githubImg;
  if (image === "github") return githubImg;
  if (image === "twitter") return twitterImg;
  if (typeof image === "object" && "file" in image) {
    const path = image.file.trim();
    if (!path) return githubImg;
    return path.startsWith("http")
      ? path
      : `${cfg.url}${path.startsWith("/") ? "" : "/"}${path}`;
  }
  if (typeof image === "string") {
    const path = image.trim();
    if (!path) return githubImg;
    return path.startsWith("http")
      ? path
      : `${cfg.url}${path.startsWith("/") ? "" : "/"}${path}`;
  }
  return githubImg;
}

export function resolvePageImage(cfg: Config, pageImage?: string): string {
  if (pageImage) {
    return pageImage.startsWith("http")
      ? pageImage
      : `${cfg.url}${pageImage.startsWith("/") ? "" : "/"}${pageImage}`;
  }
  return resolveImageUrl(cfg, cfg.image);
}
