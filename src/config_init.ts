import { ensureDir } from "@std/fs/ensure-dir";
import { join } from "@std/path";
import { stringify as yamlStringify } from "@std/yaml";
import { DEFAULTS } from "./core/config.ts";
import { REMOTE_SCHEMA_URL } from "./core/constants.ts";
import { writeConfigSchema } from "./schema.ts";

const DUMMY_INDEX = `\
---
title: my site
description: ""
---

# my site

welcome!
`;

export async function initProject(name: string) {
  try {
    const stat = await Deno.stat(name);
    if (stat.isDirectory) {
      throw new Error(`directory '${name}' already exists`);
    }
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) throw err;
  }

  // create directory structure
  const srcDir = join(name, DEFAULTS.src);
  await ensureDir(srcDir);

  // git init
  const git = new Deno.Command("git", {
    args: ["init", name],
    stdout: "inherit",
    stderr: "inherit",
  });
  const { success } = await git.output();
  if (!success) throw new Error("git init failed");

  // .gitignore
  await Deno.writeTextFile(join(name, ".gitignore"), "dist/\n");

  // config.yaml with remote schema
  const header = `# yaml-language-server: $schema=${REMOTE_SCHEMA_URL}\n`;
  const body = yamlStringify({ title: DEFAULTS.title, url: DEFAULTS.url })
    .trim();
  await Deno.writeTextFile(join(name, "config.yaml"), header + body + "\n");

  // dummy index page
  await Deno.writeTextFile(join(srcDir, "index.md"), DUMMY_INDEX);

  console.log(`created ${name}/`);
}

export async function writeDefaultConfig(
  path = "config.yaml",
  schemaPath = "config.schema.json",
  force = false,
) {
  if (!force) {
    try {
      await Deno.stat(path);
      throw new Error(`${path} already exists`);
    } catch (err) {
      if (!(err instanceof Deno.errors.NotFound)) throw err;
    }
  }

  const header = `# yaml-language-server: $schema=./${schemaPath}\n`;
  const body = yamlStringify(DEFAULTS).trim();
  await Deno.writeTextFile(path, header + body + "\n");
  await writeConfigSchema(schemaPath);
}
