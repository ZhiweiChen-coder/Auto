"use client";

import { FormEvent, useEffect, useState } from "react";
import { useApiKey } from "@/lib/useApiKey";

type AppConfig = {
  mode: "local" | "open";
  requiresUserKey: boolean;
  serverHasKey: boolean;
};

function maskKey(key: string) {
  if (key.length <= 10) return "•••••";
  return `${key.slice(0, 3)}•••${key.slice(-4)}`;
}

/**
 * Lets a user store their own OpenAI key (BYOK). Shows prominently when the
 * deployment requires a user key (local with no server key); otherwise it's a
 * quiet, collapsible control for anyone who wants to use their own key.
 */
export function ByokKeyPanel() {
  const { apiKey, setApiKey, clearApiKey, loaded } = useApiKey();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [draft, setDraft] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/v1/config")
      .then((r) => r.json())
      .then((c: AppConfig) => active && setConfig(c))
      .catch(() => active && setConfig(null));
    return () => {
      active = false;
    };
  }, []);

  if (!loaded || !config) return null;

  const needsKey = config.requiresUserKey && !apiKey;
  // Nothing to nag about: server has a key and the user hasn't set one.
  if (!needsKey && !apiKey && !expanded) {
    return (
      <div className="mt-5 flex justify-center">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="press inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-canvas-subtle transition-colors hover:text-canvas-text"
        >
          <span aria-hidden className="text-[13px] leading-none">🔑</span>
          Use your own API key
        </button>
      </div>
    );
  }

  function onSave(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim()) return;
    setApiKey(draft);
    setDraft("");
    setExpanded(false);
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 2000);
  }

  return (
    <div
      className={`mt-5 rounded-2xl p-5 ring-1 ${
        needsKey
          ? "bg-canvas-brandLight ring-canvas-brand/30"
          : "bg-canvas-white ring-canvas-border/60"
      }`}
    >
      {apiKey ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-canvas-text">
              Using your own API key
            </p>
            <p className="mt-0.5 font-mono text-xs text-canvas-muted">
              {maskKey(apiKey)}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setExpanded(true);
                setApiKey("");
              }}
              className="press rounded-full bg-canvas-base px-4 py-2 text-xs font-semibold text-canvas-text hover:bg-canvas-border/50"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={clearApiKey}
              className="press rounded-full px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={onSave} className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-canvas-text">
              {needsKey
                ? "Add your OpenAI API key to get recommendations"
                : "Use your own OpenAI API key"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-canvas-muted">
              Stored only in this browser and sent directly to recommendation
              requests. {config.mode === "open" && "Your key is used instead of shared credits."}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="password"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoComplete="off"
              placeholder="sk-..."
              className="lift flex-1 rounded-full border border-canvas-border bg-white px-4 py-2.5 text-sm text-canvas-text outline-none focus:border-canvas-brand focus:ring-2 focus:ring-canvas-brand/20"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="lift press rounded-full bg-canvas-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-canvas-brandHover disabled:cursor-not-allowed disabled:bg-canvas-subtle"
            >
              Save key
            </button>
          </div>
        </form>
      )}
      {justSaved && (
        <p className="mt-2 text-xs font-medium text-canvas-brand">Key saved.</p>
      )}
    </div>
  );
}
