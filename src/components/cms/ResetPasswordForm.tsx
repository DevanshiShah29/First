"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogoMark } from "@/components/Logo";
import { cmsResetPassword } from "@/lib/api-client";
import { IconEye, IconEyeOff } from "./wp-icons";

const MIN_LENGTH = 8;

function readTokenFromUrl() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("token")?.replace(/\s+/g, "") ?? "";
}

export function ResetPasswordForm({ token: initialToken }: { token: string }) {
  const router = useRouter();
  const [token, setToken] = useState(initialToken.replace(/\s+/g, ""));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const fromUrl = readTokenFromUrl();
    if (fromUrl) setToken(fromUrl);
  }, []);

  if (!token) {
    return (
      <div className="wp-login">
        <div className="wp-login-box">
          <h1>
            <Link href="/">
              <LogoMark className="h-14 w-14" />
              <span>Devanshi Shah</span>
            </Link>
          </h1>
          <div className="wp-notice is-error" role="alert">
            This reset link is missing or incomplete. Request a new one from the login page.
          </div>
          <p className="wp-login-nav">
            <Link href="/admin/login">← Back to login</Link>
          </p>
        </div>
      </div>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword.length < MIN_LENGTH) {
      setError(`Password must be at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setPending(true);
    const result = await cmsResetPassword({
      token: token.replace(/\s+/g, ""),
      newPassword,
      confirmPassword,
    });
    if (!result.ok) {
      setPending(false);
      setError(result.error || "Could not reset password.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="wp-login">
      <div className="wp-login-box">
        <h1>
          <Link href="/">
            <LogoMark className="h-14 w-14" />
            <span>Devanshi Shah</span>
          </Link>
        </h1>
        <p className="wp-login-lead">Choose a new CMS password.</p>
        {error ? (
          <div id="admin-reset-error" className="wp-notice is-error" role="alert">
            {error}
          </div>
        ) : null}
        <form className="wp-login-form" onSubmit={(e) => void onSubmit(e)}>
          <label htmlFor="admin-new-password">
            New password
            <span className="wp-password-field">
              <input
                id="admin-new-password"
                type={showPassword ? "text" : "password"}
                name="new-password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={MIN_LENGTH}
                size={20}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "admin-reset-error" : undefined}
              />
              <button
                type="button"
                className="wp-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <IconEyeOff /> : <IconEye />}
              </button>
            </span>
          </label>
          <label htmlFor="admin-confirm-password">
            Confirm password
            <span className="wp-password-field">
              <input
                id="admin-confirm-password"
                type={showPassword ? "text" : "password"}
                name="confirm-password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={MIN_LENGTH}
                size={20}
              />
            </span>
          </label>
          <div className="wp-login-submit">
            <button type="submit" className="wp-btn wp-btn-primary wp-btn-large" disabled={pending}>
              {pending ? "Saving…" : "Update Password"}
            </button>
          </div>
        </form>
        <p className="wp-login-nav">
          <Link href="/admin/login">← Back to login</Link>
        </p>
      </div>
    </div>
  );
}
