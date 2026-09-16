"use client";

// External dependencies
import { useEffect, useMemo, useState, type ReactNode } from "react";

export type AiVariantField<T> = {
  key: string;
  label: string;
  render: (variant: T) => ReactNode;
};

/**
 * Builds a field→variantIndex map seeded from one option.
 * @example defaultFieldSources(fields, 0) // { about: 0, … }
 */
function defaultFieldSources<T>(fields: AiVariantField<T>[], variantIndex: number): Record<string, number> {
  const next: Record<string, number> = {};
  for (const field of fields) next[field.key] = variantIndex;
  return next;
}

/**
 * Renders selectable AI variant cards with optional per-field mixing.
 * Click a card to take the whole package, or click individual fields to mix across options.
 * @example <AiVariantPicker variants={…} fields={…} onUse={…} onDismiss={…} />
 */
export function AiVariantPicker<T>({
  variants,
  selectedIndex,
  onSelect,
  renderVariant,
  fields,
  onUse,
  onDismiss,
  busy,
}: {
  variants: T[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  /** Used when `fields` is omitted (whole-card preview). */
  renderVariant?: (variant: T, index: number) => ReactNode;
  /** When set, enables per-field picks across options. */
  fields?: AiVariantField<T>[];
  /** Receives field→variantIndex map when mixing; otherwise may be ignored. */
  onUse: (fieldSources: Record<string, number>) => void;
  onDismiss?: () => void;
  busy?: boolean;
}) {
  const fieldList = fields ?? [];
  const mixMode = fieldList.length > 0;
  const fieldKeySig = fieldList.map((f) => f.key).join("|");
  const [fieldSources, setFieldSources] = useState<Record<string, number>>(() =>
    defaultFieldSources(fieldList, selectedIndex),
  );

  // Re-seed picks only when a new generation arrives — not when selectedIndex changes
  // from per-field clicks (that would wipe a mix).
  useEffect(() => {
    if (!mixMode) return;
    setFieldSources(defaultFieldSources(fieldList, 0));
  }, [mixMode, variants, fieldKeySig]); // eslint-disable-line react-hooks/exhaustive-deps -- fieldList rebuilt each render; fieldKeySig is the stable signal

  const mixSummary = useMemo(() => {
    if (!mixMode) return null;
    const used = new Set(Object.values(fieldSources));
    if (used.size <= 1) return null;
    return `Mixing fields from ${used.size} options`;
  }, [fieldSources, mixMode]);

  if (variants.length === 0) return null;

  /**
   * Selects an entire option package for all fields.
   * @example selectWhole(1) // void
   */
  function selectWhole(index: number) {
    onSelect(index);
    if (mixMode) setFieldSources(defaultFieldSources(fieldList, index));
  }

  /**
   * Pins one field to a specific option without changing the rest.
   * @example pickField("about", 0) // void
   */
  function pickField(fieldKey: string, variantIndex: number) {
    setFieldSources((prev) => ({ ...prev, [fieldKey]: variantIndex }));
    onSelect(variantIndex);
  }

  return (
    <div className="wp-ai-variants">
      <p className="wp-ai-variants-lede">
        {mixMode
          ? "Click a card header to use the whole package, or click individual fields to mix across options."
          : "Pick a version to apply. Use Generate with AI again for a fresh set."}
        {mixSummary ? (
          <>
            {" "}
            <strong>{mixSummary}.</strong>
          </>
        ) : null}
      </p>
      <div className="wp-ai-variant-grid" role="listbox" aria-label="AI variants">
        {variants.map((variant, index) => {
          const selected = mixMode
            ? Object.values(fieldSources).includes(index)
            : index === selectedIndex;
          const allFromHere =
            mixMode && fieldList.every((field) => fieldSources[field.key] === index);
          return (
            <div
              key={index}
              role="option"
              aria-selected={allFromHere || (!mixMode && selected)}
              className={`wp-ai-variant-card${selected ? " is-selected" : ""}${
                allFromHere ? " is-all-selected" : ""
              }`}
            >
              <button
                type="button"
                className="wp-ai-variant-card-select"
                onClick={() => selectWhole(index)}
                disabled={busy}
              >
                <span className="wp-ai-variant-badge">Option {index + 1}</span>
                {!mixMode && renderVariant ? (
                  <div className="wp-ai-variant-body">{renderVariant(variant, index)}</div>
                ) : (
                  <span className="wp-ai-variant-use-all">Use all fields from this option</span>
                )}
              </button>
              {mixMode ? (
                <div className="wp-ai-variant-body">
                  <div className="wp-ai-variant-fields">
                    {fieldList.map((field) => {
                      const picked = fieldSources[field.key] === index;
                      return (
                        <button
                          key={field.key}
                          type="button"
                          className={`wp-ai-field-pick${picked ? " is-picked" : ""}`}
                          onClick={() => pickField(field.key, index)}
                          disabled={busy}
                          aria-pressed={picked}
                        >
                          <span className="wp-ai-field-pick-head">
                            <span className="wp-ai-field-pick-label">{field.label}</span>
                            <span className="wp-ai-field-pick-hint">
                              {picked ? "Using this" : "Use this field"}
                            </span>
                          </span>
                          <span className="wp-ai-field-pick-value">{field.render(variant)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="wp-ai-variant-actions">
        <button
          type="button"
          className="wp-btn wp-btn-primary"
          onClick={() => onUse(mixMode ? fieldSources : { _: selectedIndex })}
          disabled={busy || selectedIndex < 0 || selectedIndex >= variants.length}
        >
          Use this version
        </button>
        {onDismiss ? (
          <button type="button" className="wp-btn" onClick={onDismiss} disabled={busy}>
            Dismiss
          </button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Renders a single AI suggestion awaiting approve / dismiss.
 * @example <AiSuggestPreview title="Vue.js" meta="Frontend" onApprove={…} onDismiss={…} />
 */
export function AiSuggestPreview({
  title,
  meta,
  detail,
  onApprove,
  onDismiss,
  busy,
}: {
  title: string;
  meta?: string;
  detail?: ReactNode;
  onApprove: () => void;
  onDismiss?: () => void;
  busy?: boolean;
}) {
  return (
    <div className="wp-ai-suggest">
      <p className="wp-ai-suggest-kicker">Suggested addition</p>
      <div className="wp-ai-suggest-card">
        <div className="wp-ai-suggest-copy">
          <strong className="wp-ai-suggest-title">{title}</strong>
          {meta ? <span className="wp-ai-suggest-meta">{meta}</span> : null}
          {detail ? <div className="wp-ai-suggest-detail">{detail}</div> : null}
        </div>
        <div className="wp-ai-suggest-actions">
          <button type="button" className="wp-btn wp-btn-primary" onClick={onApprove} disabled={busy}>
            Approve
          </button>
          {onDismiss ? (
            <button type="button" className="wp-btn" onClick={onDismiss} disabled={busy}>
              Dismiss
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
