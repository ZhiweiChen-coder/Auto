"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLogoutButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function logout() {
    setIsSubmitting(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={isSubmitting}
      className="rounded-full bg-canvas-base px-3 py-1 text-xs font-semibold text-canvas-muted transition-colors hover:text-canvas-text disabled:cursor-not-allowed"
    >
      {isSubmitting ? "Signing out..." : "Sign out"}
    </button>
  );
}
