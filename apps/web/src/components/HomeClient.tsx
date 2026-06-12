"use client";

import { useRouter } from "next/navigation";
import { ByokKeyPanel } from "./ByokKeyPanel";
import { CreditsBadge } from "./CreditsBadge";
import { RecentSearches } from "./RecentSearches";
import { SearchForm } from "./SearchForm";
import { TaskExamples } from "./TaskExamples";

export function HomeClient() {
  const router = useRouter();
  const openResults = (q: string) =>
    router.push(`/results?q=${encodeURIComponent(q)}`);

  return (
    <>
      <div className="mb-3 flex justify-end">
        <CreditsBadge />
      </div>
      <SearchForm variant="hero" autoFocus />
      <TaskExamples onPick={openResults} />
      <ByokKeyPanel />
      <RecentSearches onPick={openResults} />
    </>
  );
}
