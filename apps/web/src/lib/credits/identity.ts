import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "auto_uid";
const TTL_MS = 365 * 24 * 60 * 60 * 1000; // 1 year

/**
 * Credit subject = a signed anonymous id in an httpOnly cookie. This is the
 * IDENTITY SEAM: it's enough to demonstrate per-user metering, but it's
 * bypassable (clear cookies → new id). Replace getOrCreateUserId() with real
 * accounts (magic link / OAuth) before relying on it for billing.
 */
function secret(): string {
  return (
    process.env.SESSION_SECRET ?? process.env.ADMIN_TOKEN ?? "auto-anon-id-dev"
  );
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function parseSigned(cookie: string | undefined): string | null {
  if (!cookie) return null;
  const dot = cookie.lastIndexOf(".");
  if (dot <= 0) return null;
  const id = cookie.slice(0, dot);
  const sig = cookie.slice(dot + 1);
  return timingSafeEqualStr(sig, sign(id)) ? id : null;
}

/** Read the existing signed user id, or mint and set a new one. */
export async function getOrCreateUserId(): Promise<string> {
  const store = await cookies();
  const existing = parseSigned(store.get(COOKIE_NAME)?.value);
  if (existing) return existing;

  const id = randomUUID();
  store.set(COOKIE_NAME, `${id}.${sign(id)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: TTL_MS / 1000,
    path: "/",
  });
  return id;
}

/** Read the signed user id without minting one (for read-only endpoints). */
export async function readUserId(): Promise<string | null> {
  const store = await cookies();
  return parseSigned(store.get(COOKIE_NAME)?.value);
}
