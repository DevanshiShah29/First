"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogoMark } from "@/components/Logo";

export function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    const res = await fetch("/api/cms/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setPending(false);
      setError(body.error || "Could not log in.");
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
        {!configured ? (
          <div className="wp-notice is-info">
            Set <code>ADMIN_PASSWORD</code> in <code>.env.local</code> and restart the server.
          </div>
        ) : null}
        {error ? (
          <div id="admin-login-error" className="wp-notice is-error" role="alert">
            {error}
          </div>
        ) : null}
        <form className="wp-login-form" onSubmit={onSubmit}>
          <label htmlFor="admin-password">
            Password
            <input
              id="admin-password"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              size={20}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "admin-login-error" : undefined}
            />
          </label>
          <div className="wp-login-submit">
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
