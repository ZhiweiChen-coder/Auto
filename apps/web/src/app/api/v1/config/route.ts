import { jsonResponse, preflightResponse } from "@/lib/api";
import { appMode, requiresUserKey, serverHasOpenAiKey } from "@/lib/config";

/** Public, non-sensitive client config: drives BYOK prompts and mode-specific UI. */
export async function GET() {
  return jsonResponse({
    mode: appMode(),
    requiresUserKey: requiresUserKey(),
    serverHasKey: serverHasOpenAiKey(),
  });
}

export async function OPTIONS() {
  return preflightResponse();
}
