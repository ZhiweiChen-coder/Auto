import type { RecommendResponse } from "@auto/core";

type Clarification = NonNullable<RecommendResponse["needsClarification"]>;

export function ClarificationPanel({ data }: { data: Clarification }) {
  return (
    <div className="rounded-2xl border border-canvas-brand/20 bg-canvas-brandLight px-6 py-5">
      <p className="font-semibold text-canvas-brand">Need a bit more detail</p>
      <p className="mt-1 text-sm text-canvas-text">{data.message}</p>
      <ul className="mt-4 space-y-2">
        {data.questions.map((q) => (
          <li key={q} className="flex gap-2 text-sm text-canvas-muted">
            <span className="text-canvas-brand">•</span>
            {q}
          </li>
        ))}
      </ul>
    </div>
  );
}
