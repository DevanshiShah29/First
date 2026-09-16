import type { ThemePalette } from "@/content/types";

export type ThemePreset = {
  id: string;
  name: string;
  description: string;
  brandFrom: string;
  brandTo: string;
  light: ThemePalette;
  dark: ThemePalette;
};

/**
 * Built-in Appearance presets. Each provides light + dark palettes
 * for the 8 theme variables (background, text, cards, hover, chips, accents, badges).
 */
export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "sage",
    name: "Sage",
    description: "Calm, natural, warm — soft greens with earthy accents.",
    brandFrom: "#5F7A61",
    brandTo: "#8FA88E",
    light: {
      background: "#F4F1EA",
      foreground: "#1F2A22",
      card: "#FFFCF7",
      cardHover: "#EAE6DC",
      chip: "#E7EDE6",
      accentText: "#4F6B52",
      accentHover: "#3E5541",
      badge: "#6B8F71",
    },
    dark: {
      background: "#121714",
      foreground: "#E8EDE8",
      card: "#1A211C",
      cardHover: "#232B25",
      chip: "#1F2822",
      accentText: "#A8C4A9",
      accentHover: "#C0D7C1",
      badge: "#8FAF92",
    },
  },
  {
    id: "blush",
    name: "Blush",
    description: "Soft, elegant, feminine — rose neutrals with warm coral accents.",
    brandFrom: "#C97B84",
    brandTo: "#E8A0A8",
    light: {
      background: "#FBF6F5",
      foreground: "#2A1F22",
      card: "#FFFFFF",
      cardHover: "#F5E9EA",
      chip: "#F3E6E8",
      accentText: "#B45C68",
      accentHover: "#9A4A55",
      badge: "#A34E5A",
    },
    dark: {
      background: "#1A1416",
      foreground: "#F5E9EB",
      card: "#241C1F",
      cardHover: "#2E2428",
      chip: "#2A2024",
      accentText: "#E8A8B0",
      accentHover: "#F0C0C6",
      badge: "#D48993",
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Clean, fresh, modern — cool blues with crisp contrast.",
    brandFrom: "#2F6FED",
    brandTo: "#4BA3F0",
    light: {
      background: "#F3F7FB",
      foreground: "#122033",
      card: "#FFFFFF",
      cardHover: "#E8F0F8",
      chip: "#E6EEF6",
      accentText: "#1F5FCC",
      accentHover: "#174BA3",
      badge: "#2F6FED",
    },
    dark: {
      background: "#0B1220",
      foreground: "#E8F0FA",
      card: "#121A2B",
      cardHover: "#1A2438",
      chip: "#162033",
      accentText: "#7EB6FF",
      accentHover: "#A6CCFF",
      badge: "#5B9BFF",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Dark, sophisticated — deep charcoal with violet highlights.",
    brandFrom: "#8B5CF6",
    brandTo: "#A78BFA",
    light: {
      background: "#F5F3FA",
      foreground: "#16141F",
      card: "#FFFFFF",
      cardHover: "#EDE9F7",
      chip: "#EBE7F4",
      accentText: "#6D28D9",
      accentHover: "#5B21B6",
      badge: "#7C3AED",
    },
    dark: {
      background: "#08080C",
      foreground: "#F3F0FA",
      card: "#101018",
      cardHover: "#181822",
      chip: "#14141C",
      accentText: "#C4B5FD",
      accentHover: "#DDD6FE",
      badge: "#A78BFA",
    },
  },
  {
    id: "warm",
    name: "Warm",
    description: "Earthy, cozy, editorial — parchment tones with terracotta.",
    brandFrom: "#C06A3D",
    brandTo: "#D4895A",
    light: {
      background: "#F7F0E6",
      foreground: "#2A2118",
      card: "#FFFBF5",
      cardHover: "#EFE4D4",
      chip: "#EFE6D8",
      accentText: "#A65D45",
      accentHover: "#8E4935",
      badge: "#C06A3D",
    },
    dark: {
      background: "#16110E",
      foreground: "#F5EDE3",
      card: "#1F1914",
      cardHover: "#2A221B",
      chip: "#241C16",
      accentText: "#E0A07A",
      accentHover: "#EFB892",
      badge: "#D4895A",
    },
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Neutral, clean, understated — quiet grays with ink accents.",
    brandFrom: "#52525B",
    brandTo: "#71717A",
    light: {
      background: "#F4F4F5",
      foreground: "#18181B",
      card: "#FFFFFF",
      cardHover: "#E4E4E7",
      chip: "#E4E4E7",
      accentText: "#3F3F46",
      accentHover: "#27272A",
      badge: "#52525B",
    },
    dark: {
      background: "#09090B",
      foreground: "#FAFAFA",
      card: "#121214",
      cardHover: "#1A1A1D",
      chip: "#161618",
      accentText: "#A1A1AA",
      accentHover: "#D4D4D8",
      badge: "#A1A1AA",
    },
  },
];

/**
 * Finds a built-in preset by id.
 * @example getThemePreset("sage") // ThemePreset | undefined
 */
export function getThemePreset(id: string): ThemePreset | undefined {
  return THEME_PRESETS.find((preset) => preset.id === id);
}
