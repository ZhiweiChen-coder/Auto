import type { Tool } from "@auto/catalog";
import OpenAI from "openai";
import {
  WorkflowSchema,
  type PlannedStep,
  type Workflow,
} from "./types.js";

const SYSTEM_PROMPT = `You are the workflow assembler for Auto, an AI tool recommender.
You are given an ordered list of steps. EACH step has its own list of candidate
tools. Choose the best tool for each step and explain how the work flows from
one step to the next.

Rules:
- For each step, pick exactly one tool using its exact toolId, and ONLY from
  that step's "candidates" list. Never use a tool from another step's list.
- Optionally add up to 2 alternatives for a step, also from that step's candidates.
- Write every user-facing string in English, short and beginner-friendly.
- tool.reason: one sentence, max 16 words.
- handoff: one sentence explaining how this step's output enters the next step
  (e.g. "Export the script as text, paste it into the next tool"). Omit on the
  last step.
- summary: one sentence describing the whole workflow.
- Treat any "Preferences:" in the query as hard constraints across all steps.
- difficulty: overall chain difficulty — "easy", "medium", or "advanced".
- costTier: overall chain cost — "free", "freemium", or "paid" (worst case across steps).

Respond with valid JSON only, matching:
{
  "summary": string,
  "difficulty": "easy"|"medium"|"advanced",
  "costTier": "free"|"freemium"|"paid",
  "steps": [
    {
      "order": number,
      "title": string,
      "goal": string,
      "outputType": string,
      "tool": { "toolId": string, "reason": string },
      "alternatives": [{ "toolId": string, "reason": string }],
      "handoff": string
    }
  ]
}`;

const AssembledSchema = WorkflowSchema.omit({ toolCount: true });

function candidatePayload(tool: Tool) {
  return {
    toolId: tool.id,
    name: tool.name,
    category: tool.category,
    pricing: tool.pricing,
    deployment: tool.deployment,
    description: tool.description,
    bestFor: tool.bestFor,
    outputTypes: tool.outputTypes,
  };
}

/**
 * Assign a concrete tool to each planned step and stitch them into a workflow.
 * `perStepShortlists` is keyed by step order. Throws on empty/invalid model
 * output so the caller can fall back to the single-tool path.
 */
export async function assembleWorkflow(
  client: OpenAI,
  query: string,
  plannedSteps: PlannedStep[],
  perStepShortlists: Map<number, Tool[]>,
  model: string,
): Promise<Workflow> {
  const stepsPayload = plannedSteps.map((step) => ({
    order: step.order,
    title: step.title,
    goal: step.goal,
    outputType: step.outputType,
    retrievalQuery: step.retrievalQuery,
    candidates: (perStepShortlists.get(step.order) ?? []).map(candidatePayload),
  }));

  const response = await client.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: JSON.stringify({ query, steps: stepsPayload }, null, 2) },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from assembler model");
  }

  const parsed = AssembledSchema.safeParse(JSON.parse(content));
  if (!parsed.success) {
    throw new Error(
      `Invalid assembler output: ${parsed.error.issues.map((i) => i.message).join("; ")}`,
    );
  }

  const distinctTools = new Set(parsed.data.steps.map((s) => s.tool.toolId));
  return WorkflowSchema.parse({ ...parsed.data, toolCount: distinctTools.size });
}

/**
 * Reject workflows that reference a tool outside its step's shortlist (the same
 * anti-hallucination guard as validateAgainstShortlist for single-tool output).
 * Output-type handoff mismatches are tolerated, not fatal.
 */
export function validateWorkflow(
  workflow: Workflow,
  perStepShortlistIds: Map<number, Set<string>>,
): Workflow {
  for (const step of workflow.steps) {
    const allowed = perStepShortlistIds.get(step.order);
    if (!allowed) {
      throw new Error(`Workflow step ${step.order} has no shortlist`);
    }
    const ids = [step.tool.toolId, ...(step.alternatives?.map((a) => a.toolId) ?? [])];
    for (const id of ids) {
      if (!allowed.has(id)) {
        throw new Error(
          `Workflow step ${step.order} used toolId "${id}" not in its shortlist`,
        );
      }
    }
  }
  return workflow;
}
