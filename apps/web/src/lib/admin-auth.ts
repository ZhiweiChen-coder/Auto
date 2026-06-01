import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "auto_admin";

function adminTokenHash() {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return undefined;
  return createHash("sha256").update(token).digest("hex");
}

function isSameSecret(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function isAdminConfigured() {
  return Boolean(process.env.ADMIN_TOKEN);
}

export function validateAdminToken(token: string) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return false;
  return isSameSecret(token, expected);
}

export async function isAdminAuthenticated() {
  const expectedHash = adminTokenHash();
  if (!expectedHash) return true;

  const cookieStore = await cookies();
  const actual = cookieStore.get(COOKIE_NAME)?.value;
  return Boolean(actual && isSameSecret(actual, expectedHash));
}

export async function setAdminSession() {
  const hash = adminTokenHash();
  if (!hash) return;

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, hash, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/admin",
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
