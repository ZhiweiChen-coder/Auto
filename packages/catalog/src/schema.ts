import { z } from "zod";

export const ToolCategorySchema = z.enum([
  "search",
  "coding",
  "app-builder",
  "writing",
  "image",
  "video",
  "automation",
  "local",
  "general",
]);

export const DeploymentSchema = z.enum(["saas", "local", "api", "hybrid"]);

export const PricingSchema = z.enum(["free", "freemium", "paid"]);

export const DifficultySchema = z.enum(["easy", "medium", "advanced"]);

export const OutputTypeSchema = z.enum([
  "app",
  "audio",
  "automation",
  "code",
  "document",
  "image",
  "presentation",
  "research",
  "video",
  "website",
]);

export const ToolSchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "id must be lowercase alphanumeric with hyphens"),
  name: z.string().min(1),
  url: z.string().url(),
  category: ToolCategorySchema,
  deployment: DeploymentSchema,
  pricing: PricingSchema,
  description: z.string().min(10),
  bestFor: z.array(z.string().min(3)).min(1),
  notFor: z.array(z.string().min(3)).optional(),
  tags: z.array(z.string().min(1)).min(1),
  difficulty: DifficultySchema.optional(),
  bestForBeginners: z.boolean().optional(),
  requiresCoding: z.boolean().optional(),
  supportsChinese: z.boolean().optional(),
  outputTypes: z.array(OutputTypeSchema).min(1),
  commonUseCases: z.array(z.string().min(3)).optional(),
  avoidWhen: z.array(z.string().min(3)).optional(),
});

export type Tool = z.infer<typeof ToolSchema>;
export type ToolCategory = z.infer<typeof ToolCategorySchema>;
export type Deployment = z.infer<typeof DeploymentSchema>;
export type Pricing = z.infer<typeof PricingSchema>;
export type Difficulty = z.infer<typeof DifficultySchema>;
export type OutputType = z.infer<typeof OutputTypeSchema>;

export const CATALOG_VERSION = "1.0.0";
