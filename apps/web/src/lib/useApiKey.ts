"use client";

import { useCallback, useEffect, useState } from "react";

export const API_KEY_STORAGE = "auto_openai_key";

/**
 * Stores the user's own OpenAI key in localStorage (BYOK). The key never goes
 * anywhere except the Authorization header on recommend requests to our own
 * API. Kept client-side so a self-hosted/local user can paste a key without
 * editing env files.
 */
export function useApiKey() {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setApiKeyState(readStoredApiKey());
    setLoaded(true);
  }, []);

  const setApiKey = useCallback((key: string) => {
    const trimmed = key.trim();
    try {
      if (trimmed) window.localStorage.setItem(API_KEY_STORAGE, trimmed);
      else window.localStorage.removeItem(API_KEY_STORAGE);
    } catch {
      // localStorage may be unavailable (private mode); ignore.
    }
    setApiKeyState(trimmed || null);
  }, []);

  const clearApiKey = useCallback(() => setApiKey(""), [setApiKey]);

  return { apiKey, setApiKey, clearApiKey, loaded };
}

/** Read the stored key on demand (e.g. inside a fetch) without a hook. */
export function readStoredApiKey(): string | null {
  try {
    return window.localStorage.getItem(API_KEY_STORAGE);
  } catch {
    return null;
  }
}
