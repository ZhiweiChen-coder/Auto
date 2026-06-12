import { isOpenMode } from "@/lib/config";

/**
 * Credit metering seam (open-core: Option A). All code is open source; the
 * billing behaviour only activates when the open deployment is configured.
 *
 * - localGate (no-op): self-hosted/local, or any request that brings its own
 *   API key (BYOK) — unlimited, nothing is metered.
 * - supabaseGate: the hosted "open" deployment, backed by a Supabase ledger.
 *
 * To close-source the billing layer later, move supabase-gate.ts into a private
 * package and have getGate() import it from there — nothing else changes.
 */
export type CreditCheck = { allowed: boolean; remaining: number };

export class CreditGateUnavailableError extends Error {
  status = 503;
  expose = true;

  constructor(message = "Credit metering is not configured for this deployment.") {
    super(message);
    this.name = "CreditGateUnavailableError";
  }
}

export class InsufficientCreditsError extends Error {
  status = 402;
  expose = true;

  constructor(message = "You're out of credits. Add your own API key, or top up to keep going.") {
    super(message);
    this.name = "InsufficientCreditsError";
  }
}

export interface CreditGate {
  /** Whether the user has enough credits for a request/reservation. */
  check(userId: string, cost: number): Promise<CreditCheck>;
  /** Deduct `cost` credits atomically, throwing when the balance is too low. */
  consume(userId: string, cost: number): Promise<void>;
  /** Return unused reserved credits after the final result cost is known. */
  refund(userId: string, cost: number): Promise<void>;
  /** Current balance (for display). */
  remaining(userId: string): Promise<number>;
}

// Credit cost per result type. A workflow is 2-3 LLM calls, so it costs more.
export const COST = {
  clarify: 0,
  single: 1,
  workflow: 3,
} as const;

/** Unlimited, no-op gate. Used for local mode and BYOK requests. */
export const localGate: CreditGate = {
  async check() {
    return { allowed: true, remaining: Number.POSITIVE_INFINITY };
  },
  async consume() {
    /* no-op */
  },
  async refund() {
    /* no-op */
  },
  async remaining() {
    return Number.POSITIVE_INFINITY;
  },
};

export function supabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/**
 * Pick the gate for a request. BYOK always bypasses metering. In open mode we
 * fail closed unless a durable backend is configured, so a hosted deployment
 * cannot silently burn the shared OpenAI budget without credit checks.
 */
export async function getGate(
  opts: { byok?: boolean } = {},
): Promise<CreditGate> {
  if (opts.byok) return localGate;
  if (isOpenMode()) {
    // Dev-only in-memory backend for trying open-mode locally without Supabase.
    if (process.env.CREDITS_BACKEND === "memory") {
      if (process.env.NODE_ENV === "production") {
        throw new CreditGateUnavailableError(
          "CREDITS_BACKEND=memory cannot be used in production.",
        );
      }
      const { memoryGate } = await import("./memory-gate");
      return memoryGate;
    }
    if (supabaseConfigured()) {
      const { supabaseGate } = await import("./supabase-gate");
      return supabaseGate;
    }
    throw new CreditGateUnavailableError(
      "APP_MODE=open requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or CREDITS_BACKEND=memory for local development.",
    );
  }
  return localGate;
}
