"use client";

import { useEffect, useState } from "react";

type CreditsState = { metered: boolean; remaining?: number; canTopUp?: boolean };

/**
 * Shows the remaining credit balance — only in the open (metered) deployment.
 * Renders nothing for local/self-hosted, so it never clutters the BYOK UI.
 * When Stripe is configured, also offers a Top up button.
 */
export function CreditsBadge() {
  const [state, setState] = useState<CreditsState | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/v1/credits")
      .then((r) => r.json())
      .then((d: CreditsState) => active && setState(d))
      .catch(() => active && setState(null));
    return () => {
      active = false;
    };
  }, []);

  if (!state?.metered || typeof state.remaining !== "number") return null;

  async function topUp() {
    setBusy(true);
    try {
      const res = await fetch("/api/v1/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setBusy(false);
    } catch {
      setBusy(false);
    }
  }

  const low = state.remaining <= 5;
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold ${
          low ? "bg-amber-50 text-amber-700" : "bg-canvas-base text-canvas-muted"
        }`}
        title="Free credits remaining. Bring your own API key for unlimited use."
      >
        {state.remaining} credits left
      </span>
      {state.canTopUp && (
        <button
          type="button"
          onClick={topUp}
          disabled={busy}
          className="press rounded-full bg-canvas-text px-3 py-1 text-xs font-semibold text-white hover:bg-canvas-text/90 disabled:opacity-60"
        >
          {busy ? "…" : "Top up"}
        </button>
      )}
    </span>
  );
}
