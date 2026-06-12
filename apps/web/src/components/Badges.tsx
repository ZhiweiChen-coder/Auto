import type { Deployment, Pricing, ToolCategory } from "@auto/catalog";

const categoryLabels: Record<ToolCategory, string> = {
  search: "Search",
  coding: "Coding",
  "app-builder": "App builder",
  writing: "Writing",
  image: "Image",
  video: "Video",
  automation: "Automation",
  local: "Local",
  general: "General",
};

// Editorial restraint: a single neutral hairline treatment for every meta tag.
// The label text carries the meaning, not a colour.
const badgeClass =
  "rounded-full border border-canvas-border px-2.5 py-0.5 text-[11px] font-medium text-canvas-muted";

export function CategoryBadge({ category }: { category: ToolCategory }) {
  return (
    <span className={`${badgeClass} uppercase tracking-wide text-canvas-text`}>
      {categoryLabels[category]}
    </span>
  );
}

export function DeploymentBadge({ deployment }: { deployment: Deployment }) {
  const labels: Record<Deployment, string> = {
    saas: "SaaS",
    local: "Local",
    api: "API",
    hybrid: "Hybrid",
  };
  return <span className={badgeClass}>{labels[deployment]}</span>;
}

export function PricingBadge({ pricing }: { pricing: Pricing }) {
  return <span className={`${badgeClass} capitalize`}>{pricing}</span>;
}
