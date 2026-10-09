import type { ApiResponse } from "@/lib/api-response";

/**
 * Authenticate CMS session.
 * @example await cmsLogin("secret") // { ok: true }
 */
export async function cmsLogin(password: string): Promise<ApiResponse> {
  try {
    const res = await fetch("/api/cms/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const body = (await res.json().catch(() => ({}))) as { error?: string };

    if (!res.ok) {
      return {
        ok: false,
        error: body.error || "Could not log in.",
      };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Could not log in. Network error.",
    };
  }
}

/**
 * Destroy CMS session.
 * @example await cmsLogout() // undefined
 */
export async function cmsLogout(): Promise<void> {
  await fetch("/api/cms/logout", { method: "POST" });
}

/**
 * Request a CMS password-reset email.
 * @example await cmsForgotPassword() // { ok: true, data: { message } }
 */
export async function cmsForgotPassword(): Promise<ApiResponse<{ message?: string }>> {
  try {
    const res = await fetch("/api/cms/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const body = (await res.json().catch(() => ({}))) as { error?: string; message?: string };

    if (!res.ok) {
      return {
        ok: false,
        error: body.error || "Could not send reset email.",
      };
    }

    return { ok: true, data: { message: body.message } };
  } catch {
    return {
      ok: false,
      error: "Could not send reset email. Network error.",
    };
  }
}

/**
 * Complete CMS password reset with a one-time token.
 * @example await cmsResetPassword({ token, newPassword, confirmPassword }) // { ok: true }
 */
export async function cmsResetPassword(input: {
  token: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<ApiResponse> {
  try {
    const res = await fetch("/api/cms/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const body = (await res.json().catch(() => ({}))) as { error?: string };

    if (!res.ok) {
      return {
        ok: false,
        error: body.error || "Could not reset password.",
      };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Could not reset password. Network error.",
    };
  }
}

/**
 * Change CMS login password (requires session).
 * @example await cmsChangePassword({ currentPassword, newPassword, confirmPassword }) // { ok: true }
 */
export async function cmsChangePassword(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<ApiResponse> {
  try {
    const res = await fetch("/api/cms/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const body = (await res.json().catch(() => ({}))) as { error?: string };

    if (!res.ok) {
      return {
        ok: false,
        error: body.error || "Could not change password.",
      };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Could not change password. Network error.",
    };
  }
}
