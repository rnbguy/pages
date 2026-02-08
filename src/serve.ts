import { extname, join, resolve } from "@std/path";
import {
  isSubpath,
  safeResolveUnder,
  securityHeaders,
} from "./core/security.ts";
import type { Config } from "./core/types.ts";
import { basePathFromUrl } from "./core/url.ts";

export async function serve(cfg: Config, port: number) {
  const root = resolve(cfg.dest);
  let realRoot = root;
  try {
    realRoot = await Deno.realPath(root);
  } catch {
    realRoot = root;
  }
  const basePath = basePathFromUrl(cfg.url) ||
    await inferBasePathFromSitemap(realRoot);
  console.log(`serving ${cfg.dest}/ at http://localhost:${port}`);
  const server = Deno.serve({ port }, async (req: Request) => {
    const url = new URL(req.url);
    let path: string;
    try {
      path = decodeURIComponent(url.pathname);
    } catch {
      return textResponse("bad request", 400);
    }
    if (path.includes("\0")) {
      return textResponse("bad request", 400);
    }
    if (basePath) {
      if (path === basePath) {
        return redirectResponse(`${basePath}/${url.search}`, 302);
      }
      if (path.startsWith(`${basePath}/`)) {
        path = path.slice(basePath.length) || "/";
      }
    }
    const parts = path.split("/").filter((p) => p.length > 0);
    if (parts.some((p) => p === "." || p === "..")) {
      return textResponse("bad request", 400);
    }
    if (parts.some((p) => p.startsWith("."))) {
      return textResponse("not found", 404);
    }
    if (path !== "/" && path.endsWith("/")) {
      const loc = path.slice(0, -1) || "/";
      const safeLoc = loc.startsWith("//") ? "/" : loc;
      return redirectResponse(`${safeLoc}${url.search}`, 301);
    }

    const is404 = path === "/404" || path === "/404.md" || path === "/404.html";
    if (!is404) {
      const tryPaths = [];
      if (path === "/") {
        tryPaths.push("index.html");
      } else {
        const name = path.slice(1);
        tryPaths.push(name);
        tryPaths.push(`${name}.html`);
        tryPaths.push(`${name}/index.html`);
      }
      const types: Record<string, string> = {
        ".html": "text/html; charset=utf-8",
        ".xml": "application/xml",
        ".txt": "text/plain; charset=utf-8",
        ".md": "text/markdown; charset=utf-8",
        ".json": "application/json",
        ".css": "text/css",
        ".js": "application/javascript",
        ".svg": "image/svg+xml",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".pdf": "application/pdf",
      };
      for (const rel of tryPaths) {
        const full = safeResolveUnder(root, rel);
        if (!full) continue;
        try {
          let real = "";
          try {
            real = await Deno.realPath(full);
          } catch {
            continue;
          }
          if (!isSubpath(realRoot, real)) continue;
          const body = await Deno.readFile(full);
          const ext = extname(full);
          return new Response(body, {
            headers: securityHeaders({
              "content-type": types[ext] ?? "application/octet-stream",
            }),
          });
        } catch (err) {
          if (err instanceof Deno.errors.NotFound) continue;
          if (err instanceof Deno.errors.IsADirectory) continue;
          throw err;
        }
      }
    }
    const isMdReq = path.endsWith(".md");
    const notFoundFile = join(cfg.dest, isMdReq ? "404.md" : "404.html");
    const ct = isMdReq
      ? "text/markdown; charset=utf-8"
      : "text/html; charset=utf-8";
    try {
      const body = await Deno.readFile(notFoundFile);
      return new Response(body, {
        status: 404,
        headers: securityHeaders({ "content-type": ct }),
      });
    } catch (err) {
      if (!(err instanceof Deno.errors.NotFound)) throw err;
    }
    return textResponse("not found", 404);
  });
  await server.finished;
}

function textResponse(
  body: string,
  status: number,
  contentType = "text/plain; charset=utf-8",
): Response {
  return new Response(body, {
    status,
    headers: securityHeaders({ "content-type": contentType }),
  });
}

function redirectResponse(location: string, status: number): Response {
  return new Response(null, {
    status,
    headers: securityHeaders({ location }),
  });
}

async function inferBasePathFromSitemap(root: string): Promise<string> {
  try {
    const raw = await Deno.readTextFile(join(root, "sitemap.xml"));
    const urls = [...raw.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    if (!urls.length) return "";
    const shortest = urls.map((value) => {
      try {
        const u = new URL(value);
        return { value, path: u.pathname };
      } catch {
        return { value, path: value };
      }
    }).sort((a, b) => a.path.length - b.path.length)[0];
    return basePathFromUrl(shortest.value);
  } catch {
    return "";
  }
}
