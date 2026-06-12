import { join } from "node:path";
import { getToolById, loadToolsFromDir, type Tool } from "@auto/catalog";
import OpenAI from "openai";
import {
  embedText,
  loadEmbeddingsFile,
  retrieveTopK,
  retrieveTopKFiltered,
} from "./embeddings.js";
import { MOCK_EMBEDDING_MODEL } from "./mock-embed.js";
import { findRepoRoot } from "./paths.js";
import {
  buildClarification,
  isQueryVague,
} from "./clarify.js";
import { routeIntent } from "./intent.js";
import { planWorkflow } from "./planner.js";
import { rankWithLlm, validateAgainstShortlist } from "./ranker.js";
import { assembleWorkflow, validateWorkflow } from "./workflow.js";
import type {
  EmbeddingsFile,
  IntentRoute,
  ProgressStage,
  RecommendOptions,
  RecommendResponse,
} from "./types.js";

type ProgressFn = (stage: ProgressStage) => void;

const NOOP_PROGRESS: ProgressFn = () => {};

const FORCED_WORKFLOW_ROUTE: IntentRoute = {
  mode: "workflow",
  intent: "general",
  confidence: "high",
  signals: ["forced by caller"],
};

/** Shared state threaded through the per-mode recommendation helpers. */
type RecommendContext = {
  client: OpenAI;
  tools: Tool[];
  embeddings: EmbeddingsFile;
  embeddingModel: string;
  useMockEmbeddings: boolean;
  rankerModel: string;
};

const DEFAULT_SHORTLIST_SIZE = 8;

function resolveRepoPath(relative: string, repoRoot: string): string {
  return join(repoRoot, relative);
}

export async function recommend(
  query: string,
  options: RecommendOptions = {},
): Promise<RecommendResponse> {
  const trimmed = query.trim();
  if (!trimmed) {
    throw new Error("Query cannot be empty");
  }

  const repoRoot = findRepoRoot();
  const toolsDir =
    options.toolsDir ?? resolveRepoPath("data/tools", repoRoot);
  const embeddingsPath =
    options.embeddingsPath ??
    resolveRepoPath("data/embeddings.json", repoRoot);

  const embeddings = await loadEmbeddingsFile(embeddingsPath);
  const embeddingModel =
    options.embeddingModel ??
    process.env.EMBEDDING_MODEL ??
    embeddings.model;
  const rankerModel =
    options.rankerModel ?? process.env.RANKER_MODEL ?? "gpt-4o-mini";
  const intentModel =
    options.intentModel ?? process.env.INTENT_MODEL ?? "gpt-4o-mini";

  if (embeddings.model !== embeddingModel) {
    const storedIsMock = embeddings.model === MOCK_EMBEDDING_MODEL;
    throw new Error(
      `Embedding model mismatch: the catalog was indexed with "${embeddings.model}" but EMBEDDING_MODEL is "${embeddingModel}". ` +
        `Query and tool vectors must come from the same model, otherwise recommendations are effectively random. ` +
        (storedIsMock
          ? `Run \`pnpm index-catalog\` with OPENAI_API_KEY to generate production vectors, or set EMBEDDING_MODEL=${MOCK_EMBEDDING_MODEL} for dev/CI.`
          : `Re-run \`pnpm index-catalog\` so the stored vectors match, or set EMBEDDING_MODEL to "${embeddings.model}".`),
    );
  }

  const useMockEmbeddings = embeddingModel === MOCK_EMBEDDING_MODEL;
  const apiKey = options.openaiApiKey ?? process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OpenAI API key required for the ranker. Set OPENAI_API_KEY or pass openaiApiKey.",
    );
  }

  // Vague queries return a clarification prompt and never reach the ranker, so
  // bail out before spending an embedding API call.
  if (isQueryVague(trimmed)) {
    return {
      query: trimmed,
      needsClarification: buildClarification(trimmed),
    };
  }

  const client = new OpenAI({ apiKey });
  const tools = await loadToolsFromDir(toolsDir);
  const progress = options.onProgress ?? NOOP_PROGRESS;

  // Stage 1: understand the task (intent routing).
  progress("understand");
  const route =
    options.mode === "workflow"
      ? FORCED_WORKFLOW_ROUTE
      : await routeIntent(client, trimmed, intentModel);

  if (route.mode === "clarify") {
    return {
      query: trimmed,
      needsClarification: buildClarification(trimmed),
    };
  }

  const ctx: RecommendContext = {
    client,
    tools,
    embeddings,
    embeddingModel,
    useMockEmbeddings,
    rankerModel,
  };

  if (route.mode === "workflow") {
    try {
      return await recommendWorkflow(trimmed, route, ctx, options, progress);
    } catch (err) {
      // Any failure in planning/assembly degrades to the single-tool path so
      // the user always gets an answer.
      console.warn("[recommend] workflow fallback:", err);
      return recommendSingle(trimmed, ctx, options, progress);
    }
  }

  return recommendSingle(trimmed, ctx, options, progress);
}

