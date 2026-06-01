import type { Tool } from "@auto/catalog";
import OpenAI from "openai";
import { LlmRankOutputSchema, type LlmRankOutput } from "./types.js";

const SYSTEM_PROMPT = `You are Auto, an AI tool recommender. You do NOT answer the user's task.
You ONLY recommend which existing AI product(s) from the provided shortlist best fit the task.
Auto is for ordinary users, not AI industry experts. Explain choices in plain language and help the user take the next step.

Rules:
- Pick tools ONLY from the shortlist (use exact toolId values).
- Never invent products or tool IDs.
- Always write every user-facing string in English, even when the user's query is written in another language.
- Treat any "Preferences:" line in the user query as a hard constraint when possible.
- If preferences conflict, favor the safest beginner-friendly path and explain the trade-off in workflowTip or avoid.
- Prefer beginner-friendly ready-to-use SaaS unless the user asks for code, privacy, local setup, or advanced control.
- Give 1 primary recommendation and up to 2 alternatives.
- Keep all user-facing copy short, direct, and easy to scan.
- primary.reason: one sentence, max 18 words.
- alternative reasons: one sentence, max 16 words.
- firstSteps: 2-3 steps, each max 12 words, no "Step 1:" prefixes.
- routeCard.bestFor: max 8 words.
- routeCard.steps: max 10 words each.
- routeCard.tradeoff: max 12 words.
- Explain what the user should do next, not just why the product is good.
- firstSteps must be concrete steps inside or around the recommended tool.
- copyPrompt must be a polished prompt the user can paste into the primary tool.
- routeCards must compare practical paths for the same task: fastest, cheapest, and highest quality when possible.
- Each routeCard toolIds array may contain 1-3 exact toolId values from the shortlist.
- If two routes would use the same tool, make the difference clear in steps and tradeoff.
- workflowTip: optional multi-tool workflow in plain language.
- avoid: optional note on what NOT to use and why.

Respond with valid JSON only, matching this shape:
{
  "task": {
    "intent": "writing"|"design"|"video-audio"|"research-learning"|"coding-website"|"automation-productivity"|"business-marketing"|"general",
    "output": string,
    "userLevel": "beginner"|"intermediate"|"advanced",
    "plainSummary": string
  },
  "primary": { "toolId": string, "confidence": "high"|"medium", "reason": string },
  "alternatives": [{ "toolId": string, "reason": string }],
  "workflowTip": string (optional),
  "avoid": string (optional),
  "actionGuide": {
    "firstSteps": [string, string],
    "copyPrompt": string,
    "beginnerNote": string (optional)
  },
  "routeCards": [
    {
      "label": "Fastest route"|"Cheapest route"|"Highest quality route",
      "bestFor": string,
      "toolIds": [string],
      "steps": [string, string],
      "tradeoff": string
    }
  ]
}`;

export async function rankWithLlm(
  client: OpenAI,
  query: string,
  shortlist: Tool[],
  model: string,
): Promise<LlmRankOutput> {
  const shortlistPayload = shortlist.map((t) => ({
    toolId: t.id,
    name: t.name,
    url: t.url,
    category: t.category,
    deployment: t.deployment,
    pricing: t.pricing,
    description: t.description,
    bestFor: t.bestFor,
    notFor: t.notFor,
    tags: t.tags,
    difficulty: t.difficulty,
    bestForBeginners: t.bestForBeginners,
    requiresCoding: t.requiresCoding,
    supportsChinese: t.supportsChinese,
    outputTypes: t.outputTypes,
    commonUseCases: t.commonUseCases,
    avoidWhen: t.avoidWhen,
  }));

  const response = await client.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify({ query, shortlist: shortlistPayload }, null, 2),
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from ranker model");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Ranker returned invalid JSON");
  }

  const result = LlmRankOutputSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `Invalid ranker output: ${result.error.issues.map((i) => i.message).join("; ")}`,
    );
  }

  return result.data;
}

export function validateAgainstShortlist(
  output: LlmRankOutput,
  shortlistIds: Set<string>,
): LlmRankOutput {
  const routeIds = output.routeCards.flatMap((route) => route.toolIds);
  const ids = [
    output.primary.toolId,
    ...output.alternatives.map((a) => a.toolId),
    ...routeIds,
  ];
  for (const id of ids) {
    if (!shortlistIds.has(id)) {
      throw new Error(`LLM recommended unknown toolId "${id}" not in shortlist`);
    }
  }
  const rankedIds = [output.primary.toolId, ...output.alternatives.map((a) => a.toolId)];
  const uniqueRankedIds = new Set(rankedIds);
  if (uniqueRankedIds.size !== rankedIds.length) {
    throw new Error("LLM recommended duplicate tool IDs");
  }
  if (output.primary.toolId === output.alternatives[0]?.toolId) {
    throw new Error("Primary and first alternative must differ");
  }
  return output;
}
