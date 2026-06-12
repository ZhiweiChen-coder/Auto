"use client";

import { useState } from "react";

/**
 * Tool logo derived from the product's own domain favicon. Falls back to a
 * letter monogram if the icon fails to load, so a card never shows a broken
 * image. Logos identify each third-party product (nominative use — see the
 * footer disclaimer); we don't host or alter them.
 */
type ToolLogoProps = {
  name: string;
  url: string;
  /** Tailwind size classes for the square container, e.g. "h-9 w-9". */
  className?: string;
};

function faviconUrl(url: string): string | null {
  try {
    const { hostname } = new URL(url);
    // Google's favicon service: reliable, returns a 64px icon for any domain.
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
  } catch {
    return null;
  }
}

export function ToolLogo({ name, url, className = "h-9 w-9" }: ToolLogoProps) {
  const src = faviconUrl(url);
  const [failed, setFailed] = useState(false);

  const base = `flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-canvas-base ${className}`;

  if (!src || failed) {
    return (
      <span className={`${base} text-sm font-bold text-canvas-text`}>
        {name.slice(0, 1)}
      </span>
    );
  }

  return (
    <span className={base}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`${name} logo`}
        width={64}
        height={64}
        loading="lazy"
        className="h-full w-full object-contain p-1.5"
        onError={() => setFailed(true)}
      />
    </span>
  );
}
