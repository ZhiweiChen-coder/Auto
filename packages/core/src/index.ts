export { recommend } from "./recommend.js";
export { findRepoRoot } from "./paths.js";
export { MOCK_EMBEDDING_MODEL, mockEmbed } from "./mock-embed.js";
export {
  cosineSimilarity,
  embedText,
  loadEmbeddingsFile,
  retrieveTopK,
  toolToEmbeddingText,
} from "./embeddings.js";
export {
  NeedsClarificationSchema,
  RecommendResponseSchema,
  type RecommendOptions,
  type RecommendResponse,
  type EmbeddingsFile,
} from "./types.js";
export {
  buildClarification,
  isEmbeddingMatchAmbiguous,
  isQueryVague,
} from "./clarify.js";
