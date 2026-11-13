"use client";

import { useRouter } from "next/navigation";

/**
 * Re-requests the current route after a recoverable failure.
 * @example <RouteRetry />
 */
export function RouteRetry() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="btn-primary mt-8 inline-flex items-center rounded-lg px-6 py-3 text-sm font-semibold"
      onClick={() => router.refresh()}
    >
      Try again
    </button>
  );
}
