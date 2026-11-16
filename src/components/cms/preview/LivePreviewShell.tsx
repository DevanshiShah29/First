"use client";

// External dependencies
import { useId, useState } from "react";

// Application services & types
import type { ContentData } from "@/content/types";
import { PreviewChrome } from "./PreviewChrome";
import { PreviewFrame } from "./PreviewFrame";
import { PreviewScaler } from "./PreviewScaler";
import type { PreviewSection, PreviewThemeMode } from "./preview-messages";
import type { PreviewSeasonSummary, PreviewViewport } from "./preview-summary";

type ThemeChoice = PreviewThemeMode | "side-by-side";

/** Outer width of each simulated screen, in CSS pixels. */
const FRAME_WIDTHS: Record<PreviewViewport, number> = {
  desktop: 1280,
  tablet: 768,
  mobile: 360,
};

/**
 * Builds a short preview hostname from the site name.
 * @example previewHost("Devanshi Shah") // "devanshishah.dev"
 */
function previewHost(siteName: string) {
  const slug = siteName.toLowerCase().replace(/[^a-z0-9]+/g, "") || "portfolio";
  return `${slug}.dev`;
}

const VIEWPORTS: { id: PreviewViewport; label: string; icon: string }[] = [
  { id: "desktop", label: "Desktop", icon: "🖥" },
  { id: "tablet", label: "Tablet", icon: "📲" },
  { id: "mobile", label: "Mobile", icon: "📱" },
];

/**
 * CMS live preview toolbar, status, and framed section iframes.
 * Widths are simulated inside the iframe so media queries match the public site.
 * @example <LivePreviewShell data={data} dirty section="hero" onRendered={setSummary} />
 */
export function LivePreviewShell({
  data,
  dirty,
  section,
  onRendered,
  viewport: controlledViewport,
  onViewportChange,
}: {
  data: ContentData;
  dirty: boolean;
  section: PreviewSection;
  onRendered?: (summary: PreviewSeasonSummary) => void;
  /** Optional controlled viewport so the editor can discard counts from another width. */
  viewport?: PreviewViewport;
  onViewportChange?: (viewport: PreviewViewport) => void;
}) {
  const baseId = useId();
  const [theme, setTheme] = useState<ThemeChoice>("light");
  const [internalViewport, setInternalViewport] = useState<PreviewViewport>("desktop");
  const viewport = controlledViewport ?? internalViewport;

  /**
   * Keeps a controlled parent in sync while still working on its own.
   * @example changeViewport("mobile") // void
   */
  const changeViewport = (next: PreviewViewport) => {
    if (controlledViewport === undefined) setInternalViewport(next);
    onViewportChange?.(next);
  };

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
              {VIEWPORTS.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className={`wp-preview-mode-btn${viewport === entry.id ? " is-active" : ""}`}
                  aria-pressed={viewport === entry.id}
                  onClick={() => changeViewport(entry.id)}
                >
                  <span aria-hidden>{entry.icon}</span> {entry.label}
                </button>
              ))}
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
        className={`wp-live-stage${theme === "side-by-side" ? " is-split" : ""} is-${viewport}`}
      >
        {themes.map((mode) => (
          <PreviewScaler key={`${mode}-${viewport}`} frameWidth={FRAME_WIDTHS[viewport]}>
            <PreviewChrome variant={viewport} label={mode.toUpperCase()} address={address}>
              <PreviewFrame
                content={data}
                section={section}
                themeMode={mode}
                viewport={viewport}
                title={`${section} preview, ${mode}, ${viewport}`}
                onRendered={onRendered}
              />
            </PreviewChrome>
          </PreviewScaler>
        ))}
      </div>
    </div>
  );
}
