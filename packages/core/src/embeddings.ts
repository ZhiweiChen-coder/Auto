import { readFile } from "node:fs/promises";
import OpenAI from "openai";
import { MOCK_EMBEDDING_MODEL, mockEmbed } from "./mock-embed.js";
import type { EmbeddingsFile } from "./types.js";

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length");
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export async function loadEmbeddingsFile(path: string): Promise<EmbeddingsFile> {
  const raw = await readFile(path, "utf-8");
  return JSON.parse(raw) as EmbeddingsFile;
}

export async function embedText(
  client: OpenAI | null,
  text: string,
  model: string,
): Promise<number[]> {
  if (model === MOCK_EMBEDDING_MODEL) {
    return mockEmbed(text);
  }
  if (!client) {
    throw new Error("OpenAI client required for non-mock embeddings");
  }
  const response = await client.embeddings.create({
    model,
    input: text,
  });
  const vector = response.data[0]?.embedding;
  if (!vector) {
    throw new Error("No embedding returned from OpenAI");
  }
  return vector;
}

export function toolToEmbeddingText(tool: {
  name: string;
  description: string;
  category: string;
  deployment: string;
  bestFor: string[];
  notFor?: string[];
  tags: string[];
}): string {
  const parts = [
    tool.name,
    tool.description,
    `Category: ${tool.category}`,
    `Deployment: ${tool.deployment}`,
    `Best for: ${tool.bestFor.join(", ")}`,
    tool.notFor?.length ? `Not for: ${tool.notFor.join(", ")}` : "",
    `Tags: ${tool.tags.join(", ")}`,
  ];
  return parts.filter(Boolean).join("\n");
}

export function retrieveTopK(
  queryEmbedding: number[],
  embeddings: EmbeddingsFile,
  k: number,
): Array<{ toolId: string; score: number }> {
  return retrieveTopKFiltered(queryEmbedding, embeddings, k);
}

/**
 * Like {@link retrieveTopK} but restricts scoring to `allowedToolIds` when
 * provided. Used by workflow per-step retrieval to keep each step within the
 * tools that produce the right output type.
 */
export function retrieveTopKFiltered(
  queryEmbedding: number[],
  embeddings: EmbeddingsFile,
  k: number,
  allowedToolIds?: Set<string>,
): Array<{ toolId: string; score: number }> {
  const pool = allowedToolIds
    ? embeddings.tools.filter((t) => allowedToolIds.has(t.toolId))
    : embeddings.tools;
  const scored = pool.map((t) => ({
    toolId: t.toolId,
    score: cosineSimilarity(queryEmbedding, t.embedding),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}
