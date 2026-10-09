import { prisma } from "@/server/prisma";
import { hmac } from "./cms-auth-codec";
import { secret } from "./cms-auth-config";

export const CMS_SESSION_COOKIE = "cms_session";
const WEEK = 60 * 60 * 24 * 7;

const SESSION_VERSION_TTL_MS = 60_000;

let sessionVersionCache: { value: number; expiresAt: number } | null = null;

/**
 * Remembers the auth row version so later saves skip a Neon round trip.
 * @example rememberSessionVersion(3) // void
 */
export function rememberSessionVersion(value: number) {
  sessionVersionCache = { value, expiresAt: Date.now() + SESSION_VERSION_TTL_MS };
}

/**
 * Reads CmsAuth.sessionVersion (0 on missing/error). Cached for a minute.
 * Password changes refresh the cache in this process immediately.
 * @example await currentSessionVersion() // 3
 */
async function currentSessionVersion(): Promise<number> {
  const cached = sessionVersionCache;
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  try {
    const row = await prisma.cmsAuth.findUnique({
      where: { id: "main" },
      select: { sessionVersion: true },
    });
    const value = row?.sessionVersion ?? 0;
    rememberSessionVersion(value);
    return value;
  } catch {
    return cached?.value ?? 0;
  }
}

/**
 * Builds a signed cms_session cookie (exp.version.sig).
 * @example await createSessionCookie() // { name, value, options }
 */
export async function createSessionCookie() {
  const version = await currentSessionVersion();
  const exp = Math.floor(Date.now() / 1000) + WEEK;
  const payload = `${exp}.${version}`;
  const token = `${payload}.${await hmac(payload)}`;
  return {
    name: CMS_SESSION_COOKIE,
    value: token,
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: WEEK,
    },
  };
}

/**
 * Returns cookie options that clear cms_session.
 * @example clearSessionCookie() // { name, options: { maxAge: 0 } }
 */
export function clearSessionCookie() {
  return {
    name: CMS_SESSION_COOKIE,
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    },
  };
}

/**
 * Verifies cms_session signature, expiry, and version.
 * @example await verifySessionCookie(token) // true
 */
export async function verifySessionCookie(token: string | undefined) {
  if (!token || !secret()) return false;
  const parts = token.split(".");
  // Expected: exp.version.sig (sig is base64url without '.').
  if (parts.length !== 3) return false;
  const [expStr, versionStr, sig] = parts;
  const payload = `${expStr}.${versionStr}`;
  const expected = await hmac(payload);
  if (sig.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i += 1) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) return false;
  const exp = Number(expStr);
  const version = Number(versionStr);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return false;
  if (!Number.isInteger(version) || version < 0) return false;
  const current = await currentSessionVersion();
  if (version !== current) return false;
  return true;
}
