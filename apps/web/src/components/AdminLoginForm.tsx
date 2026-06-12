"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type AdminLoginFormProps = {
  compact?: boolean;
  onSuccess?: () => void;
};

export function AdminLoginForm({ compact = false, onSuccess }: AdminLoginFormProps) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(undefined);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Login failed");
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.replace("/admin/feedback");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={compact ? "mt-4 space-y-3" : "mt-6 space-y-4"}>
      <label className="block">
        <span className="text-sm font-semibold text-canvas-text">Admin token</span>
        <input
          type="password"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          autoComplete="current-password"
          className={`mt-2 w-full rounded-2xl border border-canvas-border bg-white text-sm text-canvas-text outline-none transition-colors focus:border-canvas-brand focus:ring-2 focus:ring-canvas-brand/20 ${
            compact ? "px-3 py-2.5" : "px-4 py-3"
          }`}
          placeholder="Enter ADMIN_TOKEN"
        />
      </label>
      <button
        type="submit"
        disabled={isSubmitting || !token.trim()}
        className="w-full rounded-full bg-canvas-brand px-5 py-3 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-canvas-brandHover disabled:cursor-not-allowed disabled:bg-canvas-subtle"
      >
        {isSubmitting ? "Checking..." : "Sign in"}
      </button>
      {error && <p className="text-sm font-medium text-red-700">{error}</p>}
    </form>
  );
}
