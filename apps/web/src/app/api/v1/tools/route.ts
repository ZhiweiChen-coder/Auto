import { type ToolCategory } from "@auto/catalog";
import { getCatalogTools } from "@/lib/catalog";
import { jsonResponse, preflightResponse } from "@/lib/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") as ToolCategory | null;
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? "50")));

  let tools = await getCatalogTools();
  if (category) {
    tools = tools.filter((t) => t.category === category);
  }

  const total = tools.length;
  const start = (page - 1) * pageSize;
  const items = tools.slice(start, start + pageSize);

  return jsonResponse({
    items,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function OPTIONS() {
  return preflightResponse();
}
