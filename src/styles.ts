const SITE_CSS_URL = new URL("./assets/site.css", import.meta.url);

export async function readSiteCss(): Promise<string> {
  if (SITE_CSS_URL.protocol === "file:") {
    return await Deno.readTextFile(SITE_CSS_URL);
  }
  const res = await fetch(SITE_CSS_URL);
  return await res.text();
}
