import { NextResponse } from "next/server";

export function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
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

export function extractBearerApiKey(request: Request): string | undefined {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return undefined;
  const key = auth.slice(7).trim();
  return key.length > 0 ? key : undefined;
}
