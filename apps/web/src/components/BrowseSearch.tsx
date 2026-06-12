"use client";

import { useMemo, useState } from "react";
import type { Tool } from "@auto/catalog";
import {
  CategoryBadge,
  DeploymentBadge,
  PricingBadge,
} from "./Badges";
import { ToolLogo } from "./ToolLogo";

export function BrowseSearch({ tools }: { tools: Tool[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return tools;
    return tools.filter(
      (t) =>
        t.name.toLowerCase().includes(needle) ||
        t.description.toLowerCase().includes(needle) ||
        t.tags.some((tag) => tag.toLowerCase().includes(needle)) ||
        t.bestFor.some((b) => b.toLowerCase().includes(needle)),
    );
  }, [tools, q]);

  return (
    <>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="w-full max-w-md">
          <span className="sr-only">Search tools</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tools…"
            className="w-full rounded-full border border-canvas-border bg-canvas-white px-5 py-2.5 text-sm shadow-soft placeholder:text-canvas-subtle focus:border-canvas-brand focus:outline-none focus:ring-2 focus:ring-canvas-brand/20"
          />
        </label>
        <p className="text-sm font-medium text-canvas-muted">
          {filtered.length} of {tools.length} tools
        </p>
      </div>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {filtered.map((tool) => (
          <li
            key={tool.id}
            className="rounded-2xl bg-canvas-white p-5 shadow-soft ring-1 ring-canvas-border/50 transition-all hover:-translate-y-0.5 hover:shadow-card"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <CategoryBadge category={tool.category} />
                <DeploymentBadge deployment={tool.deployment} />
                <PricingBadge pricing={tool.pricing} />
              </div>
              <ToolLogo name={tool.name} url={tool.url} className="h-12 w-12" />
            </div>
            <h2 className="font-bold text-canvas-text">{tool.name}</h2>
            <p className="mt-1 line-clamp-2 text-sm text-canvas-muted">
              {tool.description}
            </p>
            <p className="mt-4 line-clamp-2 text-sm font-medium leading-relaxed text-canvas-text">
              Best for {tool.bestFor[0]}.
            </p>
            <a
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm font-semibold text-canvas-brand hover:underline"
            >
              Visit site →
            </a>
          </li>
        ))}
      </ul>
      {filtered.length === 0 && (
        <p className="mt-8 text-center text-canvas-muted">No tools match your search.</p>
      )}
    </>
  );
}
