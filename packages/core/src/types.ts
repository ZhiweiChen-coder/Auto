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

export type RecommendOptions = {
  limit?: number;
  shortlistSize?: number;
  openaiApiKey?: string;
  embeddingModel?: string;
  rankerModel?: string;
  embeddingsPath?: string;
  toolsDir?: string;
};
