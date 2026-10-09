import type { ContentData, ThemePalette } from "@/content/types";

export type DraftTheme = {
  name: string;
  description: string;
  brandFrom: string;
  brandTo: string;
  light: ThemePalette;
  dark: ThemePalette;
};

/**
 * Creates a draft snapshot from the live theme content.
 * @example draftFromTheme(data.theme) // DraftTheme
 */
export function draftFromTheme(theme: ContentData["theme"]): DraftTheme {
  return {
    name: "Current theme",
    description: "Working palette",
    brandFrom: theme.brandFrom,
    brandTo: theme.brandTo,
    light: { ...theme.light },
    dark: { ...theme.dark },
  };
}

/**
 * Builds a new saved-theme id.
 * @example newSavedId() // "saved-…"
 */
export function newSavedId(): string {
  return `saved-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
