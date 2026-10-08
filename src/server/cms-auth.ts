import { cookies } from "next/headers";
import {
  clearRateLimit,
  isRateLimited,
  rateLimited,
  recordRateLimitHit,
} from "@/server/rate-limit";
import { prisma } from "@/server/prisma";

const COOKIE = "cms_session";
const WEEK = 60 * 60 * 24 * 7;
const LOGIN_SCOPE = "cms-login";
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_MAX = 5;
const HASH_PREFIX = "pbkdf2:v1:";
const PBKDF2_ITERATIONS = 210_000;
const MIN_PASSWORD_LENGTH = 8;
const RESET_SCOPE = "cms-forgot";
const RESET_WINDOW_MS = 60 * 60 * 1000;
const RESET_MAX = 3;
const RESET_TOKEN_TTL_MS = 2 * 60 * 60 * 1000;
const AI_SCOPE = "cms-ai";
const AI_WINDOW_MS = 10 * 60 * 1000;
const AI_MAX = 20;
const UPLOAD_SCOPE = "cms-upload";
const UPLOAD_WINDOW_MS = 10 * 60 * 1000;
const UPLOAD_MAX = 40;

/**
 * Returns CMS_SECRET, or ADMIN_PASSWORD in non-production.
 * @example secret() // "my-cms-secret"
 */
function secret() {
  const dedicated = process.env.CMS_SECRET?.trim() || "";
  if (dedicated) return dedicated;
  if (process.env.NODE_ENV === "production") return "";
  // Dev fallback only — production must set CMS_SECRET explicitly.
  return process.env.ADMIN_PASSWORD?.trim() || "";
}

/**
 * Reads ADMIN_PASSWORD from env.
 * @example adminPassword() // "s3cret" | ""
 */
export function adminPassword() {
  return process.env.ADMIN_PASSWORD?.trim() || "";
}

/**
 * Returns the minimum allowed password length.
 * @example minPasswordLength() // 8
 */
export function minPasswordLength() {
  return MIN_PASSWORD_LENGTH;
}

/**
 * True when CmsAuth has a stored password hash.
 * @example await hasStoredPassword() // true
 */
export async function hasStoredPassword() {
  try {
    const row = await prisma.cmsAuth.findUnique({
      where: { id: "main" },
      select: { passwordHash: true },
    });
    return Boolean(row?.passwordHash);
  } catch {
    return false;
  }
}

/**
 * True when CMS secret + password (env or stored) are configured.
 * @example await cmsConfigured() // true
 */
export async function cmsConfigured() {
  if (!secret()) return false;
  if (adminPassword()) return true;
  return hasStoredPassword();
}

/**
 * True when CMS_SECRET is set (or not production).
 * @example cmsSecretConfigured() // true
 */
export function cmsSecretConfigured() {
  return Boolean(process.env.CMS_SECRET?.trim()) || process.env.NODE_ENV !== "production";
}

/**
 * Encodes bytes to URL-safe base64.
 * @example bytesToB64(new Uint8Array([1,2])) // "AQI"
 */
function bytesToB64(bytes: ArrayBuffer | Uint8Array) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  for (const b of arr) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

/**
 * Decodes URL-safe base64 to bytes.
 * @example b64ToBytes("AQI") // Uint8Array([1,2])
 */
function b64ToBytes(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const bin = atob(padded + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * Constant-time byte equality.
 * @example timingSafeEqual(a, b) // true
 */
function timingSafeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

/**
 * HMAC-SHA256 of value with CMS secret, base64url.
 * @example await hmac("exp.ver") // "sig…"
 */
async function hmac(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return bytesToB64(sig);
}

const SESSION_VERSION_TTL_MS = 60_000;

let sessionVersionCache: { value: number; expiresAt: number } | null = null;

/**
 * Remembers the auth row version so later saves skip a Neon round trip.
 * @example rememberSessionVersion(3) // void
 */
function rememberSessionVersion(value: number) {
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
    name: COOKIE,
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
    name: COOKIE,
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

/**
 * Derives a PBKDF2-SHA256 key for password hashing.
 * @example await derivePasswordKey(pw, salt, 210000) // ArrayBuffer
 */
async function derivePasswordKey(password: string, salt: Uint8Array, iterations: number) {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  // Copy into a fresh ArrayBuffer-backed view for DOM lib BufferSource typing.
  const saltBytes = new Uint8Array(salt);
  return crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBytes, iterations, hash: "SHA-256" },
    baseKey,
    256,
  );
}

/**
 * Hashes a password as pbkdf2:v1:iters:salt.hash.
 * @example await hashPassword("secret") // "pbkdf2:v1:210000:…"
 */
export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await derivePasswordKey(password, salt, PBKDF2_ITERATIONS);
  return `${HASH_PREFIX}${PBKDF2_ITERATIONS}:${bytesToB64(salt)}.${bytesToB64(bits)}`;
}

