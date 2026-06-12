import { NextResponse } from "next/server";
import { isOpenMode } from "@/lib/config";

/**
 * Allowed CORS origin. In the open (hosted) deployment set ALLOWED_ORIGIN (or
 * NEXT_PUBLIC_APP_URL) to your own domain so other sites can't call the API
 * from users' browsers and burn the shared OpenAI budget. With neither set we
 * fall back to "*" for the local / self-hosted version where it doesn't matter.
 */
function allowedOrigin(): string {
  // Local / self-hosted: no cross-origin concern, allow any caller.
  if (!isOpenMode()) return "*";
  // Open (hosted): lock to the app's own origin so other sites can't call the
  // API from users' browsers and burn the shared budget.
  return process.env.ALLOWED_ORIGIN ?? process.env.NEXT_PUBLIC_APP_URL ?? "*";
}

export function corsHeaders(): HeadersInit {
  const origin = allowedOrigin();
  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  // When the response varies by origin, caches must key on it.
  if (origin !== "*") headers.Vary = "Origin";
  return headers;
}

export function jsonResponse(
  data: unknown,
  init?: { status?: number; headers?: HeadersInit },
) {
  return NextResponse.json(data, {
    status: init?.status ?? 200,
    headers: { ...corsHeaders(), ...init?.headers },
  });
}

export function errorResponse(message: string, status: number) {
  return jsonResponse({ error: message }, { status });
}

/**
 * CORS preflight response. A 204 must have no body, so we can't use
 * NextResponse.json here (it always writes one and throws on 204).
 */
export function preflightResponse() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

/**
 * Map an unknown thrown error to a safe public {status, message}. Only
 * caller-actionable problems (a missing/invalid API key) are surfaced verbatim;
 * everything else is logged server-side and returned as a generic message so we
 * don't leak internal paths, model names, or stack details to clients.
 */
export function publicError(
  err: unknown,
  fallback: string,
): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : "";
  const maybePublic = err as { status?: unknown; expose?: unknown };
  if (
    typeof maybePublic.status === "number" &&
    maybePublic.expose === true &&
    raw
  ) {
    return { status: maybePublic.status, message: raw };
  }
  if (raw.includes("API key")) {
    return { status: 401, message: raw };
  }
  console.error("[api] unhandled error:", err);
  return { status: 500, message: fallback };
}

export function extractBearerApiKey(request: Request): string | undefined {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return undefined;
  const key = auth.slice(7).trim();
  return key.length > 0 ? key : undefined;
}
