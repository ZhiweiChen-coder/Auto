import { auth } from "@/lib/auth";
import { getOrCreateUserId, readUserId } from "./identity";

/**
 * The credit subject for a request, in precedence order:
 *   1. Authenticated Google account → `google:<sub>` (durable).
 *   2. Anonymous signed cookie → `auto_uid` (bypassable fallback).
 *
 * Kept separate from identity.ts to avoid an import cycle (auth.ts already
 * imports identity.ts).
 */
async function sessionSubject(): Promise<string | null> {
  const session = await auth();
  const id = (session?.user as { id?: string } | undefined)?.id;
  return id ?? null;
}

/** Resolve the subject, minting an anon id when no account/cookie exists yet. */
export async function resolveCreditSubject(): Promise<string> {
  return (await sessionSubject()) ?? (await getOrCreateUserId());
}

/** Resolve the subject without minting (for read-only endpoints). */
export async function readCreditSubject(): Promise<string | null> {
  return (await sessionSubject()) ?? (await readUserId());
}
