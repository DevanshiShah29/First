"use client";

import { THEME_PALETTE_FIELDS, type ThemePalette } from "@/content/types";
import { HexColorInput } from "../fields";
import { formatPaletteUsage, PALETTE_USAGE_PERCENT } from "./palette-usage";

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
 * One palette color: swatch, name, key, and hex field.
 * @example <PaletteColorRow label="Background" fieldKey="background" value="#fff" onChange={set} />
 */
export function PaletteColorRow({
  label,
  fieldKey,
  value,
  onChange,
  usage,
}: {
  label: string;
  fieldKey: string;
  value: string;
  onChange: (value: string) => void;
  /** Share of this role on the public site, 0–100. */
  usage?: number;
}) {
  const usageLabel = usage == null ? null : formatPaletteUsage(usage);
  return (
    <div className="wp-palette-row">
      <div
        className="wp-palette-row-swatch"
        style={{ background: value }}
        title={value}
        aria-hidden="true"
      />
      <div className="wp-palette-row-meta">
        <span className="wp-palette-row-name">
          {label}
          {usageLabel ? (
            <span
              className="wp-palette-row-usage"
              title="Share of this color on the public site, compared with the other palette colors"
            >
              {` (${usageLabel})`}
            </span>
          ) : null}
        </span>
        <span className="wp-palette-row-key">{fieldKey}</span>
      </div>
      <div className="wp-palette-row-input">
        <HexColorInput
          value={value}
          onChange={onChange}
        />
      </div>
    </div>
  );
}

/**
 * One mode's palette rows with swatch, usage, and hex field.
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
          <PaletteColorRow
            key={field.key}
            label={field.label}
            fieldKey={field.key}
            value={palette[field.key]}
            usage={PALETTE_USAGE_PERCENT[field.key]}
            onChange={(value) => onChange({ ...palette, [field.key]: value })}
          />
        ))}
      </div>
    </section>
  );
}
