import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;

type RateResult = { ok: true } | { ok: false; retryAfterSec: number };

// --- Shared backend (open / multi-instance Vercel deploy) ------------------
// A process-local Map does NOT work across serverless instances — each cold
// start gets its own, so limits are bypassable. When Upstash env vars are
// present we use a shared sliding window; otherwise we fall back to the
// in-memory limiter, which is fine for the single-instance local/self-host build.
const hasUpstash =
  Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
  Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

const ratelimit = hasUpstash
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(MAX_REQUESTS, "60 s"),
      prefix: "auto-rl",
      analytics: false,
    })
  : null;

// --- In-memory fallback (single instance) ----------------------------------
const hits = new Map<string, { count: number; resetAt: number }>();

function sweepExpired(now: number) {
  for (const [key, entry] of hits) {
    if (now >= entry.resetAt) hits.delete(key);
  }
}

function memoryCheck(key: string): RateResult {
  const now = Date.now();
  // Opportunistic cleanup so the map can't grow unbounded with unique keys.
  if (hits.size > 5_000) sweepExpired(now);

  const entry = hits.get(key);
  if (!entry || now >= entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }
  if (entry.count >= MAX_REQUESTS) {
    return { ok: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count += 1;
  return { ok: true };
}

export async function checkRateLimit(key: string): Promise<RateResult> {
  if (ratelimit) {
    const { success, reset } = await ratelimit.limit(key);
    if (success) return { ok: true };
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((reset - Date.now()) / 1000)),
    };
  }
  return memoryCheck(key);
}

export function getClientIp(request: Request): string {
  // On Vercel, x-real-ip is the platform-resolved client IP and is harder to
  // spoof than the client-supplied x-forwarded-for chain. Prefer it, then fall
  // back to the first forwarded hop. Note: at the app layer no header is fully
  // spoof-proof — durable abuse protection comes from accounts/credits (open
  // version), not IP alone.
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return "unknown";
}
