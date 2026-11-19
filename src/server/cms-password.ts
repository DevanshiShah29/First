import { prisma } from "@/server/prisma";
import { b64ToBytes, bytesToB64, timingSafeEqual } from "./cms-auth-codec";
import { MIN_PASSWORD_LENGTH, adminPassword } from "./cms-auth-config";
import { rememberSessionVersion } from "./cms-session";

const HASH_PREFIX = "pbkdf2:v1:";
const PBKDF2_ITERATIONS = 210_000;

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
  if (stored && (await verifyPasswordHash(provided, stored))) {
    return true;
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
