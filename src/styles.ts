const SITE_CSS_URL = new URL("./assets/site.css", import.meta.url);

export function readSiteCss(): string {
  return Deno.readTextFileSync(SITE_CSS_URL);
}