const STEP_SHORTLIST_SIZE = 6;

async function recommendWorkflow(
  query: string,
  route: IntentRoute,
  ctx: RecommendContext,
  options: RecommendOptions,
  progress: ProgressFn,
): Promise<RecommendResponse> {
  const plannerModel =
    options.plannerModel ?? process.env.PLANNER_MODEL ?? ctx.rankerModel;

  // Stage 2: plan the steps and search the catalog for each.
  progress("search");
  const plannedSteps = await planWorkflow(ctx.client, query, route, plannerModel);
  if (plannedSteps.length < 2) {
    // Not actually multi-step — let the single-tool path handle it.
    return recommendSingle(query, ctx, options, progress);
  }

  const perStepShortlists = new Map<number, Tool[]>();
  const perStepShortlistIds = new Map<number, Set<string>>();

  await Promise.all(
    plannedSteps.map(async (step) => {
      const allowedToolIds = new Set(
        ctx.tools
          .filter((t) => t.outputTypes.includes(step.outputType))
          .map((t) => t.id),
      );
      const stepEmbedding = await embedText(
        ctx.useMockEmbeddings ? null : ctx.client,
        step.retrievalQuery,
        ctx.embeddingModel,
      );
      // Filter by output type; if nothing matches, fall back to unfiltered so
      // the step still has candidates.
      let matches = retrieveTopKFiltered(
        stepEmbedding,
        ctx.embeddings,
        STEP_SHORTLIST_SIZE,
        allowedToolIds,
      );
      if (matches.length === 0) {
        matches = retrieveTopK(stepEmbedding, ctx.embeddings, STEP_SHORTLIST_SIZE);
      }
      const shortlist = matches
        .map((m) => getToolById(ctx.tools, m.toolId))
        .filter((t): t is NonNullable<typeof t> => t !== undefined);
      perStepShortlists.set(step.order, shortlist);
      perStepShortlistIds.set(step.order, new Set(shortlist.map((t) => t.id)));
    }),
  );

  // Stage 3: compare candidates and assemble the chain.
  progress("compare");
  const workflow = validateWorkflow(
    await assembleWorkflow(
      ctx.client,
      query,
      plannedSteps,
      perStepShortlists,
      ctx.rankerModel,
    ),
    perStepShortlistIds,
  );

  // Stage 4: hand back the finished recommendation.
  progress("recommend");
  return { query, workflow };
}

async function recommendSingle(
  query: string,
  ctx: RecommendContext,
  options: RecommendOptions,
  progress: ProgressFn,
): Promise<RecommendResponse> {
  const shortlistSize = options.shortlistSize ?? DEFAULT_SHORTLIST_SIZE;

  // Stage 2: embed the query and search the catalog.
  progress("search");
  const queryEmbedding = await embedText(
    ctx.useMockEmbeddings ? null : ctx.client,
    query,
    ctx.embeddingModel,
  );

  const topMatches = retrieveTopK(queryEmbedding, ctx.embeddings, shortlistSize);

  const shortlist = topMatches
    .map((m) => getToolById(ctx.tools, m.toolId))
    .filter((t): t is NonNullable<typeof t> => t !== undefined);

  if (shortlist.length === 0) {
    throw new Error("No tools matched in catalog");
  }

  // Stage 3: let the LLM compare the shortlist and pick the best fit.
  progress("compare");
  const shortlistIds = new Set(shortlist.map((t) => t.id));
  const ranked = validateAgainstShortlist(
    await rankWithLlm(ctx.client, query, shortlist, ctx.rankerModel),
    shortlistIds,
  );

  const altLimit = Math.min(options.limit ?? 2, 3);
  const alternatives = ranked.alternatives.slice(0, altLimit);

  // Stage 4: response assembled.
  progress("recommend");
  return {
    query,
    task: ranked.task,
    primary: ranked.primary,
    alternatives,
    workflowTip: ranked.workflowTip,
    avoid: ranked.avoid,
    actionGuide: ranked.actionGuide,
    routeCards: ranked.routeCards,
  };
}
