import { recommend } from "@auto/core";
import { z } from "zod";
import {
  errorResponse,
  extractBearerApiKey,
  jsonResponse,
} from "@/lib/api";
import { getDataPaths } from "@/lib/paths";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const BodySchema = z.object({
  query: z.string().min(1).max(2000),
  limit: z.number().int().min(0).max(3).optional(),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(ip);
  if (!rate.ok) {
    return errorResponse(
      `Rate limit exceeded. Retry after ${rate.retryAfterSec}s.`,
      429,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? "Invalid body", 400);
  }

  const byok = extractBearerApiKey(request);
  const { toolsDir, embeddingsPath } = getDataPaths();

  try {
    const result = await recommend(parsed.data.query, {
      limit: parsed.data.limit,
      openaiApiKey: byok,
      toolsDir,
      embeddingsPath,
    });
    return jsonResponse(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Recommendation failed";
    const status = message.includes("API key") ? 401 : 500;
    return errorResponse(message, status);
  }
}

export async function OPTIONS() {
  return jsonResponse({}, { status: 204 });
}
