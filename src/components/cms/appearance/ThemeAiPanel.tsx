"use client";

import { Metabox } from "../components/Metabox";

/**
 * AI palette starter: writes a light + dark palette from a short description.
 * @example <ThemeAiPanel aiPrompt={prompt} onPrompt={setPrompt} … />
 */
export function ThemeAiPanel({
  aiPrompt,
  onPrompt,
  generating,
  generateError,
  onGenerate,
}: {
  aiPrompt: string;
  onPrompt: (value: string) => void;
  generating: boolean;
  generateError: string | null;
  onGenerate: () => void;
}) {
  return (
    <Metabox id="app_ai_theme" title="Create with AI" badge="start here">
      <div className="wp-theme-ai">
        <label className="wp-theme-ai-label" htmlFor="theme-ai-prompt">
          Describe the visual personality
        </label>
        <p className="wp-theme-ai-help">
          AI writes a matching light and dark palette. The live preview updates immediately — save to
          publish it.
        </p>
        <textarea
          id="theme-ai-prompt"
          className="wp-textarea"
          rows={3}
          value={aiPrompt}
          placeholder='e.g. "Whimsical, warm, creative and slightly vintage"'
          onChange={(event) => onPrompt(event.target.value)}
        />
        <div className="wp-theme-ai-actions">
          <button
            type="button"
            className="wp-btn wp-btn-ai"
            disabled={generating || aiPrompt.trim().length < 3}
            onClick={onGenerate}
          >
            <span className={`wp-btn-ai-icon${generating ? " is-spin" : ""}`} aria-hidden="true">
              ✦
            </span>
            {generating ? "Generating…" : "Generate palette"}
          </button>
          {!generating && aiPrompt.trim().length < 3 ? (
            <p className="wp-theme-ai-hint">Describe the vibe to enable generation.</p>
          ) : null}
        </div>
        {generateError ? <p className="wp-ai-generate-error">{generateError}</p> : null}
      </div>
    </Metabox>
  );
}
