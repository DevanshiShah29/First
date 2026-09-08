"use client";

// External dependencies
import type { ReactNode } from "react";

/**
 * Wraps preview content in desktop browser or mobile device chrome.
 * @example <PreviewChrome variant="mobile" label="LIGHT">{children}</PreviewChrome>
 */
export function PreviewChrome({
  variant,
  label,
  address,
  children,
}: {
  variant: "desktop" | "mobile";
  label: string;
  address: string;
  children: ReactNode;
}) {
  if (variant === "mobile") {
    const host = address.replace(/^https?:\/\//, "");
    return (
      <div className="wp-live-phone-wrap">
        <span className="wp-live-phone-mode">{label}</span>
        <div className="wp-live-phone">
          <span className="wp-live-phone-btn is-silent" aria-hidden />
          <span className="wp-live-phone-btn is-vol-up" aria-hidden />
          <span className="wp-live-phone-btn is-vol-down" aria-hidden />
          <span className="wp-live-phone-btn is-power" aria-hidden />

          <div className="wp-live-phone-bezel">
            <div className="wp-live-phone-island" aria-hidden>
              <span className="wp-live-phone-island-cam" />
            </div>

            <div className="wp-live-phone-status" aria-hidden>
              <span className="wp-live-phone-time">9:41</span>
              <span className="wp-live-phone-status-icons">
                <span className="wp-live-phone-signal" title="Cellular">
                  <span /><span /><span /><span />
                </span>
                <span className="wp-live-phone-wifi" title="Wi‑Fi" />
                <span className="wp-live-phone-battery" title="Battery" />
              </span>
            </div>

            <div className="wp-live-phone-browser" aria-hidden>
              <div className="wp-live-phone-url">
                <span className="wp-live-phone-lock">🔒</span>
                <span className="wp-live-phone-host">{host}</span>
              </div>
            </div>

            <div className="wp-live-phone-screen">{children}</div>

            <div className="wp-live-phone-home" aria-hidden />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wp-live-browser">
      <div className="wp-mockup-bar wp-live-browser-bar">
        <div className="wp-mockup-dots" aria-hidden>
          <span className="dot red" />
          <span className="dot yellow" />
          <span className="dot green" />
        </div>
        <div className="wp-mockup-address wp-live-browser-address">{address}</div>
        <span className="wp-mockup-badge">{label}</span>
      </div>
      <div className="wp-live-browser-body">{children}</div>
    </div>
  );
}
