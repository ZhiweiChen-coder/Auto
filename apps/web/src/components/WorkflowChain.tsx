"use client";

import type { Tool } from "@auto/catalog";
import type { Workflow } from "@auto/core";
import { ToolLogo } from "./ToolLogo";

type WorkflowChainProps = {
  workflow: Workflow;
  tools: Tool[];
};

function getToolById(tools: Tool[], id: string) {
  return tools.find((tool) => tool.id === id);
}

export function WorkflowChain({ workflow, tools }: WorkflowChainProps) {
  return (
    <section className="result-enter space-y-5">
      <div className="rounded-[28px] bg-canvas-text p-6 text-white shadow-card sm:p-7">
        <p className="text-xs font-bold uppercase tracking-wide text-white/60">
          Recommended workflow
        </p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
          {workflow.steps.length} steps · {workflow.toolCount} tools
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75">
          {workflow.summary}
        </p>
        <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-white/10 px-3 py-1 capitalize text-white/80">
            {workflow.difficulty}
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 capitalize text-white/80">
            {workflow.costTier}
          </span>
        </div>
      </div>

      <ol className="space-y-3">
        {workflow.steps.map((step, index) => {
          const tool = getToolById(tools, step.tool.toolId);
          const isLast = index === workflow.steps.length - 1;
          const altTools = (step.alternatives ?? [])
            .map((a) => ({ rec: a, tool: getToolById(tools, a.toolId) }))
            .filter((x): x is { rec: { toolId: string; reason: string }; tool: Tool } =>
              Boolean(x.tool),
            );

          const stepDelay = `${index * 90}ms`;
          const connectorDelay = `${index * 90 + 60}ms`;

          return (
            <li key={step.order} className="relative">
              <article
                className="workflow-step lift rounded-2xl bg-canvas-white p-5 shadow-soft ring-1 ring-canvas-border/60 hover:shadow-card"
                style={{ animationDelay: stepDelay }}
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-canvas-text text-sm font-bold text-white">
                    {step.order}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-canvas-text">
                        {step.title}
                      </h2>
                      <span className="rounded-full bg-canvas-base px-2.5 py-0.5 text-xs font-semibold capitalize text-canvas-muted">
                        {step.outputType}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-canvas-muted">
                      {step.goal}
                    </p>

                    <div
                      className="workflow-tool mt-4 flex flex-col gap-3 rounded-2xl bg-canvas-base p-4 sm:flex-row sm:items-center sm:justify-between"
                      style={{ animationDelay: connectorDelay }}
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        {tool && (
                          <ToolLogo
                            name={tool.name}
                            url={tool.url}
                            className="h-11 w-11"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-canvas-text">
                            {tool?.name ?? step.tool.toolId}
                          </p>
                          <p className="mt-1 text-sm leading-snug text-canvas-muted">
                            {step.tool.reason}
                          </p>
                        </div>
                      </div>
                      {tool && (
                        <a
                          href={tool.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="lift press inline-flex shrink-0 rounded-full bg-canvas-brand px-4 py-2 text-xs font-semibold text-white hover:bg-canvas-brandHover"
                        >
                          Open {tool.name}
                        </a>
                      )}
                    </div>

                    {altTools.length > 0 && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-xs font-semibold text-canvas-muted">
                          {altTools.length === 1
                            ? "1 alternative"
                            : `${altTools.length} alternatives`}
                        </summary>
                        <ul className="mt-2 space-y-1.5">
                          {altTools.map(({ rec, tool: alt }) => (
                            <li key={alt.id} className="text-sm text-canvas-muted">
                              <a
                                href={alt.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-canvas-brand hover:underline"
                              >
                                {alt.name}
                              </a>{" "}
                              — {rec.reason}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                </div>
              </article>

              {!isLast && (
                <div className="flex items-stretch gap-3 py-1 pl-5">
                  <div className="flex w-8 justify-center" aria-hidden>
                    <span
                      className="workflow-connector block w-0.5 rounded-full bg-gradient-to-b from-canvas-brand/45 to-canvas-brand/10"
                      style={{ animationDelay: connectorDelay }}
                    />
                  </div>
                  {step.handoff && (
                    <span className="flex items-center py-1.5 text-xs font-medium leading-snug text-canvas-muted">
                      {step.handoff}
                    </span>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
