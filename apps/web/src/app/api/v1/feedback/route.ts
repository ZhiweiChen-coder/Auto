import { z } from "zod";
import { errorResponse, jsonResponse } from "@/lib/api";
import { saveFeedback, type FeedbackRecord } from "@/lib/feedback-store";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const FeedbackSchema = z.object({
  query: z.string().min(1).max(2000),
  rating: z.enum(["good_match", "not_right", "too_advanced"]),
  primaryToolId: z.string().min(1).max(120).optional(),
  alternativeToolIds: z.array(z.string().min(1).max(120)).max(3).optional(),
  routeLabels: z.array(z.string().min(1).max(80)).max(3).optional(),
  elapsedMs: z.number().int().min(0).max(120_000).optional(),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`feedback:${ip}`);
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

  const parsed = FeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? "Invalid body", 400);
  }

  const feedbackId = crypto.randomUUID();
  const record: FeedbackRecord = {
    id: feedbackId,
    createdAt: new Date().toISOString(),
    userAgent: request.headers.get("user-agent") ?? undefined,
    ...parsed.data,
  };

  try {
    await saveFeedback(record);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save feedback";
    return errorResponse(message, 500);
  }

  return jsonResponse({ ok: true, feedbackId });
}

export async function OPTIONS() {
  return jsonResponse({}, { status: 204 });
}
