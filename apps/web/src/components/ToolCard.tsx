import type { Tool } from "@auto/catalog";
import {
  CategoryBadge,
  DeploymentBadge,
  PricingBadge,
} from "./Badges";
import { ToolLogo } from "./ToolLogo";

type ToolCardProps = {
  tool: Tool;
  reason?: string;
  confidence?: "high" | "medium";
  variant?: "primary" | "alt";
};

export function ToolCard({
  tool,
  reason,
  confidence,
  variant = "alt",
}: ToolCardProps) {
  const isPrimary = variant === "primary";

  return (
    <article
      className={`rounded-2xl border bg-canvas-white p-6 transition-colors ${
        isPrimary
          ? "border-canvas-brand/40 shadow-soft"
          : "border-canvas-border hover:border-canvas-text/20"
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {isPrimary && (
          <span className="rounded-full bg-canvas-brand px-3 py-0.5 text-xs font-semibold text-white">
            Best match
          </span>
        )}
        {confidence && (
          <span className="text-xs capitalize text-canvas-subtle">
            {confidence} match
          </span>
        )}
        <CategoryBadge category={tool.category} />
        <DeploymentBadge deployment={tool.deployment} />
        <PricingBadge pricing={tool.pricing} />
      </div>
      <div className="flex items-center gap-3">
        <ToolLogo name={tool.name} url={tool.url} className="h-14 w-14" />
        <h3 className="text-xl font-semibold text-canvas-text">{tool.name}</h3>
      </div>
      <p className="mt-1 text-sm text-canvas-muted">{tool.description}</p>
      {reason && (
        <p className="mt-4 text-sm leading-relaxed text-canvas-text">{reason}</p>
      )}
      <a
        href={tool.url}
        target="_blank"
        rel="noopener noreferrer"
        className="lift press mt-5 inline-flex items-center gap-1 rounded-full bg-canvas-text px-5 py-2 text-sm font-semibold text-white hover:bg-black"
      >
        Open {tool.name}
      </a>
    </article>
  );
}
