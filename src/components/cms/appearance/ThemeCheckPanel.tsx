"use client";

import type { PaletteIssue } from "@/lib/theme-contrast";

/**
 * Contrast / hierarchy tool for the palette currently being edited.
 * @example <ThemeCheckPanel paletteMode={mode} onPaletteMode={setMode} … />
 */
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
    <section className="wp-theme-check" aria-labelledby="theme-check-title">
      <h3 className="wp-theme-check-title" id="theme-check-title">
        Palette check
      </h3>
      <p className="wp-theme-section-lede">
        Checks the palette you are editing for contrast, hierarchy, and weak hovers. Improve with AI
        fixes the issues it finds and updates the preview right away.
      </p>
      <div className="wp-theme-check-toolbar">
        <span className="wp-theme-check-mode-label">Palette</span>
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
    </section>
  );
}
