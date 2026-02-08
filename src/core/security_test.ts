import { assertEquals } from "@std/assert";
import {
  escapeAttr,
  escapeHtml,
  isSubpath,
  safeResolveUnder,
  sanitizeHref,
  validateSlug,
} from "./security.ts";

Deno.test("escapeAttr escapes HTML entities and single quotes", () => {
  assertEquals(escapeAttr('<img src="x">'), "&lt;img src=&quot;x&quot;&gt;");
  assertEquals(escapeAttr("it's"), "it&#39;s");
  assertEquals(escapeAttr(""), "");
  assertEquals(escapeAttr("hello"), "hello");
  assertEquals(escapeAttr("a&b"), "a&amp;b");
  assertEquals(escapeAttr("\u00e9"), "\u00e9");
});

Deno.test("escapeHtml escapes < > & and quotes", () => {
  assertEquals(escapeHtml("<script>"), "&lt;script&gt;");
  assertEquals(escapeHtml("a & b"), "a &amp; b");
  assertEquals(escapeHtml('"hi"'), "&quot;hi&quot;");
  assertEquals(escapeHtml("plain text"), "plain text");
});

Deno.test("sanitizeHref blocks dangerous schemes", () => {
  assertEquals(sanitizeHref("javascript:alert(1)"), null);
  assertEquals(sanitizeHref("JavaScript:alert(1)"), null);
  assertEquals(sanitizeHref("data:text/html,<h1>hi</h1>"), null);
  assertEquals(sanitizeHref("vbscript:MsgBox"), null);
});

Deno.test("sanitizeHref allows safe schemes and paths", () => {
  assertEquals(sanitizeHref("https://example.com"), "https://example.com");
  assertEquals(sanitizeHref("http://example.com"), "http://example.com");
  assertEquals(sanitizeHref("mailto:a@b.com"), "mailto:a@b.com");
  assertEquals(sanitizeHref("tel:+1234567890"), "tel:+1234567890");
  assertEquals(sanitizeHref("#fragment"), "#fragment");
  assertEquals(sanitizeHref("/path"), "/path");
  assertEquals(sanitizeHref("relative/path"), "relative/path");
  assertEquals(sanitizeHref(""), null);
  assertEquals(sanitizeHref("  "), null);
});

Deno.test("isSubpath detects child and rejects escape", () => {
  assertEquals(isSubpath("/root", "/root"), true);
  assertEquals(isSubpath("/root", "/root/child"), true);
  assertEquals(isSubpath("/root", "/root/a/b"), true);
  assertEquals(isSubpath("/root", "/rootevil"), false);
  assertEquals(isSubpath("/root", "/other"), false);
  assertEquals(isSubpath("/root/", "/root/child"), true);
});

Deno.test("safeResolveUnder blocks escapes and null bytes", () => {
  assertEquals(safeResolveUnder("/root", "child/file.txt") !== null, true);
  assertEquals(safeResolveUnder("/root", "../etc/passwd"), null);
  assertEquals(safeResolveUnder("/root", "foo\0bar"), null);
  assertEquals(safeResolveUnder("/root", "/etc/passwd"), null);
  assertEquals(safeResolveUnder("/root", "C:\\Windows"), null);
});

Deno.test("validateSlug accepts valid and rejects invalid slugs", () => {
  assertEquals(validateSlug("page.md"), "page.md");
  assertEquals(validateSlug("sub/page.md"), "sub/page.md");
  assertEquals(validateSlug("page"), null);
  assertEquals(validateSlug("/page.md"), null);
  assertEquals(validateSlug("foo\0bar.md"), null);
  assertEquals(validateSlug("../escape.md"), null);
  assertEquals(validateSlug("a//b.md"), null);
  assertEquals(validateSlug("./page.md"), null);
});
