"use client";

// External dependencies
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Application services & types
import { cmsForgotPassword, cmsLogin } from "@/lib/cms-client";

// UI components
import { LogoMark } from "@/components/Logo";

// Icons
import { IconEye, IconEyeOff } from "./wp-icons";

export function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [forgotPending, setForgotPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    setNotice("");
    const result = await cmsLogin(password);
    if (!result.ok) {
      setPending(false);
      setError(result.error || "Could not log in.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  async function onForgotPassword() {
    setForgotPending(true);
    setError("");
    setNotice("");
    const result = await cmsForgotPassword();
    setForgotPending(false);
    if (!result.ok) {
      setError(result.error || "Could not send reset email.");
      return;
    }
    setNotice(result.data?.message || "Reset link sent to your email.");
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
        {!configured ? (
          <div className="wp-notice is-info">
            Set <code>ADMIN_PASSWORD</code> and <code>CMS_SECRET</code> in{" "}
            <code>.env.local</code>, then restart the server.
          </div>
        ) : null}
        {error ? (
          <div id="admin-login-error" className="wp-notice is-error" role="alert">
            {error}
          </div>
        ) : null}
        {notice && !error ? (
          <div id="admin-login-notice" className="wp-notice is-success" role="status">
            {notice}
          </div>
        ) : null}
        <form className="wp-login-form" onSubmit={onSubmit}>
          <label htmlFor="admin-password">
            Password
            <span className="wp-password-field">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                size={20}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "admin-login-error" : notice ? "admin-login-notice" : undefined}
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
          <div className="wp-login-actions">
            <button
              type="button"
              className="wp-login-forgot"
              onClick={() => void onForgotPassword()}
              disabled={forgotPending || !configured}
            >
              {forgotPending ? "Sending…" : "Forgot password?"}
            </button>
            <button type="submit" className="wp-btn wp-btn-primary wp-btn-large" disabled={pending || !configured}>
              {pending ? "Logging in…" : "Log In"}
            </button>
          </div>
        </form>
        <p className="wp-login-nav">
          <Link href="/">← Go to site</Link>
        </p>
      </div>
    </div>
  );
}
