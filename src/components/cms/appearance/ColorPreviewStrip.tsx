"use client";

import { THEME_PALETTE_FIELDS, type ThemePalette } from "@/content/types";

/**
 * Renders an 8-swatch mini preview of a theme palette.
 * @example <ColorPreviewStrip palette={light} />
 */
export function ColorPreviewStrip({
  palette,
  size = "md",
}: {
  palette: ThemePalette;
  size?: "sm" | "md";
}) {
  return (
    <div
      className={`wp-theme-swatches${size === "sm" ? " is-sm" : ""}`}
      aria-hidden="true"
    >
      {THEME_PALETTE_FIELDS.map((field) => (
        <span
          key={field.key}
          className="wp-theme-swatch"
          title={`${field.label}: ${palette[field.key]}`}
          style={{ background: palette[field.key] }}
        />
      ))}
    </div>
  );
}
