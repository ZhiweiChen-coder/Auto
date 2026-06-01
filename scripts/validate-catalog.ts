import { join } from "node:path";
import { loadToolsFromDir } from "@auto/catalog";
import { findRepoRoot } from "@auto/core";

async function main() {
  const repoRoot = findRepoRoot();
  const toolsDir = join(repoRoot, "data/tools");
  const tools = await loadToolsFromDir(toolsDir);
  console.log(`Validated ${tools.length} tools in ${toolsDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
