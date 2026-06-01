import { CATALOG_VERSION, getCatalogTools } from "@/lib/catalog";
import { jsonResponse } from "@/lib/api";

export async function GET() {
  const tools = await getCatalogTools();
  return jsonResponse({
    status: "ok",
    catalogVersion: CATALOG_VERSION,
    toolsCount: tools.length,
  });
}

export async function OPTIONS() {
  return jsonResponse({}, { status: 204 });
}
