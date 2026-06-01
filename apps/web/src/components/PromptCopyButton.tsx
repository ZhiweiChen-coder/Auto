"use client";

import { useState } from "react";

export function PromptCopyButton({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false);

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={copyPrompt}
      className="rounded-full bg-canvas-text px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-black"
    >
      {copied ? "Copied" : "Copy prompt"}
    </button>
  );
}
