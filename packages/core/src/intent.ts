import OpenAI from "openai";
import { IntentRouteSchema, type IntentRoute } from "./types.js";

const SYSTEM_PROMPT = `You are the intent router for Auto, an AI tool recommender.
Classify the user's request into one of three modes. Judge by the TASK's
decomposability, NOT by sentence length — a short request can be a multi-step
workflow and a long one can be a single tool.

Modes:
- "workflow": the task needs multiple tools in sequence. Signals: it implies
  several different output types (e.g. script + visuals + voiceover), or uses
  sequential language ("first... then...", "after that"). Example: "make a 30s
  product promo video" → script, video, voiceover, edit.
- "single": one tool can deliver the whole result. Signals: a single deliverable
  and one main verb. Example: "write a data-backed blog post" → one writer.
- "clarify": too vague to route at all. Example: "help", "make something".

Rules:
- When uncertain between single and workflow, choose "single" with confidence "low".
- intent must be one of: writing, design, video-audio, research-learning,
  coding-website, automation-productivity, business-marketing, general.
- estimatedSteps only when mode is "workflow" (2-6).
- signals: up to 4 short phrases explaining the decision.

Respond with valid JSON only, matching:
{
  "mode": "clarify"|"single"|"workflow",
  "intent": "writing"|"design"|"video-audio"|"research-learning"|"coding-website"|"automation-productivity"|"business-marketing"|"general",
  "confidence": "high"|"low",
  "signals": [string],
  "estimatedSteps": number (optional)
}`;

/**
 * Cheap LLM classification of the query into clarify / single / workflow.
 * On any failure (empty/invalid response) falls back to a safe single-tool
 * route so the main pipeline never breaks.
 */
export async function routeIntent(
  client: OpenAI,
  query: string,
  model: string,
): Promise<IntentRoute> {
  const fallback: IntentRoute = {
    mode: "single",
    intent: "general",
    confidence: "low",
    signals: ["router fallback"],
  };

  try {
    const response = await client.chat.completions.create({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: query },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return fallback;

    const parsed = IntentRouteSchema.safeParse(JSON.parse(content));
    if (!parsed.success) return fallback;

    // A workflow needs at least 2 steps; demote degenerate single-step plans.
    if (parsed.data.mode === "workflow" && (parsed.data.estimatedSteps ?? 2) < 2) {
      return { ...parsed.data, mode: "single" };
    }
    return parsed.data;
  } catch {
    return fallback;
  }
}
