import type { ToolCategory } from "@auto/catalog";
import Link from "next/link";
import { BrowseSearch } from "@/components/BrowseSearch";
import { getCatalogTools } from "@/lib/catalog";

const CATEGORIES: ToolCategory[] = [
  "search",
  "coding",
  "app-builder",
  "writing",
  "image",
  "video",
  "automation",
  "local",
  "general",
];

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

type PageProps = {
  searchParams: Promise<{ category?: string }>;
};

export default async function BrowsePage({ searchParams }: PageProps) {
  const { category: rawCategory } = await searchParams;
  const category =
    rawCategory && CATEGORIES.includes(rawCategory as ToolCategory)
      ? (rawCategory as ToolCategory)
      : undefined;

  const tools = await getCatalogTools();
  const filtered = category
    ? tools.filter((t) => t.category === category)
    : tools;

  return (
    <div className="flex-1 overflow-y-auto px-6 py-12 sm:px-10 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-canvas-subtle">
          Open-source catalog
        </p>
        <h1 className="mt-3 font-serif text-5xl font-normal text-canvas-text">Tools</h1>
        <p className="mt-2 text-canvas-muted">
          Curated AI products, one per job.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          <Link
            href="/browse"
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              !category
                ? "border-canvas-text bg-canvas-text text-white"
                : "border-canvas-border text-canvas-muted hover:border-canvas-text hover:text-canvas-text"
            }`}
          >
            All
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              href={`/browse?category=${c}`}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                category === c
                  ? "border-canvas-text bg-canvas-text text-white"
                  : "border-canvas-border text-canvas-muted hover:border-canvas-text hover:text-canvas-text"
              }`}
            >
              {categoryLabels[c]}
            </Link>
          ))}
        </div>

        <BrowseSearch tools={filtered} />
      </div>
    </div>
  );
}
