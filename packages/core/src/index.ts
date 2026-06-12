export { recommend } from "./recommend.js";
export { findRepoRoot } from "./paths.js";
export { MOCK_EMBEDDING_MODEL, mockEmbed } from "./mock-embed.js";
export {
  cosineSimilarity,
  embedText,
  loadEmbeddingsFile,
  retrieveTopK,
  retrieveTopKFiltered,
  toolToEmbeddingText,
} from "./embeddings.js";
export { planWorkflow } from "./planner.js";
export { assembleWorkflow, validateWorkflow } from "./workflow.js";
export {
  IntentRouteSchema,
  NeedsClarificationSchema,
  PlannedWorkflowSchema,
  RecommendResponseSchema,
  WorkflowSchema,
  type EmbeddingsFile,
  type IntentMode,
  type IntentRoute,
  type PlannedStep,
  type PlannedWorkflow,
  type ProgressStage,
  type RecommendOptions,
  type RecommendResponse,
  type Workflow,
  type WorkflowStep,
} from "./types.js";
export {
  buildClarification,
  isEmbeddingMatchAmbiguous,
  isQueryVague,
} from "./clarify.js";
export { routeIntent } from "./intent.js";
