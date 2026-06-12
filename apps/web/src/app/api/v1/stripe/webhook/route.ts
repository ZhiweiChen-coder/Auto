import { errorResponse, jsonResponse } from "@/lib/api";
import { supabaseConfigured } from "@/lib/credits/gate";
import { getStripe, stripeConfigured } from "@/lib/stripe";

// Stripe needs the raw, unparsed body to verify the signature.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeConfigured() || !secret) {
    return errorResponse("Stripe is not configured.", 503);
  }
  if (!supabaseConfigured()) {
    return errorResponse("Credit backend is not configured.", 503);
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return errorResponse("Missing stripe-signature", 400);

  const raw = await request.text();
  const stripe = await getStripe();

  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, secret);
  } catch {
    // Bad signature → likely a forged/replayed request.
    return errorResponse("Invalid signature", 400);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      client_reference_id?: string | null;
      metadata?: Record<string, string> | null;
    };
    const userId = session.client_reference_id ?? session.metadata?.userId;
    const credits = Number(session.metadata?.credits ?? 0);
    if (userId && credits > 0) {
      try {
        const { addCredits } = await import("@/lib/credits/supabase-gate");
        await addCredits(userId, credits);
      } catch (err) {
        // Returning 500 lets Stripe retry the webhook.
        console.error("[stripe] crediting failed:", err);
        return errorResponse("Crediting failed", 500);
      }
    }
  }

  return jsonResponse({ received: true });
}
