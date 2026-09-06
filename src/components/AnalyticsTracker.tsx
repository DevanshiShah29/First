"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Sends a page-view beacon on public route changes (first-party + optional GA4).
 * @example <AnalyticsTracker />
 */
export function AnalyticsTracker() {
  const pathname = usePathname();
  const lastSent = useRef<{ path: string; at: number } | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/api")) {
      return;
    }

    const now = Date.now();
    if (
      lastSent.current &&
      lastSent.current.path === pathname &&
      now - lastSent.current.at < 1500
    ) {
      return;
    }
    lastSent.current = { path: pathname, at: now };

    const referrer =
      typeof document !== "undefined" && document.referrer ? document.referrer : "";

    void fetch("/api/analytics/collect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, referrer }),
      keepalive: true,
      credentials: "same-origin",
    }).catch(() => {
      // Analytics must never break the page.
    });

    const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
    if (gaId && typeof window.gtag === "function") {
      window.gtag("event", "page_view", {
        page_path: pathname,
        page_title: document.title,
        send_to: gaId,
      });
    }
  }, [pathname]);

  return null;
}
