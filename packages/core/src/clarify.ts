import type { z } from "zod";
import type { NeedsClarificationSchema } from "./types.js";

export type NeedsClarification = z.infer<typeof NeedsClarificationSchema>;

const VAGUE_PATTERNS = [
  /^(help|hi|hello|hey)\.?$/i,
  /^make something$/i,
  /^ai\s*tool$/i,
  /^what should i use\??$/i,
];

export function isQueryTooShort(query: string): boolean {
  return query.trim().length < 12;
}

export function isQueryVague(query: string): boolean {
  const q = query.trim();
  if (isQueryTooShort(q)) return true;
  return VAGUE_PATTERNS.some((p) => p.test(q));
}

/** Low spread among top embedding scores suggests ambiguous intent. */
export function isEmbeddingMatchAmbiguous(
  topScores: Array<{ score: number }>,
): boolean {
  if (topScores.length < 3) return false;
  const top = topScores[0]?.score ?? 0;
  const third = topScores[2]?.score ?? 0;
  const spread = top - third;
  return top < 0.42 && spread < 0.04;
}

export function buildClarification(query: string): NeedsClarification {
  return {
    message:
      "Your request is a bit broad. A few details will help Auto pick the right tool.",
    questions: [
      "Are you trying to research, build software, create media, or automate a workflow?",
      "Do you need a ready-to-use web app (SaaS) or a local/private setup?",
      `What is the main deliverable for: "${query.slice(0, 80)}${query.length > 80 ? "…" : ""}"?`,
    ],
  };
}
