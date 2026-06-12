import { DifficultySchema, OutputTypeSchema, PricingSchema } from "@auto/catalog";
import { z } from "zod";

export const ConfidenceSchema = z.enum(["high", "medium"]);

export const NeedsClarificationSchema = z.object({
  message: z.string(),
  questions: z.array(z.string()).min(1).max(3),
});

export const TaskIntentSchema = z.enum([
  "writing",
  "design",
  "video-audio",
  "research-learning",
  "coding-website",
  "automation-productivity",
  "business-marketing",
  "general",
]);

export const UserLevelSchema = z.enum(["beginner", "intermediate", "advanced"]);

// --- Intent Router ---------------------------------------------------------

export const IntentModeSchema = z.enum(["clarify", "single", "workflow"]);

export const IntentRouteSchema = z.object({
  mode: IntentModeSchema,
  intent: TaskIntentSchema,
  confidence: z.enum(["high", "low"]),
  signals: z.array(z.string()).max(4),
  estimatedSteps: z.number().int().min(1).max(6).optional(),
});

export type IntentMode = z.infer<typeof IntentModeSchema>;
export type IntentRoute = z.infer<typeof IntentRouteSchema>;

// --- Workflow --------------------------------------------------------------

export const WorkflowStepSchema = z.object({
  order: z.number().int().min(1),
  title: z.string().min(1),
  goal: z.string().min(1),
  outputType: OutputTypeSchema,
  tool: z.object({ toolId: z.string(), reason: z.string() }),
  alternatives: z
    .array(z.object({ toolId: z.string(), reason: z.string() }))
    .max(2)
    .optional(),
  handoff: z.string().optional(),
});

export const WorkflowSchema = z.object({
  summary: z.string().min(1),
  steps: z.array(WorkflowStepSchema).min(2).max(6),
  toolCount: z.number().int(),
  difficulty: DifficultySchema,
  costTier: PricingSchema,
});

export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;
export type Workflow = z.infer<typeof WorkflowSchema>;

/** Step shape produced by the planner before tools are assigned. */
export const PlannedStepSchema = z.object({
  order: z.number().int().min(1),
  title: z.string().min(1),
  goal: z.string().min(1),
  outputType: OutputTypeSchema,
  retrievalQuery: z.string().min(1),
});

export const PlannedWorkflowSchema = z.object({
  steps: z.array(PlannedStepSchema).min(1).max(6),
});

export type PlannedStep = z.infer<typeof PlannedStepSchema>;
export type PlannedWorkflow = z.infer<typeof PlannedWorkflowSchema>;

export const TaskUnderstandingSchema = z.object({
  intent: TaskIntentSchema,
  output: z.string(),
  userLevel: UserLevelSchema,
  plainSummary: z.string(),
});

export const ActionGuideSchema = z.object({
  firstSteps: z.array(z.string()).min(2).max(5),
  copyPrompt: z.string().min(10),
  beginnerNote: z.string().optional(),
});

export const RouteCardSchema = z.object({
  label: z.enum(["Fastest route", "Cheapest route", "Highest quality route"]),
  bestFor: z.string(),
  toolIds: z.array(z.string()).min(1).max(3),
  steps: z.array(z.string()).min(2).max(4),
  tradeoff: z.string(),
});

export const RecommendResponseSchema = z.object({
  query: z.string(),
  task: TaskUnderstandingSchema.optional(),
  primary: z
    .object({
      toolId: z.string(),
      confidence: ConfidenceSchema,
      reason: z.string(),
    })
    .optional(),
  alternatives: z
    .array(
      z.object({
        toolId: z.string(),
        reason: z.string(),
      }),
    )
    .min(0)
    .max(3)
    .optional(),
  workflowTip: z.string().optional(),
  avoid: z.string().optional(),
  actionGuide: ActionGuideSchema.optional(),
  routeCards: z.array(RouteCardSchema).min(1).max(3).optional(),
  workflow: WorkflowSchema.optional(),
  needsClarification: NeedsClarificationSchema.optional(),
});

export type RecommendResponse = z.infer<typeof RecommendResponseSchema>;

export const LlmRankOutputSchema = z.object({
  task: TaskUnderstandingSchema,
  primary: z.object({
    toolId: z.string(),
    confidence: ConfidenceSchema,
    reason: z.string(),
  }),
  alternatives: z
    .array(
      z.object({
        toolId: z.string(),
        reason: z.string(),
      }),
    )
    .max(3),
  workflowTip: z.string().optional(),
  avoid: z.string().optional(),
  actionGuide: ActionGuideSchema,
  routeCards: z.array(RouteCardSchema).min(1).max(3),
});

export type LlmRankOutput = z.infer<typeof LlmRankOutputSchema>;

export type EmbeddedTool = {
  toolId: string;
  embedding: number[];
};

export type EmbeddingsFile = {
  version: string;
  model: string;
  generatedAt: string;
  tools: EmbeddedTool[];
};

/**
 * Real pipeline stages, emitted in order as the recommendation runs. These map
 * 1:1 to the live status UI nodes (Understand → Search → Compare → Recommend).
 */
export type ProgressStage = "understand" | "search" | "compare" | "recommend";

export type RecommendOptions = {
  limit?: number;
  shortlistSize?: number;
  openaiApiKey?: string;
  embeddingModel?: string;
  rankerModel?: string;
  intentModel?: string;
  plannerModel?: string;
  embeddingsPath?: string;
  toolsDir?: string;
  /** "auto" lets the Intent Router decide; "workflow" forces workflow generation. */
  mode?: "auto" | "workflow";
  /**
   * Called as each real pipeline stage begins. Lets callers (e.g. a streaming
   * API route) report genuine progress instead of a time-based fake.
   */
  onProgress?: (stage: ProgressStage) => void;
};
