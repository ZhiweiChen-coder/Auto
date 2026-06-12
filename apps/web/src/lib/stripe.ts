/**
 * Stripe wiring for credit top-ups (open deployment only). Env-driven and
 * lazily imported so the local/self-hosted build never pulls Stripe at runtime.
 *
 * Required env to enable:
 *   STRIPE_SECRET_KEY=sk_...            (server only — never commit/paste)
 *   STRIPE_PRICE_ID=price_...           (the credit pack to sell)
 *   STRIPE_WEBHOOK_SECRET=whsec_...     (from the webhook endpoint)
 *   CREDITS_PER_PURCHASE=100            (credits granted per successful payment)
 */
export const CREDITS_PER_PURCHASE = Number(
  process.env.CREDITS_PER_PURCHASE ?? 100,
);

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** Whether the buy-credits flow can run (secret key + a price configured). */
export function topUpEnabled(): boolean {
  return stripeConfigured() && Boolean(process.env.STRIPE_PRICE_ID);
}

export async function getStripe() {
  const { default: Stripe } = await import("stripe");
  return new Stripe(process.env.STRIPE_SECRET_KEY as string);
}
