const MOCK_DIM = 1536;

/** Deterministic local embedding for dev/CI without OpenAI. Not for production quality. */
export function mockEmbed(text: string, dim = MOCK_DIM): number[] {
  const vec = new Float64Array(dim);
  const normalized = text.toLowerCase();
  const tokens = normalized.split(/\W+/).filter((t) => t.length > 1);

  for (const token of tokens) {
    let h = 2166136261;
    for (let i = 0; i < token.length; i++) {
      h ^= token.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const idx = Math.abs(h) % dim;
    vec[idx]! += 1;
    const idx2 = Math.abs(h >>> 16) % dim;
    vec[idx2]! += 0.5;
  }

  const out: number[] = Array.from(vec);
  let norm = 0;
  for (const v of out) norm += v * v;
  norm = Math.sqrt(norm) || 1;
  return out.map((v) => v / norm);
}

export const MOCK_EMBEDDING_MODEL = "mock-hash-v1";
