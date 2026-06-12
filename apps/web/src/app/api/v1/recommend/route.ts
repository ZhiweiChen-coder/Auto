import { recommend, type RecommendResponse } from "@auto/core";
import { z } from "zod";
import {
  corsHeaders,
  errorResponse,
  extractBearerApiKey,
  jsonResponse,
  preflightResponse,
  publicError,
} from "@/lib/api";
import { COST, getGate, localGate } from "@/lib/credits/gate";
import { getOrCreateUserId } from "@/lib/credits/identity";
import { getDataPaths } from "@/lib/paths";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const BodySchema = z.object({
  query: z.string().min(1).max(2000),
  limit: z.number().int().min(0).max(3).optional(),
  mode: z.enum(["auto", "workflow"]).optional(),
});

/** Credit cost of a result: workflows are pricier, clarifications are free. */
function costOf(result: RecommendResponse): number {
  if (result.workflow) return COST.workflow;
  if (result.needsClarification) return COST.clarify;
  return COST.single;
}

// Reserve enough for the most expensive successful result, then refund the
// difference after recommendation. This prevents an auto-routed workflow from
// running on a balance that only covers a single-tool result.
const RESERVATION_COST = COST.workflow;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rate = await checkRateLimit(ip);
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

  // Credit gate: no-op for local mode and BYOK; the Supabase ledger in open
  // mode. Check before spending OpenAI budget; settle the actual cost after.
  let gate: Awaited<ReturnType<typeof getGate>>;
  let metered = false;
  let userId: string | null = null;
  let reserved = false;
  try {
    gate = await getGate({ byok: Boolean(byok) });
    metered = gate !== localGate;
    userId = metered ? await getOrCreateUserId() : null;
    if (metered && userId) {
      const { allowed } = await gate.check(userId, RESERVATION_COST);
      if (!allowed) {
        return errorResponse(
          `You need at least ${RESERVATION_COST} credits to run a recommendation. Add your own API key, or top up to keep going.`,
          402,
        );
      }
      await gate.consume(userId, RESERVATION_COST);
      reserved = true;
    }
  } catch (err) {
    const { status, message } = publicError(err, "Credit check failed");
    return errorResponse(message, status);
  }

  const settle = async (result: RecommendResponse) => {
    if (!reserved || !metered || !userId) return;
    const refund = RESERVATION_COST - costOf(result);
    if (refund <= 0) return;
    try {
      await gate.refund(userId, refund);
    } catch (err) {
      console.error("[credits] refund failed:", err);
    }
  };
  const refundReservation = async () => {
    if (!reserved || !metered || !userId) return;
    try {
      await gate.refund(userId, RESERVATION_COST);
      reserved = false;
    } catch (err) {
      console.error("[credits] reservation refund failed:", err);
    }
  };

  const url = new URL(request.url);
  const wantsStream =
    url.searchParams.get("stream") === "1" ||
    (request.headers.get("accept") ?? "").includes("text/event-stream");

  // Streaming path: emit real pipeline stages as Server-Sent Events so the UI
  // can show genuine progress. Opt-in only, so the documented JSON API below is
  // unchanged for normal consumers.
  if (wantsStream) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
          );
        };
        try {
          const result = await recommend(parsed.data.query, {
            limit: parsed.data.limit,
            mode: parsed.data.mode,
            openaiApiKey: byok,
            toolsDir,
            embeddingsPath,
            onProgress: (stage) => send("progress", { stage }),
          });
          await settle(result);
          send("result", result);
        } catch (err) {
          await refundReservation();
          const { message } = publicError(err, "Recommendation failed");
          send("error", { error: message });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
        ...corsHeaders(),
      },
    });
  }

  try {
    const result = await recommend(parsed.data.query, {
      limit: parsed.data.limit,
      mode: parsed.data.mode,
      openaiApiKey: byok,
      toolsDir,
      embeddingsPath,
    });
    await settle(result);
    return jsonResponse(result);
  } catch (err) {
    await refundReservation();
    const { status, message } = publicError(err, "Recommendation failed");
    return errorResponse(message, status);
  }
}

export async function OPTIONS() {
  return preflightResponse();
}
