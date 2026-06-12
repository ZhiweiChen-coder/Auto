import { InsufficientCreditsError, type CreditGate } from "./gate";

/**
 * In-memory credit ledger — for trying the open-mode UX locally without
 * provisioning Supabase (set APP_MODE=open and CREDITS_BACKEND=memory). State
 * is per-process and resets on restart, so it's for development only, never
 * production. Mirrors the semantics of db/credits.sql.
 */
const FREE_CREDITS = Number(process.env.FREE_CREDITS ?? 30);
const ledger = new Map<string, number>();

function ensure(userId: string): number {
  if (!ledger.has(userId)) ledger.set(userId, FREE_CREDITS);
  return ledger.get(userId) as number;
}

export const memoryGate: CreditGate = {
  async check(userId, cost) {
    const remaining = ensure(userId);
    return { allowed: remaining >= cost, remaining };
  },
  async consume(userId, cost) {
    if (cost <= 0) return;
    const remaining = ensure(userId);
    if (remaining < cost) throw new InsufficientCreditsError();
    ledger.set(userId, remaining - cost);
  },
  async refund(userId, cost) {
    if (cost <= 0) return;
    ledger.set(userId, ensure(userId) + cost);
  },
  async remaining(userId) {
    return ensure(userId);
  },
};
