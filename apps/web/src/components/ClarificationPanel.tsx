"use client";

import type { RecommendResponse } from "@auto/core";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { saveRecentSearch } from "./RecentSearches";

type Clarification = NonNullable<RecommendResponse["needsClarification"]>;

export function ClarificationPanel({
  data,
  query,
}: {
  data: Clarification;
  query: string;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<string[]>(() =>
    data.questions.map(() => ""),
  );

  const hasAnswer = useMemo(
    () => answers.some((a) => a.trim().length > 0),
    [answers],
  );

  function setAnswer(index: number, value: string) {
    setAnswers((prev) => prev.map((a, i) => (i === index ? value : a)));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const details = data.questions
      .map((q, i) => {
        const answer = answers[i]?.trim();
        return answer ? `${q} ${answer}` : "";
      })
      .filter(Boolean)
      .join(" ");
    const refined = details ? `${query.trim()} — ${details}` : query.trim();
    if (!refined) return;
    saveRecentSearch(refined);
    router.push(`/results?q=${encodeURIComponent(refined)}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-canvas-brand/20 bg-canvas-brandLight px-6 py-5"
    >
      <p className="font-semibold text-canvas-brand">Need a bit more detail</p>
      <p className="mt-1 text-sm text-canvas-text">{data.message}</p>
      <div className="mt-4 space-y-4">
        {data.questions.map((q, index) => (
          <div key={q}>
            <label
              htmlFor={`clarify-${index}`}
              className="block text-sm font-medium text-canvas-text"
            >
              {q}
            </label>
            <input
              id={`clarify-${index}`}
              type="text"
              value={answers[index]}
              onChange={(e) => setAnswer(index, e.target.value)}
              placeholder="Your answer (optional)"
              className="mt-1.5 w-full rounded-xl border border-canvas-border bg-white px-3.5 py-2 text-sm text-canvas-text placeholder:text-canvas-subtle focus:border-canvas-brand focus:outline-none focus:ring-2 focus:ring-canvas-brand/20"
            />
          </div>
        ))}
      </div>
      <button
        type="submit"
        disabled={!hasAnswer}
        className="mt-5 inline-flex rounded-full bg-canvas-brand px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-canvas-brandHover disabled:cursor-not-allowed disabled:opacity-50"
      >
        Refine &amp; search again
      </button>
    </form>
  );
}
