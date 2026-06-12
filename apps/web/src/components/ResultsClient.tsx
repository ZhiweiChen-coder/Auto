"use client";

import type { Tool } from "@auto/catalog";
import type { ProgressStage, RecommendResponse } from "@auto/core";
import { useEffect, useMemo, useState } from "react";
import { ClarificationPanel } from "@/components/ClarificationPanel";
import { CopyShareLink } from "@/components/CopyShareLink";
import { FeedbackButtons } from "@/components/FeedbackButtons";
import { PromptCopyButton } from "@/components/PromptCopyButton";
import { SearchForm } from "@/components/SearchForm";
import { WorkflowChain } from "@/components/WorkflowChain";
import { ByokKeyPanel } from "@/components/ByokKeyPanel";
import { CreditsBadge } from "@/components/CreditsBadge";
import { readStoredApiKey } from "@/lib/useApiKey";

type ResultsClientProps = {
  initialQuery: string;
  tools: Tool[];
};

type RequestPhase = "loading" | "ready" | "error";

function getToolById(tools: Tool[], id: string) {
  return tools.find((tool) => tool.id === id);
}

function routeTone(_label: string) {
  // Editorial: one restrained neutral treatment; the label names the route.
  return {
    ring: "border-canvas-border",
    badge: "border border-canvas-border text-canvas-muted",
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

// Real pipeline stages, in order. Drives the live status nodes 1:1 — the value
// comes from the backend as it actually reaches each stage, not a timer.
const STAGE_ORDER: ProgressStage[] = [
  "understand",
  "search",
  "compare",
  "recommend",
];

// Where the progress bar sits while each real stage is in flight. We anchor to
// the stage rather than elapsed time so the bar reflects genuine work done.
const STAGE_PROGRESS: Record<ProgressStage, number> = {
  understand: 26,
  search: 52,
  compare: 76,
  recommend: 92,
};

type NodeState = "done" | "active" | "pending" | "error";

function LiveChain({
  phase,
  query,
  toolsCount,
  result,
  selectedName,
  stage,
  elapsedMs,
}: {
  phase: RequestPhase;
  query: string;
  toolsCount: number;
  result?: RecommendResponse;
  selectedName?: string;
  stage?: ProgressStage;
  elapsedMs: number;
}) {
  const routeCount = result?.routeCards?.length ?? 0;
  const isSlow = phase === "loading" && elapsedMs > 8000;

  // Index of the stage currently running (or completed past) per the backend.
  const currentIndex =
    phase === "ready"
      ? STAGE_ORDER.length
      : STAGE_ORDER.indexOf(stage ?? "understand");

  const progressWidth =
    phase === "ready" ? "100%" : `${STAGE_PROGRESS[stage ?? "understand"]}%`;

  const nodeState = (nodeIndex: number): NodeState => {
    if (phase === "error") return "error";
    if (phase === "ready" || nodeIndex < currentIndex) return "done";
    if (nodeIndex === currentIndex) return "active";
    return "pending";
  };

  const items = [
    {
      id: "task",
      label: "Understand",
      detail: nodeState(0) === "done" ? "Task understood" : query,
      state: nodeState(0),
    },
    {
      id: "catalog",
      label: "Search",
      detail: `${toolsCount} tools`,
      state: nodeState(1),
    },
    {
      id: "compare",
      label: "Compare",
      detail: selectedName ? `Picked ${selectedName}` : "Checking fit",
      state: nodeState(2),
    },
    {
      id: "route",
      label: "Recommend",
      detail: routeCount > 0 ? `${routeCount} paths` : "Writing",
      state: nodeState(3),
    },
  ];

  return (
    <section
      className={`result-chain rounded-3xl border border-canvas-border bg-canvas-white shadow-soft ${
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
          className="progress-fill block h-full rounded-full transition-all duration-300"
          style={{ width: progressWidth }}
        />
      </div>
      {isSlow && (
        <p className="mt-3 text-sm text-canvas-muted">
          Still comparing the strongest options. This can take a little longer
          when several tools are close matches.
        </p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
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
  const [stage, setStage] = useState<ProgressStage>();
  const [result, setResult] = useState<RecommendResponse>();
  const [error, setError] = useState<string>();
  const [elapsedMs, setElapsedMs] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [forcedWorkflowQuery, setForcedWorkflowQuery] = useState<string | null>(
    null,
  );
  const forceWorkflow = forcedWorkflowQuery === initialQuery;

  useEffect(() => {
    const controller = new AbortController();
    const startedAt = performance.now();
    setPhase("loading");
    setStage(undefined);
    setResult(undefined);
    setError(undefined);
    setElapsedMs(0);

    const timer = window.setInterval(() => {
      setElapsedMs(performance.now() - startedAt);
    }, 120);

    async function run() {
      try {
        // Send the user's own key (BYOK) when present, as a Bearer token.
        const storedKey = readStoredApiKey();
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        };
        if (storedKey) headers.Authorization = `Bearer ${storedKey}`;

        // Ask for the streaming variant so we get real per-stage progress.
        const response = await fetch("/api/v1/recommend?stream=1", {
          method: "POST",
          headers,
          body: JSON.stringify({
            query: initialQuery,
            limit: 2,
            mode: forceWorkflow ? "workflow" : "auto",
          }),
          signal: controller.signal,
        });

        // A non-OK response (e.g. rate limit, bad body) is plain JSON, not SSE.
        if (!response.ok || !response.body) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error ?? "Recommendation failed");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let settled = false;

        while (!settled) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // SSE frames are separated by a blank line; keep the trailing partial.
          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";

          for (const frame of frames) {
            let event = "message";
            let data = "";
            for (const line of frame.split("\n")) {
              if (line.startsWith("event:")) event = line.slice(6).trim();
              else if (line.startsWith("data:")) data += line.slice(5).trim();
            }
            if (!data) continue;
            const payload = JSON.parse(data);

            if (event === "progress") {
              setStage(payload.stage as ProgressStage);
            } else if (event === "result") {
              setResult(payload as RecommendResponse);
              setPhase("ready");
              settled = true;
            } else if (event === "error") {
              throw new Error(payload.error ?? "Recommendation failed");
            }
          }
        }

        if (!settled) {
          throw new Error("Recommendation ended unexpectedly");
        }
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
  }, [initialQuery, reloadKey, forceWorkflow]);

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
      <div className="mb-4 flex items-center justify-end gap-3">
        <CreditsBadge />
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
          stage={stage}
          elapsedMs={elapsedMs}
        />

        {phase === "loading" && (
          <div className="route-shimmer rounded-3xl border border-canvas-border bg-canvas-white p-6">
            <div className="h-4 w-24 rounded-full bg-canvas-base" />
            <div className="mt-5 h-8 w-52 rounded-full bg-canvas-base" />
            <div className="mt-4 h-3 w-full max-w-lg rounded-full bg-canvas-base" />
            <div className="mt-3 h-3 w-2/3 rounded-full bg-canvas-base" />
          </div>
        )}

        {phase === "error" && (
          <div className="result-enter rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="press mt-3 inline-flex rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Try again
            </button>
            {error?.toLowerCase().includes("api key") && <ByokKeyPanel />}
          </div>
        )}

        {result?.needsClarification && (
          <div className="result-enter">
            <ClarificationPanel
              data={result.needsClarification}
              query={initialQuery}
            />
          </div>
        )}

        {phase === "ready" && result?.workflow && (
          <>
            <WorkflowChain workflow={result.workflow} tools={tools} />
            <FeedbackButtons
              query={initialQuery}
              primaryToolId={result.workflow.steps[0]?.tool.toolId}
              alternativeToolIds={result.workflow.steps
                .slice(1)
                .map((step) => step.tool.toolId)}
              elapsedMs={elapsedMs}
            />
          </>
        )}

        {phase === "ready" &&
          result &&
          !result.needsClarification &&
          !result.workflow &&
          !primary && (
          <div className="result-enter rounded-2xl border border-canvas-border bg-canvas-white px-6 py-5 text-sm text-canvas-muted">
            <p className="font-semibold text-canvas-text">
              No clear match for that task yet.
            </p>
            <p className="mt-1">
              Try rephrasing with the outcome you want, or{" "}
              <a href="/browse" className="font-semibold text-canvas-brand hover:underline">
                browse the full catalog
              </a>
              .
            </p>
          </div>
        )}

        {phase === "ready" && result && primary && (
          <div className="result-enter space-y-6">
            <section className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
              <article className="overflow-hidden rounded-3xl bg-canvas-text text-white shadow-soft">
                <div className="p-6 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">
                        Best pick
                      </p>
                      <h1 className="mt-3 font-serif text-4xl font-normal leading-[1.05] sm:text-5xl">
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
                    className="lift press mt-7 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-canvas-text hover:bg-canvas-base"
                  >
                    Open {primary.name}
                  </a>
                </div>
                <div className="border-t border-white/10 bg-white/[0.04] px-6 py-4 text-sm text-white/70 sm:px-7">
                  Best for {primary.bestFor[0]}.
                </div>
              </article>

              {result.actionGuide && (
                <article className="rounded-3xl border border-canvas-border bg-canvas-white p-6">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-canvas-muted">
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
                  <details className="mt-5 rounded-2xl bg-canvas-base p-4">
                    <summary className="cursor-pointer text-xs font-semibold text-canvas-muted">
                      Show ready-to-paste prompt
                    </summary>
                    <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap text-sm leading-relaxed text-canvas-text">{result.actionGuide.copyPrompt}</pre>
                  </details>
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

            <div className="rounded-2xl border border-dashed border-canvas-border bg-canvas-white/60 px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-canvas-muted">
                  This task may take more than one tool. See a step-by-step
                  workflow instead?
                </p>
                <button
                  type="button"
                  onClick={() => setForcedWorkflowQuery(initialQuery)}
                  className="lift press inline-flex shrink-0 rounded-full bg-canvas-text px-4 py-2 text-sm font-semibold text-white hover:bg-canvas-text/90"
                >
                  See full workflow
                </button>
              </div>
            </div>

            {result.routeCards && result.routeCards.length > 0 && (
              <section>
                <h2 className="mb-3 text-lg font-semibold text-canvas-text">Other paths</h2>
                <div className="grid gap-3 md:grid-cols-3">
                  {result.routeCards.map((route) => {
                    const routeTools = route.toolIds
                      .map((id) => getToolById(tools, id))
                      .filter((tool): tool is Tool => Boolean(tool));
                    const tone = routeTone(route.label);

                    return (
                      <article
                        key={route.label}
                        className={`rounded-2xl border bg-canvas-white p-4 transition-colors hover:border-canvas-text/20 ${tone.ring}`}
                      >
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tone.badge}`}
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
                                className="press rounded-full border border-canvas-border px-3 py-1 text-xs font-semibold text-canvas-text transition-colors hover:border-canvas-text"
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
                <h2 className="mb-3 text-lg font-semibold text-canvas-text">
                  Alternatives
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {alternatives.map(({ rec, tool }) => (
                    <article
                      key={tool.id}
                      className="rounded-2xl border border-canvas-border bg-canvas-white p-4 transition-colors hover:border-canvas-text/20"
                    >
                      <h3 className="text-lg font-semibold text-canvas-text">
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
