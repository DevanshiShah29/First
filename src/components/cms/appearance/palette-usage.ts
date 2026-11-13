import type { ThemePalette } from "@/content/types";

/**
 * Share of painted palette color on the public site.
 * Measured from /, /craft, /memories, and /reading at desktop and phone widths.
 * Muted copy counts as text. Header and inset count as background.
 * Photos and other non-palette art are left out. Resting state only.
 */
export const PALETTE_USAGE_PERCENT: Record<keyof ThemePalette, number> = {
  background: 67.024,
  foreground: 3.741,
  card: 29.131,
  chip: 0,
  accentText: 0.099,
  accentHover: 0.004,
  badge: 0.001,
};

/** @example formatPaletteUsage(67.024) // "67%" */
export function formatPaletteUsage(percent: number): string {
  if (percent <= 0) return "0%";
  if (percent < 1) return "<1%";
  return `${Math.round(percent)}%`;
}
