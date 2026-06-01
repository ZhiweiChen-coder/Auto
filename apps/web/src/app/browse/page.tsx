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
    <div className="flex-1 overflow-y-auto px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-canvas-text">Tools</h1>
        <p className="mt-1 text-canvas-muted">Curated AI products · open source catalog</p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/browse"
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              !category
                ? "bg-canvas-brand text-white"
                : "bg-canvas-white text-canvas-muted shadow-soft hover:text-canvas-text"
            }`}
          >
            All
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              href={`/browse?category=${c}`}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                category === c
                  ? "bg-canvas-brand text-white"
                  : "bg-canvas-white text-canvas-muted shadow-soft hover:text-canvas-text"
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
