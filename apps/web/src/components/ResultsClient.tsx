"use client";

import type { Tool } from "@auto/catalog";
import type { RecommendResponse } from "@auto/core";
import { useEffect, useMemo, useState } from "react";
import { ClarificationPanel } from "@/components/ClarificationPanel";
import { CopyShareLink } from "@/components/CopyShareLink";
import { FeedbackButtons } from "@/components/FeedbackButtons";
import { PromptCopyButton } from "@/components/PromptCopyButton";
import { SearchForm } from "@/components/SearchForm";

type ResultsClientProps = {
  initialQuery: string;
  tools: Tool[];
};

type RequestPhase = "loading" | "ready" | "error";

function getToolById(tools: Tool[], id: string) {
  return tools.find((tool) => tool.id === id);
}

function routeTone(label: string) {
  if (label === "Fastest route") {
    return {
      ring: "ring-sky-100",
      badge: "bg-sky-50 text-sky-700",
    };
  }
  if (label === "Cheapest route") {
    return {
      ring: "ring-emerald-100",
      badge: "bg-emerald-50 text-emerald-700",
    };
  }
  return {
    ring: "ring-amber-100",
    badge: "bg-amber-50 text-amber-700",
  };
}

function compactStep(step: string, toolName?: string) {
  const fallbackName = toolName ?? "the tool";
  let compact = step
    .replace(/^step\s*\d+\s*:\s*/i, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (/go to .+website/i.test(compact) || /sign up/i.test(compact)) {
    compact = `Open ${fallbackName}.`;
  } else if (/search feature|find research papers|topic of interest/i.test(compact)) {
    compact = "Search your topic.";
  } else if (compact.length > 72) {
    compact = `${compact.slice(0, 69).trim()}...`;
  }

  return compact;
}

function LiveChain({
  phase,
  query,
  toolsCount,
  result,
  selectedName,
  elapsedMs,
}: {
  phase: RequestPhase;
  query: string;
  toolsCount: number;
  result?: RecommendResponse;
  selectedName?: string;
  elapsedMs: number;
}) {
  const routeCount = result?.routeCards?.length ?? 0;
  const isSlow = phase === "loading" && elapsedMs > 8000;
  const progressWidth = phase === "ready" ? "100%" : `${Math.min(88, 18 + elapsedMs / 260)}%`;
  const items = [
    {
      label: "Task",
      detail: query,
      state: "done",
    },
    {
      label: "Catalog",
      detail: `${toolsCount} tools`,
      state: "done",
    },
    {
      label: "Request",
      detail: phase === "error" ? "Stopped" : "API sent",
      state: phase === "error" ? "error" : "done",
    },
    {
      label: "Rank",
      detail: selectedName ? `Picked ${selectedName}` : "Comparing",
      state: phase === "ready" ? "done" : phase === "error" ? "error" : "active",
    },
    {
      label: "Route",
      detail: routeCount > 0 ? `${routeCount} paths` : "Writing",
      state: phase === "ready" ? "done" : phase === "error" ? "error" : "pending",
    },
  ];

  return (
    <section
      className={`result-chain rounded-[28px] bg-canvas-white shadow-card ring-1 ring-canvas-border/60 ${
        phase === "loading" ? "p-6" : "p-4"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-canvas-muted">
            Recommendation status
          </p>
          <p className="mt-1 text-sm font-semibold text-canvas-text">
            {phase === "ready" ? "Route ready" : phase === "error" ? "Needs attention" : "Finding the best path"}
          </p>
        </div>
        <span className="rounded-full bg-canvas-base px-3 py-1 text-xs font-semibold text-canvas-muted">
          {(elapsedMs / 1000).toFixed(1)}s
        </span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-canvas-base">
        <span
          className="block h-full rounded-full bg-canvas-brand transition-all duration-300"
          style={{ width: progressWidth }}
        />
      </div>
      {isSlow && (
        <p className="mt-3 text-sm text-canvas-muted">
          Still ranking the short list. This can take a little longer when the
          model is comparing close matches.
        </p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {items.map((item, index) => (
          <div
            key={item.label}
            className={`chain-node relative rounded-2xl border px-3 py-3 ${
              item.state === "active"
                ? "border-canvas-brand bg-canvas-brandLight text-canvas-brand"
                : item.state === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : item.state === "done"
                    ? "border-canvas-border bg-white text-canvas-text"
                    : "border-canvas-border bg-canvas-base text-canvas-muted"
            }`}
            style={{ animationDelay: `${index * 90}ms` }}
          >
            <span className="block text-xs font-bold">{item.label}</span>
            <span className="mt-1 block truncate text-xs opacity-75">
              {item.detail}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ResultsClient({ initialQuery, tools }: ResultsClientProps) {
  const [phase, setPhase] = useState<RequestPhase>("loading");
  const [result, setResult] = useState<RecommendResponse>();
  const [error, setError] = useState<string>();
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const startedAt = performance.now();
    setPhase("loading");
    setResult(undefined);
    setError(undefined);
    setElapsedMs(0);

    const timer = window.setInterval(() => {
      setElapsedMs(performance.now() - startedAt);
    }, 120);

    async function run() {
      try {
        const response = await fetch("/api/v1/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: initialQuery, limit: 2 }),
          signal: controller.signal,
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Recommendation failed");
        }

        setResult(data as RecommendResponse);
        setPhase("ready");
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Recommendation failed");
        setPhase("error");
      } finally {
        window.clearInterval(timer);
        setElapsedMs(performance.now() - startedAt);
      }
    }

    run();

    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [initialQuery]);

  const primary = result?.primary
    ? getToolById(tools, result.primary.toolId)
    : undefined;
  const alternatives = useMemo(
    () =>
      (result?.alternatives ?? [])
        .map((a) => ({ rec: a, tool: getToolById(tools, a.toolId) }))
        .filter(
          (x): x is { rec: { toolId: string; reason: string }; tool: Tool } =>
            Boolean(x.tool),
        ),
    [result?.alternatives, tools],
  );
  const firstSteps =
    result?.actionGuide?.firstSteps
      .slice(0, 3)
      .map((step) => compactStep(step, primary?.name)) ?? [];

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-5 py-6 sm:px-8 lg:px-10">
      <div className="mb-4 flex items-center justify-end">
        <CopyShareLink query={initialQuery} />
      </div>
      <SearchForm initialQuery={initialQuery} variant="compact" />

      <div className="mt-6 space-y-6">
        <LiveChain
          phase={phase}
          query={initialQuery}
          toolsCount={tools.length}
          result={result}
          selectedName={primary?.name}
          elapsedMs={elapsedMs}
        />

        {phase === "loading" && (
          <div className="route-shimmer rounded-[28px] bg-canvas-white/70 p-6 shadow-soft ring-1 ring-canvas-border/60">
            <div className="h-4 w-24 rounded-full bg-canvas-base" />
            <div className="mt-5 h-8 w-52 rounded-full bg-canvas-base" />
            <div className="mt-4 h-3 w-full max-w-lg rounded-full bg-canvas-base" />
            <div className="mt-3 h-3 w-2/3 rounded-full bg-canvas-base" />
          </div>
        )}

        {phase === "error" && (
          <div className="result-enter rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {result?.needsClarification && (
          <div className="result-enter">
            <ClarificationPanel data={result.needsClarification} />
            <p className="mt-4 text-center text-sm text-canvas-muted">
              Update your description above and press Recommend again.
            </p>
          </div>
        )}

        {phase === "ready" && result && !result.needsClarification && !primary && (
          <p className="result-enter text-canvas-muted">No recommendation available.</p>
        )}

        {phase === "ready" && result && primary && (
          <div className="result-enter space-y-6">
            <section className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
              <article className="overflow-hidden rounded-[28px] bg-canvas-text text-white shadow-card">
                <div className="p-6 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-white/60">
                        Best pick
                      </p>
                      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                        {primary.name}
                      </h1>
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white/75">
                      {result.primary?.confidence ?? "match"}
                    </span>
                  </div>
                  <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75">
                    {result.primary?.reason}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-white/10 px-3 py-1 capitalize text-white/80">
                      {primary.pricing}
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 capitalize text-white/80">
                      {primary.deployment}
                    </span>
                    {primary.bestForBeginners && (
                      <span className="rounded-full bg-white/10 px-3 py-1 text-white/80">
                        Beginner friendly
                      </span>
                    )}
                  </div>
                  <a
                    href={primary.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-7 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-canvas-text transition-colors hover:bg-canvas-base"
                  >
                    Open {primary.name}
                  </a>
                </div>
                <div className="border-t border-white/10 bg-white/[0.04] px-6 py-4 text-sm text-white/70 sm:px-7">
                  Best for {primary.bestFor[0]}.
                </div>
              </article>

              {result.actionGuide && (
                <article className="rounded-[28px] bg-canvas-white p-6 shadow-card ring-1 ring-canvas-border/60">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-canvas-muted">
                      Do this
                    </p>
                    <PromptCopyButton prompt={result.actionGuide.copyPrompt} />
                  </div>
                  <ol className="mt-5 space-y-3">
                    {firstSteps.map((step, index) => (
                      <li
                        key={`${index}-${step}`}
                        className="flex gap-3 text-sm leading-relaxed"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-canvas-text text-xs font-bold text-white">
                          {index + 1}
                        </span>
                        <span className="text-canvas-text">{step}</span>
                      </li>
                    ))}
                  </ol>
                  <pre className="mt-5 max-h-28 overflow-auto whitespace-pre-wrap rounded-2xl bg-canvas-base p-4 text-sm leading-relaxed text-canvas-text">{result.actionGuide.copyPrompt}</pre>
                </article>
              )}
            </section>

            <FeedbackButtons
              query={initialQuery}
              primaryToolId={result.primary?.toolId}
              alternativeToolIds={result.alternatives?.map((item) => item.toolId)}
              routeLabels={result.routeCards?.map((route) => route.label)}
              elapsedMs={elapsedMs}
            />

            {result.routeCards && result.routeCards.length > 0 && (
              <section>
                <h2 className="mb-3 text-lg font-bold text-canvas-text">Other paths</h2>
                <div className="grid gap-3 md:grid-cols-3">
                  {result.routeCards.map((route) => {
                    const routeTools = route.toolIds
                      .map((id) => getToolById(tools, id))
                      .filter((tool): tool is Tool => Boolean(tool));
                    const tone = routeTone(route.label);

                    return (
                      <article
                        key={route.label}
                        className={`rounded-2xl bg-canvas-white p-4 shadow-soft ring-1 ${tone.ring}`}
                      >
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${tone.badge}`}
                        >
                          {route.label.replace(" route", "")}
                        </span>
                        <p className="mt-3 min-h-[40px] text-sm font-semibold leading-snug text-canvas-text">
                          {route.bestFor}
                        </p>
                        {routeTools.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {routeTools.slice(0, 2).map((tool) => (
                              <a
                                key={tool.id}
                                href={tool.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-full bg-canvas-brandLight px-3 py-1 text-xs font-semibold text-canvas-brand transition-colors hover:bg-canvas-brand hover:text-white"
                              >
                                {tool.name}
                              </a>
                            ))}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {alternatives.length > 0 && (
              <section>
                <h2 className="mb-3 text-lg font-bold text-canvas-text">
                  Alternatives
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {alternatives.map(({ rec, tool }) => (
                    <article
                      key={tool.id}
                      className="rounded-2xl bg-canvas-white p-4 shadow-soft ring-1 ring-canvas-border/60"
                    >
                      <h3 className="text-lg font-bold text-canvas-text">
                        {tool.name}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-canvas-muted">
                        {rec.reason}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
