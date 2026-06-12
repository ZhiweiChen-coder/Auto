import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import type { NextConfig } from "next";

const webDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(webDir, "../..");

for (const envPath of [
  path.join(repoRoot, ".env.local"),
  path.join(repoRoot, ".env"),
  path.join(webDir, ".env.local"),
  path.join(webDir, ".env"),
]) {
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
}

const nextConfig: NextConfig = {
  transpilePackages: ["@auto/catalog", "@auto/core"],
  serverExternalPackages: ["openai"],
  // The catalog (data/tools) and embeddings (data/embeddings.json) live at the
  // monorepo root and are read at runtime via fs from resolved paths. Next's
  // static tracer can't follow those dynamic reads, so on Vercel the serverless
  // bundles would miss them (ENOENT). Pin the tracing root to the repo and
  // explicitly include the data each route touches. Globs are relative to this
  // config file (apps/web); embeddings is only read by /api/v1/recommend.
  outputFileTracingRoot: repoRoot,
  outputFileTracingIncludes: {
    "/api/v1/recommend": ["../../data/tools/**/*", "../../data/embeddings.json"],
    "/api/v1/tools": ["../../data/tools/**/*"],
    "/api/v1/tools/[id]": ["../../data/tools/**/*"],
    "/api/v1/health": ["../../data/tools/**/*"],
    "/results": ["../../data/tools/**/*"],
    "/browse": ["../../data/tools/**/*"],
  },
};

export default nextConfig;
