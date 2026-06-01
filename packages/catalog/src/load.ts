import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";
import { ToolSchema, type Tool } from "./schema.js";

export async function loadToolsFromDir(toolsDir: string): Promise<Tool[]> {
  const entries = await readdir(toolsDir, { withFileTypes: true });
  const yamlFiles = entries
    .filter((e) => e.isFile() && (e.name.endsWith(".yaml") || e.name.endsWith(".yml")))
    .map((e) => e.name)
    .sort();

  const tools: Tool[] = [];
  const seenIds = new Set<string>();

  for (const file of yamlFiles) {
    const raw = await readFile(join(toolsDir, file), "utf-8");
    const parsed = parse(raw);
    const result = ToolSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(
        `Invalid tool in ${file}: ${result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
      );
    }
    if (seenIds.has(result.data.id)) {
      throw new Error(`Duplicate tool id "${result.data.id}" in ${file}`);
    }
    seenIds.add(result.data.id);
    tools.push(result.data);
  }

  return tools.sort((a, b) => a.id.localeCompare(b.id));
}

export function getToolById(tools: Tool[], id: string): Tool | undefined {
  return tools.find((t) => t.id === id);
}
