import type { Tool } from "@auto/catalog";
import type OpenAI from "openai";
import { describe, expect, it } from "vitest";
import { assembleWorkflow, validateWorkflow } from "./workflow.js";
import type { PlannedStep, Workflow } from "./types.js";

function mockTool(id: string): Tool {
  return {
    id,
    name: id,
    url: `https://example.com/${id}`,
    category: "writing",
    deployment: "saas",
    pricing: "freemium",
    description: "test tool for workflows",
    bestFor: ["testing"],
    tags: ["test"],
    outputTypes: ["document"],
  };
}

/** Minimal OpenAI stand-in that returns a fixed completion payload. */
function mockClient(content: string): OpenAI {
  return {
    chat: {
      completions: {
        create: async () => ({ choices: [{ message: { content } }] }),
      },
    },
  } as unknown as OpenAI;
}

const validWorkflow: Workflow = {
  summary: "Two-step test workflow",
  toolCount: 2,
  difficulty: "easy",
  costTier: "freemium",
  steps: [
    {
      order: 1,
      title: "Step one",
      goal: "Produce a document",
      outputType: "document",
      tool: { toolId: "alpha", reason: "good at step one" },
      handoff: "Pass output to step two",
    },
    {
      order: 2,
      title: "Step two",
      goal: "Refine the document",
      outputType: "document",
      tool: { toolId: "beta", reason: "good at step two" },
    },
  ],
};

describe("validateWorkflow", () => {
  it("accepts a workflow whose tools are in each step's shortlist", () => {
    const ids = new Map([
      [1, new Set(["alpha", "gamma"])],
      [2, new Set(["beta"])],
    ]);
    expect(() => validateWorkflow(validWorkflow, ids)).not.toThrow();
  });

  it("rejects a tool outside its step's shortlist", () => {
    const ids = new Map([
      [1, new Set(["alpha"])],
      [2, new Set(["other"])], // beta not allowed here
    ]);
    expect(() => validateWorkflow(validWorkflow, ids)).toThrow(/not in its shortlist/);
  });
});

describe("assembleWorkflow", () => {
  const plannedSteps: PlannedStep[] = [
    {
      order: 1,
      title: "Step one",
      goal: "Produce a document",
      outputType: "document",
      retrievalQuery: "document writer",
    },
    {
      order: 2,
      title: "Step two",
      goal: "Refine the document",
      outputType: "document",
      retrievalQuery: "document editor",
    },
  ];

  it("parses model output and computes toolCount from distinct tools", async () => {
    const modelOutput = JSON.stringify({
      summary: "Write then refine",
      difficulty: "easy",
      costTier: "freemium",
      steps: [
        {
          order: 1,
          title: "Write",
          goal: "Draft the document",
          outputType: "document",
          tool: { toolId: "alpha", reason: "drafts well" },
        },
        {
          order: 2,
          title: "Refine",
          goal: "Polish the document",
          outputType: "document",
          tool: { toolId: "beta", reason: "edits well" },
        },
      ],
    });

    const shortlists = new Map([
      [1, [mockTool("alpha")]],
      [2, [mockTool("beta")]],
    ]);

    const workflow = await assembleWorkflow(
      mockClient(modelOutput),
      "write and refine a doc",
      plannedSteps,
      shortlists,
      "test-model",
    );

    expect(workflow.toolCount).toBe(2);
    expect(workflow.steps).toHaveLength(2);
    expect(workflow.steps[0]?.tool.toolId).toBe("alpha");
  });

  it("throws on invalid model output", async () => {
    await expect(
      assembleWorkflow(
        mockClient("{\"summary\": \"missing steps\"}"),
        "q",
        plannedSteps,
        new Map(),
        "test-model",
      ),
    ).rejects.toThrow(/Invalid assembler output/);
  });
});
