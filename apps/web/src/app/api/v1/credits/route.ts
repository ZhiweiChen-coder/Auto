import { errorResponse, jsonResponse, preflightResponse, publicError } from "@/lib/api";
import { getGate, localGate } from "@/lib/credits/gate";
import { readUserId } from "@/lib/credits/identity";
import { topUpEnabled } from "@/lib/stripe";

/** Current credit balance for display. Returns metered:false when unmetered. */
export async function GET() {
  try {
    const gate = await getGate();
    if (gate === localGate) {
      return jsonResponse({ metered: false });
    }
    const userId = await readUserId();
    const remaining = userId
      ? await gate.remaining(userId)
      : Number(process.env.FREE_CREDITS ?? 30);
    return jsonResponse({ metered: true, remaining, canTopUp: topUpEnabled() });
  } catch (err) {
    const { status, message } = publicError(err, "Could not read credits");
    return errorResponse(message, status);
  }
}

export async function OPTIONS() {
  return preflightResponse();
}
