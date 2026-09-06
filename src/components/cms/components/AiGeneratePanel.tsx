"use client";

// External dependencies
import type { ReactNode } from "react";

export type AiBasisItem = {
  label: string;
  /** When false, chip shows as missing/optional. Defaults to true. */
  ready?: boolean;
  optional?: boolean;
};

/**
 * Renders a numbered AI assist card section.
 * @example <AiFormSection step={1} title="Sources">…</AiFormSection>
 */
export function AiFormSection({
  step,
  title,
  description,
  children,
  tone = "default",
}: {
  step: number;
  title: string;
  description?: string;
  children: ReactNode;
  tone?: "default" | "output";
}) {
  return (
    <section className={`wp-ai-card${tone === "output" ? " is-output" : ""}`}>
      <header className="wp-ai-card-head">
        <span className="wp-ai-card-step" aria-hidden="true">
          {step}
        </span>
        <div className="wp-ai-card-titles">
          <h3 className="wp-ai-card-title">{title}</h3>
          {description ? <p className="wp-ai-card-desc">{description}</p> : null}
        </div>
      </header>
      <div className="wp-ai-card-body">{children}</div>
    </section>
  );
}

/**
 * Renders AI generate button with basis chips.
 * @example <AiGeneratePanel fills="blurb & tags" onGenerate={…} … />
 */
export function AiGeneratePanel({
  basisItems,
  fills,
  generating,
  error,
  onGenerate,
  disabled,
}: {
  basisItems: AiBasisItem[];
  fills: string;
  generating: boolean;
  error: string | null;
  onGenerate: () => void;
  disabled?: boolean;
}) {
  const requiredMissing = basisItems.some((item) => !item.optional && item.ready === false);

  return (
    <div className={`wp-ai-generate${generating ? " is-generating" : ""}`}>
      <div className="wp-ai-generate-top">
        <div className="wp-ai-generate-copy">
          <p className="wp-ai-generate-kicker">AI assist</p>
          <p className="wp-ai-generate-lede">
            Writes <strong>{fills}</strong> from the sources above. Edit freely after.
          </p>
        </div>
        <button
          type="button"
          className="wp-btn wp-btn-ai"
          onClick={onGenerate}
          disabled={disabled || generating}
        >
          <span className={`wp-btn-ai-icon${generating ? " is-spin" : ""}`} aria-hidden="true">
            ✦
          </span>
          {generating ? "Generating…" : "Generate with AI"}
        </button>
      </div>

      <div className="wp-ai-basis">
        <span className="wp-ai-basis-label">Based on</span>
        <ul className="wp-ai-basis-list">
          {basisItems.map((item) => {
            const ready = item.ready !== false;
            const state = ready ? "is-ready" : item.optional ? "is-optional" : "is-missing";
            return (
              <li key={item.label} className={state} title={ready ? "Ready" : item.optional ? "Optional" : "Add this first"}>
                <span className="wp-ai-basis-dot" aria-hidden="true" />
                {item.label}
              </li>
            );
          })}
        </ul>
      </div>

      {requiredMissing ? (
        <p className="wp-ai-generate-hint">Add the required sources above, then generate.</p>
      ) : null}
      {error ? <p className="wp-ai-generate-error">{error}</p> : null}
    </div>
  );
}
