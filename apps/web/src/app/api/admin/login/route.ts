import { z } from "zod";
import { errorResponse, jsonResponse } from "@/lib/api";
import {
  isAdminConfigured,
  setAdminSession,
  validateAdminToken,
} from "@/lib/admin-auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const LoginSchema = z.object({
  token: z.string().min(1).max(500),
});

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return errorResponse("ADMIN_TOKEN is not configured.", 403);
  }

  const ip = getClientIp(request);
  const rate = checkRateLimit(`admin-login:${ip}`);
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

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? "Invalid body", 400);
  }

  if (!validateAdminToken(parsed.data.token)) {
    return errorResponse("Invalid admin token.", 401);
  }

  await setAdminSession();
  return jsonResponse({ ok: true });
}
