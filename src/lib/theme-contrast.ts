import { THEME_PALETTE_FIELDS, type ThemePalette } from "@/content/types";
import { normalizeHex } from "@/lib/hex";

export type PaletteIssue = {
  id: string;
  field: keyof ThemePalette;
  message: string;
  current: string;
  suggested: string;
};

type Rgb = { r: number; g: number; b: number };

/**
 * Parses #RRGGBB into RGB channels.
 * @example hexToRgb("#fff") // {r:255,g:255,b:255}
 */
export function hexToRgb(hex: string): Rgb | null {
  const normalized = normalizeHex(hex, "");
  if (!normalized || normalized.length !== 7) return null;
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

/**
 * Relative luminance for WCAG contrast (sRGB).
 * @example relativeLuminance({r:255,g:255,b:255}) // 1
 */
export function relativeLuminance(rgb: Rgb): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

/**
 * WCAG contrast ratio between two hex colors.
 * @example contrastRatio("#000","#fff") // 21
 */
export function contrastRatio(a: string, b: string): number {
  const rgbA = hexToRgb(a);
  const rgbB = hexToRgb(b);
  if (!rgbA || !rgbB) return 1;
  const l1 = relativeLuminance(rgbA);
  const l2 = relativeLuminance(rgbB);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Euclidean distance in RGB space (0–441).
 * @example colorDistance("#000","#fff") // ~441
 */
export function colorDistance(a: string, b: string): number {
  const rgbA = hexToRgb(a);
  const rgbB = hexToRgb(b);
  if (!rgbA || !rgbB) return 0;
  const dr = rgbA.r - rgbB.r;
  const dg = rgbA.g - rgbB.g;
  const db = rgbA.b - rgbB.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Lightens or darkens a hex color by a factor toward white/black.
 * @example shiftHex("#888888", 0.2) // lighter
 */
export function shiftHex(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return normalizeHex(hex, "#000000");
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  if (amount >= 0) {
    return normalizeHex(
      `#${[rgb.r, rgb.g, rgb.b]
        .map((c) => clamp(c + (255 - c) * amount).toString(16).padStart(2, "0"))
        .join("")}`,
      hex,
    );
  }
  const t = 1 + amount;
  return normalizeHex(
    `#${[rgb.r, rgb.g, rgb.b]
      .map((c) => clamp(c * t).toString(16).padStart(2, "0"))
      .join("")}`,
    hex,
  );
}

/**
 * Nudges a foreground color until it meets a minimum contrast vs background.
 * @example ensureContrast("#777","#fff",4.5) // darker hex
 */
export function ensureContrast(fg: string, bg: string, minRatio = 4.5): string {
  let current = normalizeHex(fg, "#000000");
  if (contrastRatio(current, bg) >= minRatio) return current;

  const bgLum = relativeLuminance(hexToRgb(bg) || { r: 0, g: 0, b: 0 });
  const preferDarker = bgLum > 0.45;

  for (let step = 1; step <= 24; step++) {
    const amount = preferDarker ? -0.06 * step : 0.06 * step;
    const next = shiftHex(fg, amount);
    if (contrastRatio(next, bg) >= minRatio) return next;
    current = next;
  }
  return preferDarker ? "#111111" : "#F5F5F5";
}

/**
 * Ensures hover is visibly distinct from the base color.
 * @example ensureHoverDiff("#fff","#fff", bg) // slightly shifted
 */
export function ensureHoverDiff(base: string, hover: string, bg: string): string {
  if (colorDistance(base, hover) >= 18) return normalizeHex(hover, base);
  const bgLum = relativeLuminance(hexToRgb(bg) || { r: 0, g: 0, b: 0 });
  return shiftHex(base, bgLum > 0.45 ? -0.08 : 0.1);
}

/**
 * Analyzes an 8-color palette for contrast, similarity, hover, and hierarchy issues.
 * @example checkPalette(lightPalette) // PaletteIssue[]
 */
export function checkPalette(palette: ThemePalette): PaletteIssue[] {
  const issues: PaletteIssue[] = [];
  const p = {
    background: normalizeHex(palette.background, "#FFFFFF"),
    foreground: normalizeHex(palette.foreground, "#000000"),
    card: normalizeHex(palette.card, "#FFFFFF"),
    cardHover: normalizeHex(palette.cardHover, "#F0F0F0"),
    chip: normalizeHex(palette.chip, "#F0F0F0"),
    accentText: normalizeHex(palette.accentText, "#0000FF"),
    accentHover: normalizeHex(palette.accentHover, "#0000CC"),
    badge: normalizeHex(palette.badge, "#0000FF"),
  };

  const textOnBg = contrastRatio(p.foreground, p.background);
  if (textOnBg < 4.5) {
    issues.push({
      id: "text-bg-contrast",
      field: "foreground",
      message: "Text has insufficient contrast against the background.",
      current: p.foreground,
      suggested: ensureContrast(p.foreground, p.background, 4.5),
    });
  }

  const accentOnBg = contrastRatio(p.accentText, p.background);
  if (accentOnBg < 3) {
    issues.push({
      id: "accent-bg-contrast",
      field: "accentText",
      message: "Accent text has insufficient contrast against the background.",
      current: p.accentText,
      suggested: ensureContrast(p.accentText, p.background, 3.5),
    });
  }

  const accentOnCard = contrastRatio(p.accentText, p.card);
  if (accentOnCard < 3) {
    issues.push({
      id: "accent-card-contrast",
      field: "accentText",
      message: "Accent text has insufficient contrast against cards.",
      current: p.accentText,
      suggested: ensureContrast(p.accentText, p.card, 3.5),
    });
  }

  if (colorDistance(p.card, p.background) < 12) {
    issues.push({
      id: "card-bg-similar",
      field: "card",
      message: "Cards are too similar to the background — hierarchy is weak.",
      current: p.card,
      suggested: shiftHex(
        p.card,
        relativeLuminance(hexToRgb(p.background) || { r: 0, g: 0, b: 0 }) > 0.45 ? -0.06 : 0.08,
      ),
    });
  }

  if (colorDistance(p.chip, p.card) < 10 && colorDistance(p.chip, p.background) < 10) {
    issues.push({
      id: "chip-similar",
      field: "chip",
      message: "Chips / tiles blend into cards and background.",
      current: p.chip,
      suggested: shiftHex(
        p.background,
        relativeLuminance(hexToRgb(p.background) || { r: 0, g: 0, b: 0 }) > 0.45 ? -0.05 : 0.07,
      ),
    });
  }

  if (colorDistance(p.card, p.cardHover) < 12) {
    const suggested = ensureHoverDiff(p.card, p.cardHover, p.background);
    issues.push({
      id: "card-hover-weak",
      field: "cardHover",
      message: "Card hover is too close to the card color — hover feedback is weak.",
      current: p.cardHover,
      suggested,
    });
  }

  if (colorDistance(p.accentText, p.accentHover) < 14) {
    issues.push({
      id: "accent-hover-weak",
      field: "accentHover",
      message: "Accent hover is too similar to accent text.",
      current: p.accentHover,
      suggested: ensureHoverDiff(p.accentText, p.accentHover, p.background),
    });
  }

  if (colorDistance(p.badge, p.accentText) < 8) {
    // Informational — badges can match accents; only flag if also poor on bg
    if (contrastRatio(p.badge, p.background) < 3) {
      issues.push({
        id: "badge-contrast",
        field: "badge",
        message: "Badges have poor contrast against the background.",
        current: p.badge,
        suggested: ensureContrast(p.badge, p.background, 3.5),
      });
    }
  } else if (contrastRatio(p.badge, p.background) < 3) {
    issues.push({
      id: "badge-contrast",
      field: "badge",
      message: "Badges have poor contrast against the background.",
      current: p.badge,
      suggested: ensureContrast(p.badge, p.background, 3.5),
    });
  }

  // Deduplicate by id (keep first)
  const seen = new Set<string>();
  return issues.filter((issue) => {
    if (seen.has(issue.id)) return false;
    seen.add(issue.id);
    return true;
  });
}

/**
 * Applies a single suggested fix onto a palette copy.
 * @example applyPaletteSuggestion(palette, issue) // ThemePalette
 */
export function applyPaletteSuggestion(palette: ThemePalette, issue: PaletteIssue): ThemePalette {
  return {
    ...palette,
    [issue.field]: normalizeHex(issue.suggested, palette[issue.field]),
  };
}

/**
 * Applies all suggested fixes in order.
 * @example applyAllSuggestions(palette, issues) // ThemePalette
 */
export function applyAllSuggestions(palette: ThemePalette, issues: PaletteIssue[]): ThemePalette {
  return issues.reduce((next, issue) => applyPaletteSuggestion(next, issue), palette);
}

/**
 * Human label for a palette field key.
 * @example paletteFieldLabel("accentText") // "Accent text"
 */
export function paletteFieldLabel(key: keyof ThemePalette): string {
  return THEME_PALETTE_FIELDS.find((f) => f.key === key)?.label ?? key;
}
