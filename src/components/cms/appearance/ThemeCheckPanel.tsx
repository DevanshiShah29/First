"use client";

import type { PaletteIssue } from "@/lib/theme-contrast";
import { Metabox } from "../components/Metabox";

export function ThemeCheckPanel({
  paletteMode,
  onPaletteMode,
  onCheck,
  checking,
  onImprove,
  issues,
  checkError,
  checkSummary,
  onApplyAll,
  onApplyIssue,
}: {
  paletteMode: "light" | "dark";
  onPaletteMode: (mode: "light" | "dark") => void;
  onCheck: () => void;
  checking: boolean;
  onImprove: () => void;
  issues: PaletteIssue[];
  checkError: string | null;
  checkSummary: string | null;
  onApplyAll: () => void;
  onApplyIssue: (issue: PaletteIssue) => void;
}) {
  return (
    <Metabox id="app_palette_check" title="AI Palette Check" badge="optional">
      <p className="wp-theme-section-lede">
        Check a palette for contrast, similarity, weak hovers, and hierarchy.
      </p>
      <div className="wp-palette-mode-toggle" role="group" aria-label="Palette to check">
        <button
          type="button"
          className={`wp-preview-mode-btn${paletteMode === "light" ? " is-active" : ""}`}
          aria-pressed={paletteMode === "light"}
          onClick={() => onPaletteMode("light")}
        >
          Light
        </button>
        <button
          type="button"
          className={`wp-preview-mode-btn${paletteMode === "dark" ? " is-active" : ""}`}
          aria-pressed={paletteMode === "dark"}
          onClick={() => onPaletteMode("dark")}
        >
          Dark
        </button>
      </div>
      <div className="wp-theme-check-actions">
        <button type="button" className="wp-btn" onClick={onCheck}>
          Check {paletteMode} palette
        </button>
        <button type="button" className="wp-btn wp-btn-ai" disabled={checking} onClick={onImprove}>
          <span className={`wp-btn-ai-icon${checking ? " is-spin" : ""}`} aria-hidden="true">
            ✦
          </span>
          {checking ? "Improving…" : `Improve ${paletteMode} palette`}
        </button>
        {issues.length > 0 ? (
          <button type="button" className="wp-btn" onClick={onApplyAll}>
            Apply all suggestions
          </button>
        ) : null}
      </div>
      {checkError ? <p className="wp-ai-generate-error">{checkError}</p> : null}
      {checkSummary ? <p className="wp-theme-check-summary">{checkSummary}</p> : null}
      {issues.length > 0 ? (
        <ul className="wp-theme-issues">
          {issues.map((issue) => (
            <li key={issue.id} className="wp-theme-issue">
              <div className="wp-theme-issue-copy">
                <p className="wp-theme-issue-msg">{issue.message}</p>
                <p className="wp-theme-issue-suggest">
                  Suggested:{" "}
                  <span className="wp-theme-issue-hex" style={{ background: issue.current }}>
                    {issue.current}
                  </span>{" "}
                  →{" "}
                  <span className="wp-theme-issue-hex" style={{ background: issue.suggested }}>
                    {issue.suggested}
                  </span>
                </p>
              </div>
              <button type="button" className="wp-btn wp-btn-small" onClick={() => onApplyIssue(issue)}>
                Apply suggestion
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </Metabox>
  );
}
