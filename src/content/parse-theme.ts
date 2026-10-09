import { normalizeHex } from "@/lib/hex";
import {
  DEFAULT_THEME,
  type SavedTheme,
  type ThemeContent,
  type ThemeMode,
  type ThemePalette,
} from "./types";
import { asRecord, bool, str } from "./parse-fields";

/**
 * Parses theme mode string.
 * @example parseMode("dark") // "dark", parseMode("x") // default
 */
function parseMode(value: unknown): ThemeMode {
  return value === "light" || value === "dark" || value === "system" ? value : DEFAULT_THEME.defaultMode;
}

/**
 * Parses a theme palette with hex normalization.
 * @example parsePalette({}, DEFAULT_THEME.dark) // ThemePalette
 */
export function parsePalette(value: unknown, fallback: ThemePalette): ThemePalette {
  const row = asRecord(value);
  return {
    background: normalizeHex(row.background, fallback.background),
    foreground: normalizeHex(row.foreground, fallback.foreground),
    card: normalizeHex(row.card, fallback.card),
    cardHover: normalizeHex(row.cardHover, fallback.cardHover),
    chip: normalizeHex(row.chip, fallback.chip),
    accentText: normalizeHex(row.accentText, fallback.accentText),
    accentHover: normalizeHex(row.accentHover, fallback.accentHover),
    badge: normalizeHex(row.badge, fallback.badge),
  };
}

/**
 * Parses saved theme library entries.
 * @example parseSavedThemes([{name:"Warm"}]) // SavedTheme[]
 */
export function parseSavedThemes(value: unknown): SavedTheme[] {
  if (!Array.isArray(value)) return [];
  const themes: SavedTheme[] = [];
  for (let i = 0; i < value.length && themes.length < 40; i++) {
    const row = asRecord(value[i]);
    const name = str(row.name).trim();
    if (!name) continue;
    const now = new Date().toISOString();
    const description = str(row.description).slice(0, 200);
    const theme: SavedTheme = {
      id: str(row.id, `saved-${i + 1}`),
      name: name.slice(0, 80),
      brandFrom: normalizeHex(row.brandFrom, DEFAULT_THEME.brandFrom),
      brandTo: normalizeHex(row.brandTo, DEFAULT_THEME.brandTo),
      dark: parsePalette(row.dark, DEFAULT_THEME.dark),
      light: parsePalette(row.light, DEFAULT_THEME.light),
      createdAt: str(row.createdAt, now),
      updatedAt: str(row.updatedAt, now),
    };
    if (description) theme.description = description;
    themes.push(theme);
  }
  return themes;
}

/**
 * Parses theme settings JSON.
 * @example parseTheme({defaultMode:"system"}) // ThemeContent
 */
export function parseTheme(value: unknown): ThemeContent {
  const row = asRecord(value);
  const activeRaw = row.activeThemeId;
  return {
    defaultMode: parseMode(row.defaultMode),
    allowToggle: bool(row.allowToggle, DEFAULT_THEME.allowToggle),
    brandFrom: normalizeHex(row.brandFrom, DEFAULT_THEME.brandFrom),
    brandTo: normalizeHex(row.brandTo, DEFAULT_THEME.brandTo),
    dark: parsePalette(row.dark, DEFAULT_THEME.dark),
    light: parsePalette(row.light, DEFAULT_THEME.light),
    activeThemeId:
      activeRaw === null || activeRaw === undefined || activeRaw === ""
        ? null
        : str(activeRaw),
    savedThemes: parseSavedThemes(row.savedThemes),
  };
}

/**
 * Coerces DB JSON palette into ThemePalette.
 * @example asThemePalette(row.dark, fallback) // ThemePalette
 */
export function asThemePalette(value: unknown, fallback: ThemePalette): ThemePalette {
  return parsePalette(value, fallback);
}
