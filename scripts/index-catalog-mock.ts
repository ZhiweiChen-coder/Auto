import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { CATALOG_VERSION, loadToolsFromDir } from "@auto/catalog";
import { findRepoRoot, mockEmbed, MOCK_EMBEDDING_MODEL, toolToEmbeddingText } from "@auto/core";

async function main() {
  const repoRoot = findRepoRoot();
  const toolsDir = join(repoRoot, "data/tools");
  const outPath = join(repoRoot, "data/embeddings.json");

  const tools = await loadToolsFromDir(toolsDir);
  console.log(`Generating mock embeddings for ${tools.length} tools...`);

  const embedded = tools.map((tool) => ({
    toolId: tool.id,
    embedding: mockEmbed(toolToEmbeddingText(tool)),
  }));

  const payload = {
    version: CATALOG_VERSION,
    model: MOCK_EMBEDDING_MODEL,
    generatedAt: new Date().toISOString(),
    note: "Dev/CI mock embeddings. Run pnpm index-catalog with OPENAI_API_KEY for production quality.",
    tools: embedded,
  };

  await writeFile(outPath, JSON.stringify(payload, null, 2), "utf-8");
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
