import { InsufficientCreditsError, type CreditGate } from "./gate";

/**
 * Supabase-backed credit ledger for the open deployment. The client is loaded
 * lazily so the local/self-hosted build never pulls it at runtime. Schema +
 * RPCs live in db/credits.sql.
 *
 * (Open-core seam: to close-source billing, move this file to a private package
 * and point getGate() at it — the interface stays identical.)
 */
const FREE_CREDITS = Number(process.env.FREE_CREDITS ?? 30);

async function db() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false } },
  );
}

export const supabaseGate: CreditGate = {
  async check(userId, cost) {
    const client = await db();
    const { data, error } = await client.rpc("ensure_credits", {
      p_user_id: userId,
      p_grant: FREE_CREDITS,
    });
    if (error) throw new Error(`credits check failed: ${error.message}`);
    const remaining = typeof data === "number" ? data : FREE_CREDITS;
    return { allowed: remaining >= cost, remaining };
  },

  async consume(userId, cost) {
    if (cost <= 0) return;
    const client = await db();
    const { data, error } = await client.rpc("consume_credits", {
      p_user_id: userId,
      p_cost: cost,
      p_grant: FREE_CREDITS,
    });
    if (error) throw new Error(`credits consume failed: ${error.message}`);
    if (typeof data !== "number") throw new InsufficientCreditsError();
  },

  async refund(userId, cost) {
    if (cost <= 0) return;
    await addCredits(userId, cost);
  },

  async remaining(userId) {
    const client = await db();
    const { data, error } = await client.rpc("ensure_credits", {
      p_user_id: userId,
      p_grant: FREE_CREDITS,
    });
    if (error) return 0;
    return typeof data === "number" ? data : 0;
  },
};

/**
 * Move an anonymous credit balance into an account on sign-in (see
 * merge_credits in db/credits.sql). Best-effort: a failure here must not block
 * login, so callers log and continue rather than throw.
 */
export async function mergeCredits(from: string, to: string): Promise<void> {
  if (!from || from === to) return;
  const client = await db();
  const { error } = await client.rpc("merge_credits", {
    p_from: from,
    p_to: to,
    p_grant: FREE_CREDITS,
  });
  if (error) throw new Error(`merge_credits failed: ${error.message}`);
}

/** Add credits to a user's balance (used by the Stripe top-up webhook). */
export async function addCredits(userId: string, amount: number): Promise<void> {
  const client = await db();
  const { error } = await client.rpc("add_credits", {
    p_user_id: userId,
    p_amount: amount,
  });
  if (error) throw new Error(`add_credits failed: ${error.message}`);
}
