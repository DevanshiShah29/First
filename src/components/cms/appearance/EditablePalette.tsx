"use client";

import { THEME_PALETTE_FIELDS, type ThemePalette } from "@/content/types";
import { HexColorInput } from "../fields";

/**
 * Editable 8-color palette rows with swatch + hex + picker.
 * @example <EditablePalette palette={draft} onChange={setDraft} />
 */
export function EditablePalette({
  palette,
  onChange,
  mode,
  onModeChange,
}: {
  palette: ThemePalette;
  onChange: (next: ThemePalette) => void;
  mode: "light" | "dark";
  onModeChange: (mode: "light" | "dark") => void;
}) {
  return (
    <div className="wp-palette-editor">
      <div className="wp-palette-mode-toggle" role="group" aria-label="Palette mode">
        <button
          type="button"
          className={`wp-preview-mode-btn${mode === "light" ? " is-active" : ""}`}
          aria-pressed={mode === "light"}
          onClick={() => onModeChange("light")}
        >
          Light palette
        </button>
        <button
          type="button"
          className={`wp-preview-mode-btn${mode === "dark" ? " is-active" : ""}`}
          aria-pressed={mode === "dark"}
          onClick={() => onModeChange("dark")}
        >
          Dark palette
        </button>
      </div>

      <div className="wp-palette-rows">
        {THEME_PALETTE_FIELDS.map((field) => (
          <div key={field.key} className="wp-palette-row">
            <div
              className="wp-palette-row-swatch"
              style={{ background: palette[field.key] }}
              title={palette[field.key]}
              aria-hidden="true"
            />
            <div className="wp-palette-row-meta">
              <span className="wp-palette-row-name">{field.label}</span>
              <span className="wp-palette-row-key">{field.key}</span>
            </div>
            <div className="wp-palette-row-input">
              <HexColorInput
                value={palette[field.key]}
                onChange={(value) => onChange({ ...palette, [field.key]: value })}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
