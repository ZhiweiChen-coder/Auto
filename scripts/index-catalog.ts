import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { CATALOG_VERSION, loadToolsFromDir } from "@auto/catalog";
import OpenAI from "openai";
import { embedText, toolToEmbeddingText } from "@auto/core";
import { findRepoRoot } from "@auto/core";

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error(
      "OPENAI_API_KEY is required. Or run: pnpm index-catalog:mock (dev only)",
    );
    process.exit(1);
  }

  const model = process.env.EMBEDDING_MODEL ?? "text-embedding-3-small";
  const repoRoot = findRepoRoot();
  const toolsDir = join(repoRoot, "data/tools");
  const outPath = join(repoRoot, "data/embeddings.json");

  const tools = await loadToolsFromDir(toolsDir);
  const client = new OpenAI({ apiKey });

  console.log(`Embedding ${tools.length} tools with ${model}...`);

  const embedded = [];
  for (const tool of tools) {
    const text = toolToEmbeddingText(tool);
    const embedding = await embedText(client, text, model);
    embedded.push({ toolId: tool.id, embedding });
    console.log(`  ✓ ${tool.id}`);
  }

  const payload = {
    version: CATALOG_VERSION,
    model,
    generatedAt: new Date().toISOString(),
    tools: embedded,
  };

  await writeFile(outPath, JSON.stringify(payload, null, 2), "utf-8");
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
