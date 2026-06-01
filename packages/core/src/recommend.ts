import { join } from "node:path";
import { getToolById, loadToolsFromDir } from "@auto/catalog";
import OpenAI from "openai";
import {
  embedText,
  loadEmbeddingsFile,
  retrieveTopK,
} from "./embeddings.js";
import { MOCK_EMBEDDING_MODEL } from "./mock-embed.js";
import { findRepoRoot } from "./paths.js";
import {
  buildClarification,
  isQueryVague,
} from "./clarify.js";
import { rankWithLlm, validateAgainstShortlist } from "./ranker.js";
import type { RecommendOptions, RecommendResponse } from "./types.js";

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

  const useMockEmbeddings = embeddingModel === MOCK_EMBEDDING_MODEL;
  const apiKey = options.openaiApiKey ?? process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OpenAI API key required for the ranker. Set OPENAI_API_KEY or pass openaiApiKey.",
    );
  }
  if (!useMockEmbeddings && !apiKey) {
    throw new Error(
      "OpenAI API key required for embeddings. Set OPENAI_API_KEY, pass openaiApiKey, or use mock embeddings.",
    );
  }

  const shortlistSize = options.shortlistSize ?? DEFAULT_SHORTLIST_SIZE;
  const client = new OpenAI({ apiKey });
  const tools = await loadToolsFromDir(toolsDir);

  const queryEmbedding = await embedText(
    useMockEmbeddings ? null : client,
    trimmed,
    embeddingModel,
  );
  if (isQueryVague(trimmed)) {
    return {
      query: trimmed,
      needsClarification: buildClarification(trimmed),
    };
  }

  const topMatches = retrieveTopK(queryEmbedding, embeddings, shortlistSize);

  const shortlist = topMatches
    .map((m) => getToolById(tools, m.toolId))
    .filter((t): t is NonNullable<typeof t> => t !== undefined);

  if (shortlist.length === 0) {
    throw new Error("No tools matched in catalog");
  }

  const shortlistIds = new Set(shortlist.map((t) => t.id));
  const ranked = validateAgainstShortlist(
    await rankWithLlm(client, trimmed, shortlist, rankerModel),
    shortlistIds,
  );

  const altLimit = Math.min(options.limit ?? 2, 3);
  const alternatives = ranked.alternatives.slice(0, altLimit);

  return {
    query: trimmed,
    task: ranked.task,
    primary: ranked.primary,
    alternatives,
    workflowTip: ranked.workflowTip,
    avoid: ranked.avoid,
    actionGuide: ranked.actionGuide,
    routeCards: ranked.routeCards,
  };
}
