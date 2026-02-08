import { stringify as yamlStringify } from "@std/yaml";
import { DEFAULTS } from "./core/config.ts";
import { writeConfigSchema } from "./schema.ts";

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
