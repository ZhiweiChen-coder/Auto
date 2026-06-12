/**
 * Deployment mode.
 *
 * - "local"  (default): self-hosted / single user. The OpenAI key comes from
 *   the server env or the user's own key (BYOK). No credit system, CORS open.
 * - "open": the hosted multi-user deployment. Uses the server key behind a
 *   credit system (see Step 3), CORS locked to the app origin.
 */
export type AppMode = "local" | "open";

export function appMode(): AppMode {
  return process.env.APP_MODE === "open" ? "open" : "local";
}

export function isOpenMode(): boolean {
  return appMode() === "open";
}

export function isLocalMode(): boolean {
  return appMode() === "local";
}

/** Whether the server itself has an OpenAI key configured. */
export function serverHasOpenAiKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

/**
 * Whether the user must supply their own API key for the app to work. True
 * only in local mode with no server key set; in open mode the server key (and
 * credits) cover it, and BYOK is optional.
 */
export function requiresUserKey(): boolean {
  return isLocalMode() && !serverHasOpenAiKey();
}
