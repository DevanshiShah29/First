import { cookies } from "next/headers";
import { clearRateLimit, isRateLimited, rateLimited, recordRateLimitHit } from "@/server/rate-limit";
import { CMS_SESSION_COOKIE, verifySessionCookie } from "./cms-session";

const LOGIN_SCOPE = "cms-login";
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_MAX = 5;
const RESET_SCOPE = "cms-forgot";
const RESET_WINDOW_MS = 60 * 60 * 1000;
const RESET_MAX = 3;
const AI_SCOPE = "cms-ai";
const AI_WINDOW_MS = 10 * 60 * 1000;
const AI_MAX = 20;
const UPLOAD_SCOPE = "cms-upload";
const UPLOAD_WINDOW_MS = 10 * 60 * 1000;
const UPLOAD_MAX = 40;

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
  const token = (await cookies()).get(CMS_SESSION_COOKIE)?.value;
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
