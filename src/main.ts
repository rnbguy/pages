#!/usr/bin/env -S deno run --allow-read --allow-write --allow-net

import { Command } from "@cliffy/command";
import { initProject, writeDefaultConfig } from "./config_init.ts";
import { loadConfig, stripUndefined } from "./core/config.ts";
import type { Config } from "./core/types.ts";
import { scaffold } from "./scaffold.ts";
import { writeConfigSchema } from "./schema.ts";
import { serve } from "./serve.ts";

await new Command()
  .name("pages")
  .version("0.1.0")
  .description("minimal static site generator")
  .command("build", "build the site")
  .option("--src <path:string>", "source directory")
  .option("--dest <path:string>", "output directory")
  .option("--url <url:string>", "site base url")
  .action(async (opts: { src?: string; dest?: string; url?: string }) => {
    const cfg = { ...loadConfig(), ...stripUndefined(opts) };
    const { build } = await import("./build.ts");
    await build(cfg);
  })
  .command("serve", "serve the built site")
  .option("--src <path:string>", "source directory")
  .option("--dest <path:string>", "output directory")
  .option("--url <url:string>", "site base url")
  .option("-p, --port <port:number>", "port", { default: 8000 })
  .action(
    async (
      opts: { src?: string; dest?: string; url?: string; port: number },
    ) => {
      const cfg: Config = { ...loadConfig(), ...stripUndefined(opts) };
      await serve(cfg, opts.port);
    },
  )
  .command("new", "scaffold a new page interactively")
  .action(async () => {
    const cfg = loadConfig();
    await scaffold(cfg);
  })
  .command("init", "create a new site project")
  .arguments("<name:string>")
  .action(async (_opts: void, name: string) => {
    await initProject(name);
  })
  .command("config", "write default config.yaml and schema")
  .option("-f, --force", "overwrite existing config")
  .action(async (opts: { force?: boolean }) => {
    await writeDefaultConfig("config.yaml", "config.schema.json", !!opts.force);
  })
  .command("schema", "regenerate config.schema.json")
  .action(async () => {
    await writeConfigSchema("config.schema.json");
  })
  .parse(Deno.args);
