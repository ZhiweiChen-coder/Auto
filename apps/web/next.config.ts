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
};

export default nextConfig;
