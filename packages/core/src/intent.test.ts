import type OpenAI from "openai";
import { describe, expect, it } from "vitest";
import { routeIntent } from "./intent.js";

function mockClient(content: string | null): OpenAI {
  return {
    chat: {
      completions: {
        create: async () => ({ choices: [{ message: { content } }] }),
      },
    },
  } as unknown as OpenAI;
}

describe("routeIntent", () => {
  it("returns the parsed route for valid JSON", async () => {
    const route = await routeIntent(
      mockClient(
        JSON.stringify({
          mode: "workflow",
          intent: "video-audio",
          confidence: "high",
          signals: ["multiple output types"],
          estimatedSteps: 4,
        }),
      ),
      "make a promo video",
      "test-model",
    );
    expect(route.mode).toBe("workflow");
    expect(route.estimatedSteps).toBe(4);
  });

  it("demotes a single-step workflow to single", async () => {
    const route = await routeIntent(
      mockClient(
        JSON.stringify({
          mode: "workflow",
          intent: "writing",
          confidence: "high",
          signals: [],
          estimatedSteps: 1,
        }),
      ),
      "write a tweet",
      "test-model",
    );
    expect(route.mode).toBe("single");
  });

  it("falls back to single on malformed output", async () => {
    const route = await routeIntent(
      mockClient("not json at all"),
      "anything",
      "test-model",
    );
    expect(route.mode).toBe("single");
    expect(route.confidence).toBe("low");
  });

  it("falls back to single on empty content", async () => {
    const route = await routeIntent(mockClient(null), "anything", "test-model");
    expect(route.mode).toBe("single");
  });
});
