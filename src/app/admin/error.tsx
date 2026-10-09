"use client";

import { useEffect } from "react";

/**
 * Error UI inside the admin layout.
 * @example <AdminError error={err} retry={retry} />
 */
export default function AdminError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="wp-wrap">
      <h1 className="wp-screen-title">Something went wrong</h1>
      <p className="wp-sub">The dashboard couldn’t open this screen.</p>
      <button type="button" className="wp-btn wp-btn-primary" onClick={() => retry()}>
        Try again
      </button>
    </main>
  );
}
