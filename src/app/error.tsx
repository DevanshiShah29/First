"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Error UI for public route segments. The root layout uses global-error instead.
 * @example <Error error={err} retry={retry} />
 */
export default function Error({
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
    <main className="section-shell flex min-h-screen flex-col items-center justify-center py-24 text-center">
      <p className="kicker">Error</p>
      <h1 className="mt-4 text-3xl font-semibold text-foreground sm:text-4xl">This page didn’t load.</h1>
      <p className="mt-3 max-w-md text-muted">Something went wrong while opening this page. You can try again.</p>
      <button
        type="button"
        className="btn-primary mt-8 inline-flex items-center rounded-lg px-6 py-3 text-sm font-semibold"
        onClick={() => retry()}
      >
        Try again
      </button>
      <Link href="/" className="mt-4 text-sm text-accent-text underline underline-offset-4">
        Back home
      </Link>
    </main>
  );
}
