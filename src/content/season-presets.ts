import type { ThemePalette } from "@/content/types";

export const SEASON_IDS = [
  "newyear",
  "valentine",
  "holi",
  "rakhi",
  "navratri",
  "halloween",
  "diwali",
  "christmas",
] as const;

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

export type SeasonPreset = {
  id: SeasonId;
  name: string;
  description: string;
  schedule: SeasonSchedule;
  intensity: SeasonIntensity;
  palette: SeasonPalette;
};

/**
 * Built-in festive packs. Edits live in the CMS; these are the reset point.
 * Lunar festivals (Holi, Rakhi, Navratri, Diwali) are dated because they do
 * not repeat on a fixed month-day.
 */
export const SEASON_PRESETS: SeasonPreset[] = [
  {
    id: "newyear",
    name: "New Year",
    description: "Midnight navy and champagne gold. Ornaments sit in an even row under the header, like string lights.",
    schedule: { kind: "annual", start: "12-31", end: "01-02" },
    intensity: "full",
    palette: {
      brandFrom: "#1E3A8A",
      brandTo: "#D97706",
      light: {
        background: "#EEF2F9",
        foreground: "#101A2E",
        card: "#FFFFFF",
        chip: "#DCE3F1",
        accentText: "#1D4ED8",
        accentHover: "#1E3A8A",
        badge: "#B45309",
      },
      dark: {
        background: "#0A0F1E",
        foreground: "#EAF0FB",
        card: "#131A2E",
        chip: "#1F2A45",
        accentText: "#93C5FD",
        accentHover: "#BFDBFE",
        badge: "#FCD34D",
      },
    },
  },
  {
    id: "valentine",
    name: "Valentine's Day",
    description: "Rose and blush pink. Ornaments rise in the side margins, not across the page.",
    schedule: { kind: "annual", start: "02-13", end: "02-15" },
    intensity: "full",
    palette: {
      brandFrom: "#BE123C",
      brandTo: "#F472B6",
      light: {
        background: "#FBEEF0",
        foreground: "#2A0F14",
        card: "#FFFBFB",
        chip: "#F6DCE0",
        accentText: "#BE123C",
        accentHover: "#9F1239",
        badge: "#E11D48",
      },
      dark: {
        background: "#160A0D",
        foreground: "#FBE9EC",
        card: "#291218",
        chip: "#3A1A22",
        accentText: "#FDA4AF",
        accentHover: "#FECDD3",
        badge: "#F9A8D4",
      },
    },
  },
  {
    id: "holi",
    name: "Holi",
    description: "Festival of colors — pink, teal, and gold. Ornaments stay on the outer edges. Dates are a placeholder — set this year's verified dates.",
    schedule: { kind: "dated", start: "2027-03-21", end: "2027-03-23" },
    intensity: "full",
    palette: {
      brandFrom: "#DB2777",
      brandTo: "#0D9488",
      light: {
        background: "#F7ECF4",
        foreground: "#2A1223",
        card: "#FFFBFD",
        chip: "#F0D6E6",
        accentText: "#BE185D",
        accentHover: "#9D174D",
        badge: "#0D9488",
      },
      dark: {
        background: "#150B12",
        foreground: "#F8EAF2",
        card: "#2A1624",
        chip: "#3A1F33",
        accentText: "#F472B6",
        accentHover: "#FBCFE8",
        badge: "#5EEAD4",
      },
    },
  },
  {
    id: "rakhi",
    name: "Raksha Bandhan",
    description: "Marigold gold and rakhi red. Ornaments sit in the upper corners, like a tied rakhi. Dates are a placeholder — set this year's verified dates.",
    schedule: { kind: "dated", start: "2027-08-28", end: "2027-08-29" },
    intensity: "full",
    palette: {
      brandFrom: "#CA8A04",
      brandTo: "#DC2626",
      light: {
        background: "#FBF4E6",
        foreground: "#241A08",
        card: "#FFFDF7",
        chip: "#F6E6C4",
        accentText: "#A16207",
        accentHover: "#854D0E",
        badge: "#DC2626",
      },
      dark: {
        background: "#140F06",
        foreground: "#F8EED6",
        card: "#281F0D",
        chip: "#382B12",
        accentText: "#FBBF24",
        accentHover: "#FDE68A",
        badge: "#F87171",
      },
    },
  },
  {
    id: "navratri",
    name: "Navratri / Durga Puja",
    description: "Saffron and festival red. Ornaments frame the left and right edges, like a doorway. Dates are a placeholder — set this year's verified dates.",
    schedule: { kind: "dated", start: "2027-10-07", end: "2027-10-15" },
    intensity: "full",
    palette: {
      brandFrom: "#EA580C",
      brandTo: "#BE123C",
      light: {
        background: "#F9EFE6",
        foreground: "#2A150A",
        card: "#FFFBF6",
        chip: "#F4E0CA",
        accentText: "#C2410C",
        accentHover: "#9A3412",
        badge: "#BE123C",
      },
      dark: {
        background: "#160B05",
        foreground: "#F9EBDD",
        card: "#2B1A0C",
        chip: "#3C2716",
        accentText: "#FDBA74",
        accentHover: "#FED7AA",
        badge: "#FB7185",
      },
    },
  },
  {
    id: "halloween",
    name: "Halloween",
    description: "Deep plum and amber. Ornaments stay along the top, like decorations on the eaves.",
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
  },
  {
    id: "diwali",
    name: "Diwali",
    description: "Warm gold and maroon. Ornaments sit on the floor at the left and right edges, like diyas. Set this year's dates.",
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
  },
  {
    id: "christmas",
    name: "Christmas",
    description: "Forest green and red. Ornaments hang under the header, like a garland.",
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
