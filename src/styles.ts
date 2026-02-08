const SITE_CSS_URL = new URL("./assets/site.css", import.meta.url);

export async function readSiteCss(): Promise<string> {
  return await Deno.readTextFile(SITE_CSS_URL);
}
