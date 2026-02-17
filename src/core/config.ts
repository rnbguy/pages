import { parse as parseYaml } from "@std/yaml";
import { Value } from "@sinclair/typebox/value";
import { type Config, ConfigSchema } from "./types.ts";

export const DEFAULTS: Config = {
  // paths
  src: "src",
  dest: "dist",
  port: 8000,
  url: "",
  // site
  title: "My Site",
  description: "A static site built with Deno",
  lang: "en",
  author: "",
  // branding
  logo: "",
  faviconText: "r",
  // social + previews
  github: "",
  email: "",
  image: "github",
  og: { type: "website", locale: "en_US" },
  twitter: { card: "summary", site: "", profile: "" },
  // seo
  robots: "index, follow",
  // content
  mermaid: { useAscii: true, paddingX: 5, paddingY: 5, boxBorderPadding: 1 },
  // navigation
  navBar: [],
};

export function resolveUrl(cfg: Config): string {
  const url = cfg.url || `http://localhost:${cfg.port}`;
  return url.replace(/\/+$/, "");
}

export function loadConfig(): Config {
  let raw: string;
  try {
    raw = Deno.readTextFileSync("config.yaml");
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      throw new Error(
        "config.yaml not found. Run 'deno task init' to create one.",
      );
    }
    throw err;
  }
  const yaml = parseYaml(raw);
  if (!isPlainObject(yaml)) throw new Error("config.yaml must be a mapping");
  const ogRaw = isPlainObject(yaml.og) ? yaml.og : {};
  const twitterRaw = isPlainObject(yaml.twitter) ? yaml.twitter : {};
  const mermaidRaw = isPlainObject(yaml.mermaid) ? yaml.mermaid : {};
  const cfg = {
    ...DEFAULTS,
    ...yaml,
    og: { ...DEFAULTS.og, ...ogRaw },
    twitter: { ...DEFAULTS.twitter, ...twitterRaw },
    mermaid: { ...DEFAULTS.mermaid, ...mermaidRaw },
  } as Config;

  const errors = [...Value.Errors(ConfigSchema, cfg)].map((err) => {
    const path = err.path ? err.path.slice(1) : "config";
    return `${path} ${err.message}`;
  });
  if (errors.length) {
    throw new Error(`invalid config.yaml:\n- ${errors.join("\n- ")}`);
  }
  return cfg;
}

export function stripUndefined<T extends Record<string, unknown>>(
  obj: T,
): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null &&
    Object.getPrototypeOf(value) === Object.prototype;
}
