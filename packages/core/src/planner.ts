import OpenAI from "openai";
import {
  PlannedWorkflowSchema,
  type IntentRoute,
  type PlannedStep,
} from "./types.js";

const SYSTEM_PROMPT = `You are the workflow planner for Auto, an AI tool recommender.
Break the user's task into an ordered sequence of 2-6 steps that together
produce the final result.

CRITICAL: Do NOT name or recommend any specific products or tools. You only
define WHAT each step produces and HOW to search for a tool for it. Tools are
chosen later from a curated catalog.

For each step provide:
- order: 1-based position.
- title: 2-4 words, the action (e.g. "Write the script").
- goal: one short sentence describing the concrete deliverable of this step.
- outputType: exactly one of app, audio, automation, code, document, image,
  presentation, research, video, website — the type of artifact this step
  produces.
- retrievalQuery: a short search phrase (no product names) describing the kind
  of tool needed for this step, e.g. "AI text-to-speech voiceover generator".

Rules:
- Write every string (title, goal, retrievalQuery) in English, even when the
  user's query is in another language.
- Steps must be sequential: each step's output feeds the next.
- Keep steps distinct; do not split one tool's job into multiple steps.
- Prefer 2-4 steps unless the task clearly needs more.

Respond with valid JSON only, matching:
{ "steps": [ { "order": number, "title": string, "goal": string, "outputType": string, "retrievalQuery": string } ] }`;

/**
 * Decompose a task into abstract, tool-agnostic steps. Throws on an empty or
 * invalid response so the caller can fall back to the single-tool path.
 */
export async function planWorkflow(
  client: OpenAI,
  query: string,
  intent: IntentRoute,
  model: string,
): Promise<PlannedStep[]> {
  const response = await client.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify({
          query,
          intent: intent.intent,
          estimatedSteps: intent.estimatedSteps,
        }),
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from planner model");
  }

  const parsed = PlannedWorkflowSchema.safeParse(JSON.parse(content));
  if (!parsed.success) {
    throw new Error(
      `Invalid planner output: ${parsed.error.issues.map((i) => i.message).join("; ")}`,
    );
  }

  // Normalize order to be 1-based and contiguous regardless of model output.
  return parsed.data.steps
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((step, i) => ({ ...step, order: i + 1 }));
}
