import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";
import { findRepoRoot } from "@auto/core";

/**
 * One-time backfill of the now-required `outputTypes` field on every tool YAML.
 *
 * `outputType` describes what the tool *produces* (used by workflow per-step
 * retrieval to filter the catalog). Category alone is a weak signal — several
 * tools live in a category that doesn't match their output (audio tools tagged
 * `general`/`video`, meeting tools tagged `automation` that really emit
 * documents, etc.), so those are listed explicitly in OVERRIDES.
 *
 * Idempotent: files that already declare `outputTypes` are skipped.
 */

// Valid OutputType enum (keep in sync with packages/catalog/src/schema.ts)
type OutputType =
  | "app"
  | "audio"
  | "automation"
  | "code"
  | "document"
  | "image"
  | "presentation"
  | "research"
  | "video"
  | "website";

const CATEGORY_SEED: Record<string, OutputType[]> = {
  "app-builder": ["app", "website"],
  automation: ["automation"],
  coding: ["code"],
  general: ["document"],
  image: ["image"],
  local: ["document"],
  search: ["research"],
  video: ["video"],
  writing: ["document"],
};

// Tools whose true output differs from their category default.
const OVERRIDES: Record<string, OutputType[]> = {
  // audio / music / voice
  elevenlabs: ["audio"],
  suno: ["audio"],
  murf: ["audio"],
  descript: ["video", "audio"],
  // presentations
  "beautiful-ai": ["presentation"],
  gamma: ["presentation", "document"],
  canva: ["image", "presentation"],
  "adobe-express": ["image", "video"],
  // website builders (app-builder category, but website-focused)
  framer: ["website"],
  webflow: ["website"],
  "wix-ai-website-builder": ["website"],
  "figma-ai": ["image"],
  // generalist assistants that also write code
  chatgpt: ["document", "code"],
  claude: ["document", "code"],
  gemini: ["document", "code"],
  phind: ["code", "research"],
  replicate: ["code", "image"],
  // meeting / transcription tools emit documents, not "automation"
  fireflies: ["document"],
  "otter-ai": ["document"],
  tldv: ["document"],
  // research + documents
  notebooklm: ["document", "research"],
};

async function main() {
  const repoRoot = findRepoRoot();
  const toolsDir = join(repoRoot, "data/tools");
  const entries = await readdir(toolsDir);
  const files = entries.filter((f) => f.endsWith(".yaml") || f.endsWith(".yml")).sort();

  let written = 0;
  let skipped = 0;
  for (const file of files) {
    const path = join(toolsDir, file);
    const raw = await readFile(path, "utf-8");
    if (/^outputTypes:/m.test(raw)) {
      skipped++;
      continue;
    }
    const parsed = parse(raw) as { id: string; category: string };
    const types = OVERRIDES[parsed.id] ?? CATEGORY_SEED[parsed.category];
    if (!types) {
      throw new Error(`No outputTypes mapping for ${parsed.id} (category=${parsed.category})`);
    }
    const line = `outputTypes: [${types.join(", ")}]\n`;
    const next = `${raw.replace(/\s*$/, "")}\n${line}`;
    await writeFile(path, next, "utf-8");
    console.log(`${parsed.id.padEnd(24)} -> [${types.join(", ")}]`);
    written++;
  }
  console.log(`\nDone. Wrote ${written}, skipped ${skipped}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
