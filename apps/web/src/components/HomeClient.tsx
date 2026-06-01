"use client";

import { useRouter } from "next/navigation";
import { RecentSearches } from "./RecentSearches";
import { SearchForm } from "./SearchForm";
import { TaskExamples } from "./TaskExamples";

export function HomeClient() {
  const router = useRouter();
  const openResults = (q: string) =>
    router.push(`/results?q=${encodeURIComponent(q)}`);

  return (
    <>
      <SearchForm variant="hero" autoFocus />
      <TaskExamples onPick={openResults} />
      <RecentSearches onPick={openResults} />
    </>
  );
}
