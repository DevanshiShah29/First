import type { ThemePalette } from "@/content/types";

export const SEASON_IDS = ["halloween", "diwali", "christmas"] as const;

export type SeasonId = (typeof SEASON_IDS)[number];

export type SeasonIntensity = "subtle" | "full";

/** Annual windows may cross New Year (`12-20` → `01-06`). Dated windows are one inclusive span. */
export type SeasonSchedule =
  | { kind: "annual"; start: string; end: string }
  | { kind: "dated"; start: string; end: string };

export type SeasonPalette = {
  brandFrom: string;
  brandTo: string;
  light: ThemePalette;
  dark: ThemePalette;
};

export type SeasonOrnamentKey =
  | "bat"
  | "pumpkin"
  | "pumpkinLeft"
  | "pumpkinRight"
  | "stem"
  | "bowl"
  | "flame"
  | "flameCore"
  | "leaf"
  | "leafLight"
  | "berry"
  | "berryLight"
  | "snow";

/** Named fills for one season's corner marks. Unused keys stay unset. */
export type SeasonOrnamentColors = Partial<Record<SeasonOrnamentKey, string>>;

export const SEASON_ORNAMENT_FIELDS: Record<
  SeasonId,
  { key: SeasonOrnamentKey; label: string }[]
> = {
  halloween: [
    { key: "bat", label: "Bat" },
    { key: "pumpkin", label: "Pumpkin" },
    { key: "pumpkinLeft", label: "Pumpkin side" },
    { key: "pumpkinRight", label: "Pumpkin edge" },
    { key: "stem", label: "Stem" },
  ],
  diwali: [
    { key: "bowl", label: "Diya" },
    { key: "flame", label: "Flame" },
    { key: "flameCore", label: "Flame core" },
  ],
  christmas: [
    { key: "leaf", label: "Holly" },
    { key: "leafLight", label: "Holly highlight" },
    { key: "berry", label: "Berries" },
    { key: "berryLight", label: "Berry highlight" },
    { key: "snow", label: "Snowflake" },
  ],
};

export type SeasonPreset = {
  id: SeasonId;
  name: string;
  description: string;
  schedule: SeasonSchedule;
  intensity: SeasonIntensity;
  palette: SeasonPalette;
  ornaments: SeasonOrnamentColors;
};

/**
 * Built-in festive packs. Edits live in the CMS; these are the reset point.
 * Diwali is dated because the lunar festival does not repeat on a fixed month-day.
 */
export const SEASON_PRESETS: SeasonPreset[] = [
  {
    id: "halloween",
    name: "Halloween",
    description: "Deep plum and amber. Corner ornaments are images you add.",
    schedule: { kind: "annual", start: "10-25", end: "11-01" },
    intensity: "full",
    palette: {
      brandFrom: "#C2410C",
      brandTo: "#7C3AED",
      light: {
        background: "#F3EBE3",
        foreground: "#241910",
        card: "#FFFCF8",
        chip: "#EAD9C8",
        accentText: "#9A3412",
        accentHover: "#7C2D12",
        badge: "#C2410C",
      },
      dark: {
        background: "#120C10",
        foreground: "#F8EFE8",
        card: "#2E262A",
        chip: "#3A3034",
        accentText: "#FDBA74",
        accentHover: "#FED7AA",
        badge: "#C4B5FD",
      },
    },
    ornaments: {
      bat: "#7C3AED",
      pumpkin: "#C2410C",
      pumpkinLeft: "#EA580C",
      pumpkinRight: "#F97316",
      stem: "#166534",
    },
  },
  {
    id: "diwali",
    name: "Diwali",
    description: "Warm gold and maroon. Corner ornaments are images you add. Set this year’s dates.",
    schedule: { kind: "dated", start: "2026-11-06", end: "2026-11-12" },
    intensity: "full",
    palette: {
      brandFrom: "#B45309",
      brandTo: "#9F1239",
      light: {
        background: "#F3E6D4",
        foreground: "#2A1A12",
        card: "#FFFCF7",
        chip: "#F0D8B4",
        accentText: "#9F1239",
        accentHover: "#881337",
        badge: "#B45309",
      },
      dark: {
        background: "#120E0A",
        foreground: "#F8EBD8",
        card: "#2E2418",
        chip: "#3A2C1E",
        accentText: "#F6C453",
        accentHover: "#FDE68A",
        badge: "#FB7185",
      },
    },
    ornaments: {
      bowl: "#B45309",
      flame: "#FDE68A",
      flameCore: "#F59E0B",
    },
  },
  {
    id: "christmas",
    name: "Christmas",
    description: "Forest green and red. Corner ornaments are images you add.",
    schedule: { kind: "annual", start: "12-20", end: "12-26" },
    intensity: "full",
    palette: {
      brandFrom: "#166534",
      brandTo: "#B91C1C",
      light: {
        background: "#E4EFE6",
        foreground: "#14211A",
        card: "#FFFEFB",
        chip: "#D5E8D8",
        accentText: "#166534",
        accentHover: "#14532D",
        badge: "#B91C1C",
      },
      dark: {
        background: "#0C1210",
        foreground: "#E8F2EA",
        card: "#1E2C24",
        chip: "#26382C",
        accentText: "#86EFAC",
        accentHover: "#BBF7D0",
        badge: "#FCA5A5",
      },
    },
    ornaments: {
      leaf: "#166534",
      leafLight: "#15803D",
      berry: "#B91C1C",
      berryLight: "#DC2626",
      snow: "#E0F2FE",
    },
  },
];

/**
 * Finds a built-in season pack by id.
 * @example getSeasonPreset("diwali") // SeasonPreset | undefined
 */
export function getSeasonPreset(id: string): SeasonPreset | undefined {
  return SEASON_PRESETS.find((preset) => preset.id === id);
}

/**
 * True when the id is one of the built-in seasons.
 * @example isSeasonId("halloween") // true
 */
export function isSeasonId(value: string): value is SeasonId {
  return (SEASON_IDS as readonly string[]).includes(value);
}
