import { recommend, type RecommendResponse } from "@auto/core";

/**
 * Live end-to-end check of the routing + workflow pipeline. Makes real OpenAI
 * calls, so it needs OPENAI_API_KEY.
 *
 *   export OPENAI_API_KEY=sk-...
 *   pnpm e2e                 # run all samples
 *   pnpm e2e workflow        # only samples whose expected mode is "workflow"
 *   pnpm e2e 4               # only the first 4 samples
 *
 * Each sample is labeled with the mode we expect the Intent Router to choose.
 * The script asserts the mode + basic structure and prints a hit-rate so you
 * can spot router misclassifications and judge planner/assembler quality.
 */

type ExpectedMode = "single" | "workflow" | "clarify";

const SAMPLES: Array<{ query: string; expect: ExpectedMode }> = [
  // single-tool: one deliverable, one main verb
  { query: "write a data-backed blog post about remote work", expect: "single" },
  { query: "refactor a large Python monorepo", expect: "single" },
  { query: "find recent papers on CRISPR with citations", expect: "single" },
  { query: "generate a logo for my coffee brand", expect: "single" },
  { query: "transcribe and summarize my team meeting", expect: "single" },

  // workflow: implies several different output types / sequential work
  { query: "make a 30-second product promo video", expect: "workflow" },
  { query: "create a narrated explainer video from a blog post", expect: "workflow" },
  { query: "launch a landing page with copy, images, and a signup form", expect: "workflow" },
  { query: "turn my research notes into a narrated slide presentation", expect: "workflow" },
  { query: "produce a podcast episode from an outline, then make promo clips", expect: "workflow" },

  // clarify: too vague to route
  { query: "help", expect: "clarify" },
  { query: "make something cool", expect: "clarify" },
];

function actualMode(r: RecommendResponse): ExpectedMode | "unknown" {
  if (r.needsClarification) return "clarify";
  if (r.workflow) return "workflow";
  if (r.primary) return "single";
  return "unknown";
}

function structureOk(r: RecommendResponse, mode: ExpectedMode | "unknown"): string | null {
  if (mode === "workflow") {
    const n = r.workflow?.steps.length ?? 0;
    if (n < 2 || n > 6) return `workflow has ${n} steps (expected 2-6)`;
    const blank = r.workflow?.steps.find((s) => !s.tool.toolId);
    if (blank) return `step ${blank.order} has no tool`;
  }
  if (mode === "single" && !r.primary?.toolId) return "single result has no primary tool";
  return null;
}

function describe(r: RecommendResponse): string {
  if (r.workflow) {
    const chain = r.workflow.steps
      .map((s) => `${s.order}.${s.title}→${s.tool.toolId}`)
      .join("  ");
    return `${r.workflow.steps.length} steps · ${chain}`;
  }
  if (r.primary) return `${r.primary.toolId} (${r.primary.confidence})`;
  if (r.needsClarification) return r.needsClarification.questions[0] ?? "clarify";
  return "no result";
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is required for the live e2e. Set it and retry.");
    process.exit(1);
  }

  const filter = process.argv[2];
  let samples = SAMPLES;
  if (filter && /^\d+$/.test(filter)) {
    samples = SAMPLES.slice(0, Number(filter));
  } else if (filter) {
    samples = SAMPLES.filter((s) => s.expect === filter);
  }

  let modeHits = 0;
  let structFails = 0;

  for (const sample of samples) {
    let mode: ExpectedMode | "unknown" = "unknown";
    let detail = "";
    try {
      const result = await recommend(sample.query, { limit: 2 });
      mode = actualMode(result);
      detail = describe(result);
      const structErr = structureOk(result, mode);
      if (structErr) {
        structFails++;
        detail += `  [STRUCT: ${structErr}]`;
      }
    } catch (err) {
      detail = `ERROR: ${err instanceof Error ? err.message : String(err)}`;
    }

    const modeOk = mode === sample.expect;
    if (modeOk) modeHits++;
    const tag = modeOk ? "✓" : `✗ got ${mode}`;
    console.log(`\n[${tag}] expect ${sample.expect.padEnd(8)} "${sample.query}"`);
    console.log(`    ${detail}`);
  }

  const total = samples.length;
  console.log(
    `\n──────\nRouter accuracy: ${modeHits}/${total} (${Math.round((modeHits / total) * 100)}%)` +
      `   Structure failures: ${structFails}`,
  );
  if (modeHits < total) {
    console.log("Misclassifications above are worth a prompt tweak in intent.ts.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
