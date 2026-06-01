import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export function findRepoRoot(startDir?: string): string {
  let dir = startDir ?? process.cwd();
  while (true) {
    if (existsSync(join(dir, "pnpm-workspace.yaml"))) {
      return dir;
    }
    if (existsSync(join(dir, "data", "tools"))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }
  const fromPackage = join(
    dirname(fileURLToPath(import.meta.url)),
    "../../..",
  );
  if (existsSync(join(fromPackage, "data", "tools"))) {
    return fromPackage;
  }
  return process.cwd();
}
