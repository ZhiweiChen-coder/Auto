import { getToolById } from "@auto/catalog";
import { getCatalogTools } from "@/lib/catalog";
import { errorResponse, jsonResponse, preflightResponse } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const tools = await getCatalogTools();
  const tool = getToolById(tools, id);
  if (!tool) {
    return errorResponse(`Tool not found: ${id}`, 404);
  }
  return jsonResponse(tool);
}

export async function OPTIONS() {
  return preflightResponse();
}
