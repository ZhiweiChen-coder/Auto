import { errorResponse, jsonResponse, preflightResponse } from "@/lib/api";
import { isOpenMode } from "@/lib/config";
import { supabaseConfigured } from "@/lib/credits/gate";
import { resolveCreditSubject } from "@/lib/credits/subject";
import { CREDITS_PER_PURCHASE, getStripe, topUpEnabled } from "@/lib/stripe";

/** Create a Stripe Checkout Session for a credit top-up and return its URL. */
export async function POST(request: Request) {
  if (!isOpenMode() || !topUpEnabled()) {
    return errorResponse("Top-up is not available on this deployment.", 503);
  }
  if (!supabaseConfigured()) {
    return errorResponse("Credit backend is not configured.", 503);
  }

  const userId = await resolveCreditSubject();
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;

  try {
    const stripe = await getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: process.env.STRIPE_PRICE_ID as string, quantity: 1 }],
      // Ties the payment back to the credit subject for the webhook.
      client_reference_id: userId,
      metadata: { userId, credits: String(CREDITS_PER_PURCHASE) },
      success_url: `${origin}/?topup=success`,
      cancel_url: `${origin}/?topup=cancel`,
    });
    return jsonResponse({ url: session.url });
  } catch (err) {
    console.error("[stripe] checkout failed:", err);
    return errorResponse("Could not start checkout.", 502);
  }
}

export async function OPTIONS() {
  return preflightResponse();
}
