import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

export function getDataPaths() {
  let dir = process.cwd();
  while (true) {
    if (existsSync(join(dir, "data", "tools"))) {
      return {
        toolsDir: join(dir, "data/tools"),
        embeddingsPath: join(dir, "data/embeddings.json"),
        feedbackPath: join(dir, "data/feedback.jsonl"),
        repoRoot: dir,
      };
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  const fromWeb = join(process.cwd(), "../..");
  return {
    toolsDir: join(fromWeb, "data/tools"),
    embeddingsPath: join(fromWeb, "data/embeddings.json"),
    feedbackPath: join(fromWeb, "data/feedback.jsonl"),
    repoRoot: fromWeb,
  };
}
