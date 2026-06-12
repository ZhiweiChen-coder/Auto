import { describe, expect, it } from "vitest";
import {
  cosineSimilarity,
  retrieveTopK,
  retrieveTopKFiltered,
} from "./embeddings.js";
import type { EmbeddingsFile } from "./types.js";

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors", () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1);
  });

  it("returns 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });
});

describe("retrieveTopK", () => {
  it("returns highest scoring tools", () => {
    const file: EmbeddingsFile = {
      version: "1.0.0",
      model: "test",
      generatedAt: "2026-01-01",
      tools: [
        { toolId: "a", embedding: [1, 0, 0] },
        { toolId: "b", embedding: [0.9, 0.1, 0] },
        { toolId: "c", embedding: [0, 1, 0] },
      ],
    };
    const results = retrieveTopK([1, 0, 0], file, 2);
    expect(results).toHaveLength(2);
    expect(results[0]?.toolId).toBe("a");
    expect(results[1]?.toolId).toBe("b");
  });
});

describe("retrieveTopKFiltered", () => {
  const file: EmbeddingsFile = {
    version: "1.0.0",
    model: "test",
    generatedAt: "2026-01-01",
    tools: [
      { toolId: "a", embedding: [1, 0, 0] },
      { toolId: "b", embedding: [0.9, 0.1, 0] },
      { toolId: "c", embedding: [0, 1, 0] },
    ],
  };

  it("only scores tools in the allowlist", () => {
    const results = retrieveTopKFiltered([1, 0, 0], file, 5, new Set(["b", "c"]));
    expect(results.map((r) => r.toolId)).toEqual(["b", "c"]);
  });

  it("returns all when no allowlist is given", () => {
    const results = retrieveTopKFiltered([1, 0, 0], file, 5);
    expect(results).toHaveLength(3);
  });

  it("returns empty when allowlist matches nothing", () => {
    const results = retrieveTopKFiltered([1, 0, 0], file, 5, new Set(["x"]));
    expect(results).toEqual([]);
  });
});
