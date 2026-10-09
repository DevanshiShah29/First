import { prisma } from "@/server/prisma";
import { bytesToB64, timingSafeEqual } from "./cms-auth-codec";

const RESET_TOKEN_TTL_MS = 2 * 60 * 60 * 1000;

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
