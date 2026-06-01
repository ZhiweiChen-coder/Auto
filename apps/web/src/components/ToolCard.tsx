import type { Tool } from "@auto/catalog";
import {
  CategoryBadge,
  DeploymentBadge,
  PricingBadge,
} from "./Badges";

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
      className={`rounded-2xl bg-canvas-white p-6 shadow-soft ring-1 ring-canvas-border/60 ${
        isPrimary ? "ring-2 ring-canvas-brand/25 shadow-card" : ""
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
      <h3 className="text-xl font-bold text-canvas-text">{tool.name}</h3>
      <p className="mt-1 text-sm text-canvas-muted">{tool.description}</p>
      {reason && (
        <p className="mt-4 text-sm leading-relaxed text-canvas-text">{reason}</p>
      )}
      <a
        href={tool.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex items-center gap-1 rounded-full bg-canvas-text px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-black"
      >
        Open {tool.name}
      </a>
    </article>
  );
}
