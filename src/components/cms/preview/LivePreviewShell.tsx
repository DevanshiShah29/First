"use client";

// External dependencies
import { useId, useState } from "react";

// Application services & types
import type { ContentData } from "@/content/types";
import { PreviewChrome } from "./PreviewChrome";
import { PreviewFrame } from "./PreviewFrame";
import type { PreviewSection, PreviewThemeMode } from "./preview-messages";

type ThemeChoice = PreviewThemeMode | "side-by-side";
type ViewportChoice = "desktop" | "mobile";

/**
 * Builds a short preview hostname from the site name.
 * @example previewHost("Devanshi Shah") // "devanshishah.dev"
 */
function previewHost(siteName: string) {
  const slug = siteName.toLowerCase().replace(/[^a-z0-9]+/g, "") || "portfolio";
  return `${slug}.dev`;
}

/**
 * CMS live preview toolbar, status, and framed section iframes.
 * @example <LivePreviewShell data={data} dirty section="hero" />
 */
export function LivePreviewShell({
  data,
  dirty,
  section,
}: {
  data: ContentData;
  dirty: boolean;
  section: PreviewSection;
}) {
  const baseId = useId();
  const [theme, setTheme] = useState<ThemeChoice>("light");
  const [viewport, setViewport] = useState<ViewportChoice>("desktop");

  const host = previewHost(data.site.name);
  const address = `https://${host}`;
  const themes: PreviewThemeMode[] = theme === "side-by-side" ? ["light", "dark"] : [theme];

  return (
    <div className="wp-live-preview">
      <div className="wp-preview-toolbar wp-live-preview-toolbar">
        <div className="wp-live-preview-controls">
          <div className="wp-live-control-group" role="group" aria-labelledby={`${baseId}-theme`}>
            <span id={`${baseId}-theme`} className="wp-live-control-label">
              Theme
            </span>
            <div className="wp-preview-modes">
              <button
                type="button"
                className={`wp-preview-mode-btn${theme === "light" ? " is-active" : ""}`}
                aria-pressed={theme === "light"}
                onClick={() => setTheme("light")}
              >
                <span aria-hidden>☀️</span> Light Mode
              </button>
              <button
                type="button"
                className={`wp-preview-mode-btn${theme === "dark" ? " is-active" : ""}`}
                aria-pressed={theme === "dark"}
                onClick={() => setTheme("dark")}
              >
                <span aria-hidden>🌙</span> Dark Mode
              </button>
              <button
                type="button"
                className={`wp-preview-mode-btn${theme === "side-by-side" ? " is-active" : ""}`}
                aria-pressed={theme === "side-by-side"}
                onClick={() => setTheme("side-by-side")}
              >
                <span aria-hidden>🌓</span> Side-by-Side
              </button>
            </div>
          </div>

          <div className="wp-live-control-group" role="group" aria-labelledby={`${baseId}-viewport`}>
            <span id={`${baseId}-viewport`} className="wp-live-control-label">
              Viewport
            </span>
            <div className="wp-preview-modes">
              <button
                type="button"
                className={`wp-preview-mode-btn${viewport === "desktop" ? " is-active" : ""}`}
                aria-pressed={viewport === "desktop"}
                onClick={() => setViewport("desktop")}
              >
                <span aria-hidden>🖥</span> Desktop
              </button>
              <button
                type="button"
                className={`wp-preview-mode-btn${viewport === "mobile" ? " is-active" : ""}`}
                aria-pressed={viewport === "mobile"}
                onClick={() => setViewport("mobile")}
              >
                <span aria-hidden>📱</span> Mobile
              </button>
            </div>
          </div>
        </div>

        <p
          className={`wp-preview-status${dirty ? " is-dirty" : " is-clean"}`}
          role="status"
          aria-live="polite"
        >
          {dirty ? "● Previewing unsaved changes" : "✓ Preview matches published version"}
        </p>
      </div>

      <div
        className={`wp-live-stage${theme === "side-by-side" ? " is-split" : ""}${
          viewport === "mobile" ? " is-mobile" : " is-desktop"
        }`}
      >
        {themes.map((mode) => (
          <PreviewChrome
            key={`${mode}-${viewport}`}
            variant={viewport}
            label={mode.toUpperCase()}
            address={address}
          >
            <PreviewFrame
              content={data}
              section={section}
              themeMode={mode}
              viewport={viewport}
              title={`${section} preview, ${mode}, ${viewport}`}
            />
          </PreviewChrome>
        ))}
      </div>
    </div>
  );
}
