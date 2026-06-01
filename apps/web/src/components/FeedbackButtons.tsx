"use client";

import { useState } from "react";

type FeedbackRating = "good_match" | "not_right" | "too_advanced";

type FeedbackButtonsProps = {
  query: string;
  primaryToolId?: string;
  alternativeToolIds?: string[];
  routeLabels?: string[];
  elapsedMs?: number;
};

const options: Array<{ rating: FeedbackRating; label: string }> = [
  { rating: "good_match", label: "Good match" },
  { rating: "not_right", label: "Not right" },
  { rating: "too_advanced", label: "Too advanced" },
];

export function FeedbackButtons({
  query,
  primaryToolId,
  alternativeToolIds,
  routeLabels,
  elapsedMs,
}: FeedbackButtonsProps) {
  const [selected, setSelected] = useState<FeedbackRating>();
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );

  async function submit(rating: FeedbackRating) {
    setSelected(rating);
    setStatus("saving");

    try {
      const response = await fetch("/api/v1/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          rating,
          primaryToolId,
          alternativeToolIds,
          routeLabels,
          elapsedMs: Math.round(elapsedMs ?? 0),
        }),
      });

      if (!response.ok) {
        throw new Error("Could not save feedback");
      }

      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="result-enter rounded-2xl bg-canvas-white p-4 shadow-soft ring-1 ring-canvas-border/60">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-canvas-text">Was this useful?</p>
        <div className="flex flex-wrap gap-2">
          {options.map((option) => (
            <button
              key={option.rating}
              type="button"
              onClick={() => submit(option.rating)}
              disabled={status === "saving"}
              className={`rounded-full px-3.5 py-2 text-xs font-semibold transition-all ${
                selected === option.rating
                  ? "bg-canvas-text text-white"
                  : "bg-canvas-base text-canvas-muted hover:bg-canvas-brandLight hover:text-canvas-brand"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      {status === "saved" && (
        <p className="mt-3 text-xs font-medium text-emerald-700">
          Saved. This helps Auto learn.
        </p>
      )}
      {status === "error" && (
        <p className="mt-3 text-xs font-medium text-red-700">
          Feedback was not saved.
        </p>
      )}
    </div>
  );
}
