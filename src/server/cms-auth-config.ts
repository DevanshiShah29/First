import { prisma } from "@/server/prisma";

export const MIN_PASSWORD_LENGTH = 8;

/**
 * Returns CMS_SECRET, or ADMIN_PASSWORD in non-production.
 * @example secret() // "my-cms-secret"
 */
export function secret() {
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
