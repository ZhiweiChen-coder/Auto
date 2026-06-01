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

const categoryColors: Record<ToolCategory, string> = {
  search: "bg-[#E8F4FD] text-[#0B6E99]",
  coding: "bg-[#EDE9FE] text-[#6D28D9]",
  "app-builder": "bg-canvas-brandLight text-canvas-brand",
  writing: "bg-[#FFF4E6] text-[#C2410C]",
  image: "bg-[#FCE7F3] text-[#BE185D]",
  video: "bg-[#FEE2E2] text-[#B91C1C]",
  automation: "bg-[#D1FAE5] text-[#047857]",
  local: "bg-[#F3F4F6] text-[#374151]",
  general: "bg-[#F3F4F6] text-[#4B5563]",
};

export function CategoryBadge({ category }: { category: ToolCategory }) {
  return (
    <span
      className={`rounded-md px-2 py-0.5 text-xs font-medium ${categoryColors[category]}`}
    >
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
  return (
    <span className="rounded-md bg-canvas-base px-2 py-0.5 text-xs font-medium text-canvas-muted">
      {labels[deployment]}
    </span>
  );
}

export function PricingBadge({ pricing }: { pricing: Pricing }) {
  return (
    <span className="rounded-md bg-canvas-base px-2 py-0.5 text-xs font-medium capitalize text-canvas-muted">
      {pricing}
    </span>
  );
}
