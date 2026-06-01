import { describe, expect, it } from "vitest";
import {
  isEmbeddingMatchAmbiguous,
  isQueryTooShort,
  isQueryVague,
} from "./clarify.js";

describe("isQueryVague", () => {
  it("flags very short queries", () => {
    expect(isQueryTooShort("help me")).toBe(true);
    expect(isQueryVague("hello")).toBe(true);
  });

  it("allows specific tasks", () => {
    expect(
      isQueryVague("refactor a large Python monorepo with tests"),
    ).toBe(false);
  });
});

describe("isEmbeddingMatchAmbiguous", () => {
  it("flags flat top scores", () => {
    expect(
      isEmbeddingMatchAmbiguous([
        { score: 0.38 },
        { score: 0.37 },
        { score: 0.36 },
      ]),
    ).toBe(true);
  });

  it("allows clear winner", () => {
    expect(
      isEmbeddingMatchAmbiguous([
        { score: 0.72 },
        { score: 0.45 },
        { score: 0.4 },
      ]),
    ).toBe(false);
  });
});
