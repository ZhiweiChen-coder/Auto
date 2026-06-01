import { CATALOG_VERSION, loadToolsFromDir, type Tool } from "@auto/catalog";
import { getDataPaths } from "./paths";

let cachedTools: Tool[] | null = null;

export async function getCatalogTools(): Promise<Tool[]> {
  if (cachedTools) return cachedTools;
  const { toolsDir } = getDataPaths();
  cachedTools = await loadToolsFromDir(toolsDir);
  return cachedTools;
}

export { CATALOG_VERSION };
