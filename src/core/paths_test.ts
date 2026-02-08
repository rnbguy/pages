import { assertEquals } from "@std/assert";
import {
  resolveMdLink,
  resolveMdLinkRaw,
  splitHref,
  srcToSlug,
  srcToUrl,
} from "./paths.ts";

Deno.test("srcToSlug converts src paths to slugs", () => {
  assertEquals(srcToSlug("index.md"), "");
  assertEquals(srcToSlug("foo.md"), "foo");
  assertEquals(srcToSlug("sub/bar.md"), "sub/bar");
  assertEquals(srcToSlug("sub/index.md"), "sub");
});

Deno.test("srcToUrl converts src paths to URL paths", () => {
  assertEquals(srcToUrl("index.md"), "/");
  assertEquals(srcToUrl("about.md"), "/about");
  assertEquals(srcToUrl("blog/post.md"), "/blog/post");
});

Deno.test("splitHref separates path from query/hash", () => {
  assertEquals(splitHref("page"), { path: "page", suffix: "" });
  assertEquals(splitHref("page?q=1"), { path: "page", suffix: "?q=1" });
  assertEquals(splitHref("page#sec"), { path: "page", suffix: "#sec" });
  assertEquals(splitHref("page?q=1#sec"), { path: "page", suffix: "?q=1#sec" });
});

Deno.test("resolveMdLink resolves .md links to site URLs", () => {
  assertEquals(resolveMdLink("sub", "other.md"), "/sub/other");
  assertEquals(resolveMdLink("sub", "../top.md"), "/top");
  assertEquals(resolveMdLink("sub", "/root.md"), "/root");
  assertEquals(resolveMdLink("sub", "page.md#heading"), "/sub/page#heading");
});

Deno.test("resolveMdLinkRaw resolves .md links to raw .md URLs", () => {
  assertEquals(resolveMdLinkRaw("sub", "other.md"), "/sub/other.md");
  assertEquals(resolveMdLinkRaw("sub", "../top.md"), "/top.md");
  assertEquals(resolveMdLinkRaw("sub", "/root.md"), "/root.md");
  assertEquals(
    resolveMdLinkRaw("sub", "page.md#heading"),
    "/sub/page.md#heading",
  );
});
