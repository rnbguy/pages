import { escape as escapeHtml } from "@std/html";
import { resolve } from "@std/path";

export function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, "&#39;");
}

export { escapeHtml };

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function sanitizeHref(rawHref: string): string | null {
  const href = rawHref.trim();
  if (!href) return null;
  if (href.startsWith("#") || href.startsWith("/")) return href;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(href)) {
    try {
      const u = new URL(href);
      if (
        u.protocol === "http:" || u.protocol === "https:" ||
        u.protocol === "mailto:" || u.protocol === "tel:"
      ) {
        return href;
      }
    } catch {
      return null;
    }
    return null;
  }
  return href;
}

export const CSP_POLICY =
  "default-src 'self'; img-src 'self' https:; style-src 'self' https://cdn.jsdelivr.net; font-src 'self' https://cdn.jsdelivr.net data:; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'";

export function securityHeaders(extra: Record<string, string> = {}): Headers {
  const headers = new Headers(extra);
  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "no-referrer");
  headers.set("permissions-policy", "interest-cohort=()");
  headers.set("content-security-policy", CSP_POLICY);
  return headers;
}

export function isSubpath(root: string, full: string): boolean {
  const base = root.replace(/[\\/]+$/, "").normalize("NFC");
  const norm = full.normalize("NFC");
  return norm === base || norm.startsWith(base + "/") ||
    norm.startsWith(base + "\\");
}

export function safeResolveUnder(root: string, rel: string): string | null {
  if (rel.includes("\0")) return null;
  if (
    rel.startsWith("/") || rel.startsWith("\\") || /^[a-zA-Z]:[\\/]/.test(rel)
  ) {
    return null;
  }
  const full = resolve(root, rel);
  return isSubpath(root, full) ? full : null;
}

export function validateSlug(slug: string): string | null {
  const cleaned = slug.trim().replace(/\\/g, "/");
  if (!cleaned.endsWith(".md")) return null;
  if (cleaned.startsWith("/") || cleaned.includes("\0")) return null;
  const parts = cleaned.split("/");
  if (parts.some((p) => p === "" || p === "." || p === "..")) return null;
  return cleaned;
}
