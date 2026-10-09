"use client";

import { Metabox } from "../components/Metabox";

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
    <Metabox id="app_ai_theme" title="Create with AI" badge="AI">
      <div className="wp-theme-ai">
        <label className="wp-theme-ai-label" htmlFor="theme-ai-prompt">
          Describe the visual personality
        </label>
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
            {generating ? "Generating…" : "Generate Theme"}
          </button>
        </div>
        {generateError ? <p className="wp-ai-generate-error">{generateError}</p> : null}
      </div>
    </Metabox>
  );
}
