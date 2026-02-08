import { ConfigSchema } from "./core/types.ts";

export function buildConfigSchema(): Record<string, unknown> {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    ...ConfigSchema,
  };
}

export async function writeConfigSchema(path = "config.schema.json") {
  const schema = buildConfigSchema();
  await Deno.writeTextFile(path, JSON.stringify(schema, null, 2) + "\n");
}
