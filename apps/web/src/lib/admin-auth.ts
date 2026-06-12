import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "auto_admin";
const SESSION_TTL_MS = 60 * 60 * 24 * 7 * 1000; // 7 days

/**
 * Secret used to sign admin sessions. Prefer a dedicated SESSION_SECRET; fall
 * back to deriving one from ADMIN_TOKEN so the single-token setup works with no
 * extra config. Rotating ADMIN_TOKEN therefore invalidates existing sessions.
 */
function sessionSecret(): string | undefined {
  const explicit = process.env.SESSION_SECRET;
  if (explicit) return explicit;
  const token = process.env.ADMIN_TOKEN;
  return token ? `admin-session:${token}` : undefined;
}

function timingSafeEqualStr(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** Mint a signed `<payload>.<sig>` session token with an embedded expiry. */
function mintSession(secret: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      exp: Date.now() + SESSION_TTL_MS,
      jti: randomBytes(9).toString("base64url"),
    }),
    "utf8",
  ).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

/** Verify the signature (timing-safe) and that the token has not expired. */
function verifySession(token: string, secret: string): boolean {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!timingSafeEqualStr(sig, sign(payload, secret))) return false;
  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { exp?: number };
    return typeof data.exp === "number" && data.exp > Date.now();
  } catch {
    return false;
  }
}

export function isAdminConfigured() {
  return Boolean(process.env.ADMIN_TOKEN);
}

export function validateAdminToken(token: string) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return false;
  return timingSafeEqualStr(token, expected);
}

export async function isAdminAuthenticated() {
  // Fail closed: with no secret configured, admin features are disabled rather
  // than left open to the public. Set ADMIN_TOKEN to enable them.
  const secret = sessionSecret();
  if (!secret) return false;

  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME)?.value;
  return Boolean(cookie && verifySession(cookie, secret));
}

export async function setAdminSession() {
  const secret = sessionSecret();
  if (!secret) return;

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, mintSession(secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
