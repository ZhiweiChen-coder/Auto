import Link from "next/link";
import { ResultsClient } from "@/components/ResultsClient";
import { getCatalogTools } from "@/lib/catalog";

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function ResultsPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  if (!query) {
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="text-center">
          <p className="text-canvas-muted">Enter a task to get recommendations.</p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm font-medium text-canvas-brand hover:underline"
          >
            Back home
          </Link>
        </div>
      </div>
    );
  }

  const tools = await getCatalogTools();

  return <ResultsClient initialQuery={query} tools={tools} />;
}
