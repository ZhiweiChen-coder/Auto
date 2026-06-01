"use client";

import { useState } from "react";

export function CopyShareLink({ query }: { query: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}/results?q=${encodeURIComponent(query)}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="text-sm font-medium text-canvas-muted transition-colors hover:text-canvas-brand"
    >
      {copied ? "Link copied" : "Copy link"}
    </button>
  );
}
