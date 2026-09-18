"use client";

import { THEME_PALETTE_FIELDS, type ThemePalette } from "@/content/types";
import { HexColorInput } from "../fields";

/**
 * Editable light + dark palettes shown side by side.
 * @example <EditablePalette light={draft.light} dark={draft.dark} onChange={update} />
 */
export function EditablePalette({
  light,
  dark,
  onChange,
}: {
  light: ThemePalette;
  dark: ThemePalette;
  onChange: (mode: "light" | "dark", next: ThemePalette) => void;
}) {
  return (
    <div className="wp-palette-editor">
      <div className="wp-palette-columns">
        <PaletteColumn
          title="Light palette"
          palette={light}
          onChange={(next) => onChange("light", next)}
        />
        <PaletteColumn
          title="Dark palette"
          palette={dark}
          onChange={(next) => onChange("dark", next)}
        />
      </div>
    </div>
  );
}

/**
 * One mode's 8-color palette rows with swatch + hex + picker.
 */
function PaletteColumn({
  title,
  palette,
  onChange,
}: {
  title: string;
  palette: ThemePalette;
  onChange: (next: ThemePalette) => void;
}) {
  return (
    <section className="wp-palette-column" aria-label={title}>
      <h3 className="wp-palette-column-title">{title}</h3>
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
    </section>
  );
}
