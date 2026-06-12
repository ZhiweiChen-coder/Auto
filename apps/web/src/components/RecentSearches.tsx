"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "auto-recent-searches";
const MAX = 5;

export function RecentSearches({ onPick }: { onPick: (query: string) => void }) {
  const [items, setItems] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as string[]);
    } catch {
      setItems([]);
    }
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="mt-2 w-full text-center">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="press inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-canvas-subtle transition-colors hover:text-canvas-muted"
      >
        {open ? "Hide recent" : "Recent"}
      </button>
      {open && (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {items.slice(0, 3).map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onPick(q)}
              className="max-w-[180px] truncate rounded-full border border-canvas-border bg-white/60 px-4 py-2 text-sm text-canvas-muted transition-colors hover:text-canvas-brand"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function saveRecentSearch(query: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const prev = raw ? (JSON.parse(raw) as string[]) : [];
    const next = [query, ...prev.filter((q) => q !== query)].slice(0, MAX);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}
