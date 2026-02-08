import { assertEquals } from "@std/assert";
import { applyBasePath, basePathFromUrl } from "./url.ts";

Deno.test("basePathFromUrl extracts pathname from URL", () => {
  assertEquals(basePathFromUrl("https://example.com/blog"), "/blog");
  assertEquals(basePathFromUrl("https://example.com/"), "");
  assertEquals(basePathFromUrl("https://example.com"), "");
  assertEquals(basePathFromUrl(""), "");
  assertEquals(basePathFromUrl("not a url"), "");
});

Deno.test("applyBasePath prepends base to absolute paths", () => {
  assertEquals(applyBasePath("", "/page"), "/page");
  assertEquals(applyBasePath("/", "/page"), "/page");
  assertEquals(applyBasePath("/blog", "/page"), "/blog/page");
  assertEquals(applyBasePath("/blog", "/blog/page"), "/blog/page");
  assertEquals(applyBasePath("/blog", "relative"), "relative");
});