/**
 * Verifies a password against a stored PBKDF2 hash.
 * @example await verifyPasswordHash(pw, stored) // true
 */
export async function verifyPasswordHash(password: string, stored: string) {
  if (!stored.startsWith(HASH_PREFIX)) return false;
  const body = stored.slice(HASH_PREFIX.length);
  const colon = body.indexOf(":");
  if (colon < 1) return false;
  const iterations = Number(body.slice(0, colon));
  if (!Number.isFinite(iterations) || iterations < 1) return false;
  const rest = body.slice(colon + 1);
  const dot = rest.indexOf(".");
  if (dot < 1) return false;
  const salt = b64ToBytes(rest.slice(0, dot));
  const expected = b64ToBytes(rest.slice(dot + 1));
  const actual = new Uint8Array(await derivePasswordKey(password, salt, iterations));
  return timingSafeEqual(actual, expected);
}

/**
 * Constant-time plaintext password compare.
 * @example plaintextPasswordsMatch("a", "a") // true
 */
function plaintextPasswordsMatch(provided: string, expected: string) {
  const enc = new TextEncoder();
  const a = enc.encode(provided);
  const b = enc.encode(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Reads the stored password hash from CmsAuth.
 * @example await storedPasswordHash() // "pbkdf2:v1:…" | ""
 */
async function storedPasswordHash() {
  try {
    const row = await prisma.cmsAuth.findUnique({
      where: { id: "main" },
      select: { passwordHash: true },
    });
    return row?.passwordHash?.trim() || "";
  } catch {
    return "";
  }
}

/**
 * Checks provided password against stored hash or ADMIN_PASSWORD.
 * @example await passwordsMatch(pw) // true
 */
export async function passwordsMatch(provided: string) {
  const stored = await storedPasswordHash();
  if (stored) {
    return verifyPasswordHash(provided, stored);
  }
  const expected = adminPassword();
  if (!expected) return false;
  // Keep a digest work factor so length mismatches aren't free.
  if (provided.length !== expected.length) {
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(provided));
    return false;
  }
  return plaintextPasswordsMatch(provided, expected);
}

/**
 * Validates a new password; returns an error string or "".
 * @example validateNewPassword("short") // "Password must be…"
 */
export function validateNewPassword(password: string) {
  const trimmed = password;
  if (trimmed.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (/\s/.test(trimmed)) {
    return "Password cannot contain spaces.";
  }
  return "";
}

/**
 * Stores a new password hash and bumps sessionVersion.
 * @example await setStoredPassword("new-secret") // void
 */
export async function setStoredPassword(password: string) {
  const passwordHash = await hashPassword(password);
  const existing = await prisma.cmsAuth.findUnique({
    where: { id: "main" },
    select: { sessionVersion: true },
  });
  // Bump version so any existing cms_session cookies fail verifySessionCookie.
  const sessionVersion = (existing?.sessionVersion ?? 0) + 1;
  await prisma.cmsAuth.upsert({
    where: { id: "main" },
    create: {
      id: "main",
      passwordHash,
      sessionVersion,
      resetTokenHash: null,
      resetTokenExpiresAt: null,
    },
    update: {
      passwordHash,
      sessionVersion,
      resetTokenHash: null,
      resetTokenExpiresAt: null,
    },
  });
  rememberSessionVersion(sessionVersion);
}

/**
 * SHA-256 digest of value as URL-safe base64.
 * @example await sha256B64("token") // "…"
 */
async function sha256B64(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToB64(digest);
}

/**
 * Generates a 64-char hex reset token.
 * @example randomToken() // "a1b2c3…"
 */
function randomToken() {
  // Hex only — avoids email clients mangling -, _, +, or / in links.
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let out = "";
  for (const b of bytes) out += b.toString(16).padStart(2, "0");
  return out;
}

/**
 * Creates a one-time reset token (raw once; hash stored).
 * @example await createPasswordResetToken() // { token, expiresAt }
 */
export async function createPasswordResetToken() {
  const token = randomToken();
  const resetTokenHash = await sha256B64(token);
  const resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  await prisma.cmsAuth.upsert({
    where: { id: "main" },
    create: { id: "main", resetTokenHash, resetTokenExpiresAt },
    update: { resetTokenHash, resetTokenExpiresAt },
  });
  return { token, expiresAt: resetTokenExpiresAt };
}

/**
 * Validates a reset token against the stored hash/expiry.
 * @example await consumePasswordResetToken(token) // true
 */
export async function consumePasswordResetToken(token: string) {
  // Strip whitespace/newlines email clients sometimes insert into long links.
  const trimmed = token.replace(/\s+/g, "").trim();
  if (!trimmed) return false;
  const resetTokenHash = await sha256B64(trimmed);
  const row = await prisma.cmsAuth.findUnique({
    where: { id: "main" },
    select: { resetTokenHash: true, resetTokenExpiresAt: true },
  });
  if (!row?.resetTokenHash || !row.resetTokenExpiresAt) return false;
  if (row.resetTokenExpiresAt.getTime() < Date.now()) return false;
  const expected = row.resetTokenHash;
  if (expected.length !== resetTokenHash.length) return false;
  const a = new TextEncoder().encode(expected);
  const b = new TextEncoder().encode(resetTokenHash);
  return timingSafeEqual(a, b);
}

/**
 * Clears stored reset token fields.
 * @example await clearPasswordResetToken() // void
 */
export async function clearPasswordResetToken() {
  await prisma.cmsAuth.updateMany({
    where: { id: "main" },
    data: { resetTokenHash: null, resetTokenExpiresAt: null },
  });
}

/**
 * True when forgot-password IP is rate-limited (prod only).
 * @example await forgotPasswordRateLimited(ip) // false
 */
export async function forgotPasswordRateLimited(ip: string) {
  if (process.env.NODE_ENV !== "production") return false;
  return isRateLimited(RESET_SCOPE, ip || "unknown", RESET_MAX, RESET_WINDOW_MS);
}

/**
 * Records a forgot-password attempt (prod only).
 * @example await recordForgotPasswordAttempt(ip) // void
 */
export async function recordForgotPasswordAttempt(ip: string) {
  if (process.env.NODE_ENV !== "production") return;
  await recordRateLimitHit(RESET_SCOPE, ip || "unknown", RESET_MAX, RESET_WINDOW_MS);
}

/**
 * True when login IP is rate-limited (prod only).
 * @example await loginRateLimited(ip) // false
 */
export async function loginRateLimited(ip: string) {
  // Dev has no reliable client IP (often "unknown"), so a shared bucket
  // locked every local browser. Rate-limit only in production.
  if (process.env.NODE_ENV !== "production") return false;
  return isRateLimited(LOGIN_SCOPE, ip || "unknown", LOGIN_MAX, LOGIN_WINDOW_MS);
}

/**
 * Records a failed login attempt (prod only).
 * @example await recordFailedLogin(ip) // void
 */
export async function recordFailedLogin(ip: string) {
  if (process.env.NODE_ENV !== "production") return;
  await recordRateLimitHit(LOGIN_SCOPE, ip || "unknown", LOGIN_MAX, LOGIN_WINDOW_MS);
}

/**
 * Clears failed-login rate-limit hits for an IP.
 * @example await clearFailedLogins(ip) // void
 */
export async function clearFailedLogins(ip: string) {
  await clearRateLimit(LOGIN_SCOPE, ip || "unknown");
}

/**
 * Rejects cross-site mutating requests via Origin vs Host.
 * @example assertSameOrigin(req) // true
 */
export function assertSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export type CmsMutationGate =
  | { ok: true }
  | { ok: false; status: 401 | 403; error: string };

/**
 * Session + same-origin gate for CMS mutating routes.
 * @example await requireCmsMutation(req) // { ok: true }
 */
export async function requireCmsMutation(req: Request): Promise<CmsMutationGate> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!(await verifySessionCookie(token))) {
    return { ok: false, status: 401, error: "Unauthorized." };
  }
  if (!assertSameOrigin(req)) {
    return { ok: false, status: 403, error: "Forbidden." };
  }
  return { ok: true };
}

/**
 * Shared AI generate quota per IP.
 * @example await cmsAiRateLimited(ip) // false
 */
export async function cmsAiRateLimited(ip: string) {
  return rateLimited(AI_SCOPE, ip || "unknown", AI_MAX, AI_WINDOW_MS);
}

/**
 * CMS upload quota per IP.
 * @example await cmsUploadRateLimited(ip) // false
 */
export async function cmsUploadRateLimited(ip: string) {
  return rateLimited(UPLOAD_SCOPE, ip || "unknown", UPLOAD_MAX, UPLOAD_WINDOW_MS);
}
