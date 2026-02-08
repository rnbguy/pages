import { Input, Select } from "@cliffy/prompt";
import { ensureDir } from "@std/fs/ensure-dir";
import { dirname, resolve } from "@std/path";
import { stringify as yamlStringify } from "@std/yaml";
import type { Config } from "./core/types.ts";
import { safeResolveUnder, validateSlug } from "./core/security.ts";

export async function scaffold(cfg: Config) {
  const title = await Input.prompt({ message: "page title", minLength: 1 });
  const description = await Input.prompt({ message: "description" });
  const tags = await Input.prompt({
    message: "tags (comma separated)",
    default: "",
  });
  const status = await Select.prompt({
    message: "status",
    options: ["draft", "published"],
    default: "published",
  });
  const slug = await Input.prompt({
    message: "file path (relative to pages/)",
    default:
      title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") +
      ".md",
  });
  const cleanedSlug = validateSlug(slug);
  if (!cleanedSlug) throw new Error("invalid slug");

  const tagList = tags.split(",").map((t: string) => t.trim()).filter(Boolean);
  const date = new Date().toISOString().split("T")[0];
  const frontmatter = {
    title,
    description,
    ...(tagList.length ? { tags: tagList } : {}),
    date,
    ...(status === "draft" ? { draft: true } : {}),
  };
  const fm = [
    "---",
    yamlStringify(frontmatter).trim(),
    "---",
    "",
    `# ${title}`,
    "",
  ].join("\n");

  const outPath = safeResolveUnder(resolve(cfg.src), cleanedSlug);
  if (!outPath) throw new Error("invalid slug");
  await ensureDir(dirname(outPath));
  await Deno.writeTextFile(outPath, fm);
  console.log(`created ${outPath}`);
}
