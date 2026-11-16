import type { ThemeContent, ThemePalette } from "@/content/types";
import { normalizeHex } from "@/lib/hex";
import { asRecord, bool, str } from "./parse-fields";
import {
  getSeasonPreset,
  SEASON_PRESETS,
  type SeasonId,
  type SeasonIntensity,
  type SeasonPalette,
  type SeasonPreset,
  type SeasonSchedule,
} from "./season-presets";

export type { SeasonId, SeasonIntensity, SeasonPalette, SeasonSchedule };

export const DEFAULT_SEASON_TIMEZONE = "Asia/Kolkata";

export const SEASON_TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Europe/London",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "UTC",
] as const;

export type SeasonMode = "off" | "manual" | "schedule";

export type PlacementPosition =
  | "header"
  | "top-edge"
  | "bottom-edge"
  | "left-edge"
  | "right-edge"
  | "corners"
  | "center"
  | "custom";

export type PlacementAlignment = "left" | "center" | "right" | "stretch";

export type PlacementOrientation = "horizontal" | "vertical" | "diagonal" | "free";

export type PlacementSize = "small" | "medium" | "large" | "custom";

export type PlacementAnimation = "sway" | "float" | "twinkle" | "flicker" | "drift" | "none";

export type PlacementAnimationIntensity = "subtle" | "normal" | "energetic";

export type PlacementVisibility = "all" | "desktop" | "mobile";

export type PlacementCoordinates = {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
};

export type PlacementGroup = {
  id: string;
  name: string;
  position: PlacementPosition;
  alignment: PlacementAlignment;
  orientation: PlacementOrientation;
  assets: string[];
  repeat: number;
  spacing: number;
  size: PlacementSize;
  customSize?: number;
  animation: PlacementAnimation;
  animationIntensity: PlacementAnimationIntensity;
  visibility: PlacementVisibility;
  customCoordinates?: PlacementCoordinates;
};

export const PLACEMENT_POSITIONS: { id: PlacementPosition; label: string; icon: string; description: string }[] = [
  { id: "header", label: "Header", icon: "📌", description: "Hangs below the header, inset from the page edges" },
  { id: "top-edge", label: "Top Edge", icon: "⬆️", description: "Spans the top of the page, just below the header" },
  { id: "bottom-edge", label: "Bottom Edge", icon: "⬇️", description: "Along the bottom floor of the screen" },
  { id: "left-edge", label: "Left Edge", icon: "⬅️", description: "Running down the left border" },
  { id: "right-edge", label: "Right Edge", icon: "➡️", description: "Running down the right border" },
  { id: "corners", label: "Corners", icon: "📐", description: "Distributed across the four corners, one ornament per corner slot" },
  { id: "center", label: "Center", icon: "🎯", description: "Centered on the screen" },
  { id: "custom", label: "Custom", icon: "✨", description: "Custom positioning coordinates" },
];

export const PLACEMENT_ALIGNMENTS: { id: PlacementAlignment; label: string }[] = [
  { id: "left", label: "Left" },
  { id: "center", label: "Center" },
  { id: "right", label: "Right" },
  { id: "stretch", label: "Stretch" },
];

export const PLACEMENT_ORIENTATIONS: { id: PlacementOrientation; label: string }[] = [
  { id: "horizontal", label: "Horizontal" },
  { id: "vertical", label: "Vertical" },
  { id: "diagonal", label: "Diagonal" },
  { id: "free", label: "Free" },
];

export const PLACEMENT_SIZES: { id: PlacementSize; label: string; rem: number }[] = [
  { id: "small", label: "Small", rem: 2 },
  { id: "medium", label: "Medium", rem: 3 },
  { id: "large", label: "Large", rem: 4 },
  { id: "custom", label: "Custom", rem: 3 },
];

/**
 * Rendered size of one placement ornament, including custom sizes.
 * @example placementSizeRem({ size: "custom", customSize: 5 }) // 5
 */
export function placementSizeRem(group: Pick<PlacementGroup, "size" | "customSize">): number {
  if (group.size === "custom") return group.customSize ?? 3;
  return PLACEMENT_SIZES.find((entry) => entry.id === group.size)?.rem ?? 3;
}

export const PLACEMENT_ANIMATIONS: { id: PlacementAnimation; label: string }[] = [
  { id: "sway", label: "Sway" },
  { id: "float", label: "Float" },
  { id: "twinkle", label: "Twinkle" },
  { id: "flicker", label: "Flicker" },
  { id: "drift", label: "Drift" },
  { id: "none", label: "None" },
];

export const PLACEMENT_INTENSITIES: { id: PlacementAnimationIntensity; label: string; description: string }[] = [
  { id: "subtle", label: "Subtle", description: "Gentle, relaxed movement" },
  { id: "normal", label: "Normal", description: "Standard speed & movement" },
  { id: "energetic", label: "Energetic", description: "Faster dynamic movement" },
];

export const PLACEMENT_VISIBILITIES: { id: PlacementVisibility; label: string }[] = [
  { id: "all", label: "Desktop & Mobile" },
  { id: "desktop", label: "Desktop only" },
  { id: "mobile", label: "Mobile only" },
];

export const VALID_PLACEMENT_POSITIONS = new Set<string>([
  "header",
  "top-edge",
  "bottom-edge",
  "left-edge",
  "right-edge",
  "corners",
  "center",
  "custom",
]);

export const VALID_PLACEMENT_ALIGNMENTS = new Set<string>(["left", "center", "right", "stretch"]);
export const VALID_PLACEMENT_ORIENTATIONS = new Set<string>(["horizontal", "vertical", "diagonal", "free"]);
export const VALID_PLACEMENT_SIZES = new Set<string>(["small", "medium", "large", "custom"]);
export const VALID_PLACEMENT_ANIMATIONS = new Set<string>(["sway", "float", "twinkle", "flicker", "drift", "none"]);
export const VALID_PLACEMENT_INTENSITIES = new Set<string>(["subtle", "normal", "energetic"]);
export const VALID_PLACEMENT_VISIBILITIES = new Set<string>(["all", "desktop", "mobile"]);

export function createPlacementGroup(preset?: Partial<PlacementGroup>): PlacementGroup {
  return {
    id: `pg-${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`,
    name: preset?.name?.trim() || "Header Garland",
    position: preset?.position && VALID_PLACEMENT_POSITIONS.has(preset.position) ? preset.position : "header",
    alignment: preset?.alignment && VALID_PLACEMENT_ALIGNMENTS.has(preset.alignment) ? preset.alignment : "center",
    orientation: preset?.orientation && VALID_PLACEMENT_ORIENTATIONS.has(preset.orientation) ? preset.orientation : "horizontal",
    assets: Array.isArray(preset?.assets) ? [...preset.assets] : [],
    repeat: Math.max(1, Math.min(20, preset?.repeat ?? 1)),
    spacing: Math.max(0, Math.min(20, preset?.spacing ?? 2)),
    size: preset?.size && VALID_PLACEMENT_SIZES.has(preset.size) ? preset.size : "medium",
    customSize: preset?.customSize != null ? Math.max(0.5, Math.min(15, preset.customSize)) : 3,
    animation: preset?.animation && VALID_PLACEMENT_ANIMATIONS.has(preset.animation) ? preset.animation : "sway",
    animationIntensity: preset?.animationIntensity && VALID_PLACEMENT_INTENSITIES.has(preset.animationIntensity) ? preset.animationIntensity : "normal",
    visibility: preset?.visibility && VALID_PLACEMENT_VISIBILITIES.has(preset.visibility) ? preset.visibility : "all",
    customCoordinates: preset?.customCoordinates ? { ...preset.customCoordinates } : undefined,
  };
}

export type OrnamentPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "left-center"
  | "right-center"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export const ORNAMENT_POSITIONS: { id: OrnamentPosition; label: string; icon: string }[] = [
  { id: "top-left", label: "Top Left", icon: "↖" },
  { id: "top-center", label: "Top Center", icon: "↑" },
  { id: "top-right", label: "Top Right", icon: "↗" },
  { id: "left-center", label: "Left Side", icon: "←" },
  { id: "right-center", label: "Right Side", icon: "→" },
  { id: "bottom-left", label: "Bottom Left", icon: "↙" },
  { id: "bottom-center", label: "Bottom Center", icon: "↓" },
  { id: "bottom-right", label: "Bottom Right", icon: "↘" },
];

export const VALID_ORNAMENT_POSITIONS = new Set<string>(
  ORNAMENT_POSITIONS.map((pos) => pos.id),
);

export const DEFAULT_ORNAMENT_POSITIONS: OrnamentPosition[] = [
  "top-right",
  "top-left",
  "bottom-right",
  "bottom-left",
  "top-center",
  "bottom-center",
  "right-center",
  "left-center",
];

export function defaultOrnamentPosition(index: number): OrnamentPosition {
  return DEFAULT_ORNAMENT_POSITIONS[index % DEFAULT_ORNAMENT_POSITIONS.length];
}

export function isOrnamentPosition(value: unknown): value is OrnamentPosition {
  return typeof value === "string" && VALID_ORNAMENT_POSITIONS.has(value);
}

/** Ornament photos per season. Extra files are dropped on save. */
export const MAX_SEASON_ORNAMENT_IMAGES = 12;

/** Shared ornament catalogue cap. */
export const MAX_SEASON_ORNAMENTS = 120;

/** One image in the shared ornament catalogue, reused across seasons. */
export type SeasonOrnament = {
  id: string;
  /** Blank until the editor names it. */
  name: string;
  /** Uploaded or pasted image address. Empty rows are kept until an image is added. */
  imageUrl: string;
};

export type SeasonConfig = {
  id: string;
  /** Blank for a festival that has not been named yet. Built-in seasons keep their preset name. */
  name: string;
  enabled: boolean;
  schedule: SeasonSchedule;
  intensity: SeasonIntensity;
  palette: SeasonPalette;
  /** Catalogue image addresses mapped to this season. Empty shows no ornaments. */
  ornamentImages: string[];
  /** Optional ornament image URL to use as cursor when this festival/season is live. */
  cursorOrnament?: string | null;
  /** User-chosen screen positions for each ornament image address. */
  ornamentPositions?: Record<string, OrnamentPosition>;
  /** Flexible placement groups for this season. */
  placements?: PlacementGroup[];
};

export type SeasonsSettings = {
  mode: SeasonMode;
  manualId: string | null;
  timezone: string;
  items: SeasonConfig[];
  /** Shared ornament catalogue. Seasons map to these by image URL. */
  ornaments: SeasonOrnament[];
  /** Presets or festivals deleted by the user so they stay removed on save. */
  deletedIds?: string[];
};

/** Extra festivals beyond Halloween, Diwali, and Christmas. */
export const MAX_CUSTOM_SEASONS = 12;

const CUSTOM_SEASON_ID = /^fest-[a-z0-9]{8,32}$/;

/**
 * True for an id created by Add festival.
 * @example isCustomSeasonId("fest-ab12cd34ef56") // true
 */
export function isCustomSeasonId(value: string): boolean {
  return CUSTOM_SEASON_ID.test(value);
}

/** Starting colors for a festival added in the CMS. */
export const CUSTOM_SEASON_PALETTE: SeasonPalette = {
  brandFrom: "#C2410C",
  brandTo: "#1D4ED8",
  light: {
    background: "#F4F0E6",
    foreground: "#1C1916",
    card: "#FFFCF7",
    chip: "#E7E0D2",
    accentText: "#9A3412",
    accentHover: "#7C2D12",
    badge: "#1D4ED8",
  },
  dark: {
    background: "#12100E",
    foreground: "#F6F1E8",
    card: "#2A261F",
    chip: "#3A342C",
    accentText: "#FDBA74",
    accentHover: "#FED7AA",
    badge: "#93C5FD",
  },
};

/**
 * Year-round default: seasons exist so the CMS can edit them, and none are on.
 * @example DEFAULT_SEASONS.mode // "off"
 */
export const DEFAULT_SEASONS: SeasonsSettings = {
  mode: "off",
  manualId: null,
  timezone: DEFAULT_SEASON_TIMEZONE,
  items: SEASON_PRESETS.map((preset) => configFromPreset(preset, true)),
  ornaments: [],
};

/**
 * Creates an empty catalogue row. The editor fills in the name and image.
 * @example createSeasonOrnament() // { id: "orn-…", name: "", imageUrl: "" }
 */
export function createSeasonOrnament(): SeasonOrnament {
  return {
    id: `orn-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`,
    name: "",
    imageUrl: "",
  };
}

/**
 * Copies a preset into an editable season row.
 * @example configFromPreset(preset, true) // SeasonConfig
 */
function configFromPreset(preset: SeasonPreset, enabled: boolean): SeasonConfig {
  return {
    id: preset.id,
    name: preset.name,
    enabled,
    schedule: { ...preset.schedule },
    intensity: preset.intensity,
    palette: clonePalette(preset.palette),
    ornamentImages: [],
    cursorOrnament: null,
    ornamentPositions: {},
    placements: [],
  };
}

/**
 * A new festival: unnamed, on, and dated for the next seven days in the season timezone.
 * @example createCustomSeason(new Date(), "Asia/Kolkata") // SeasonConfig
 */
export function createCustomSeason(now: Date, timeZone: string): SeasonConfig {
  const start = zonedDateParts(now, timeZone);
  const endDate = new Date(Date.UTC(start.year, start.month - 1, start.day + 6));
  const end = {
    year: endDate.getUTCFullYear(),
    month: endDate.getUTCMonth() + 1,
    day: endDate.getUTCDate(),
  };
  const id = `fest-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  return {
    id,
    name: "",
    enabled: true,
    schedule: { kind: "dated", start: isoFromParts(start), end: isoFromParts(end) },
    intensity: "full",
    palette: clonePalette(CUSTOM_SEASON_PALETTE),
    ornamentImages: [],
    cursorOrnament: null,
    ornamentPositions: {},
    placements: [],
  };
}

/**
 * Reset point for a season palette. Added festivals use the shared starting colors.
 * @example defaultSeasonPalette("halloween") // SeasonPalette
 */
export function defaultSeasonPalette(id: string): SeasonPalette {
  return clonePalette(getSeasonPreset(id)?.palette ?? CUSTOM_SEASON_PALETTE);
}

/**
 * Accepts a same-origin path or an http(s) image address.
 * @example seasonOrnamentImageUrl("https://cdn.example/bat.png") // "https://cdn.example/bat.png"
 */
export function seasonOrnamentImageUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 2048) return null;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.includes("\\") && !trimmed.includes(" ")) {
    return trimmed;
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.username || url.password) return null;
  return url.href;
}

/**
 * Keeps the first unique image addresses, up to the season cap.
 * @example parseOrnamentImages(["/a.png", "/a.png"]) // ["/a.png"]
 */
function parseOrnamentImages(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const urls: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const url = seasonOrnamentImageUrl(item);
    if (!url || urls.includes(url)) continue;
    urls.push(url);
    if (urls.length >= MAX_SEASON_ORNAMENT_IMAGES) break;
  }
  return urls;
}

/**
 * Reads the shared ornament catalogue. Rows without an image stay so they can be filled in.
 * @example parseSeasonOrnaments([{ id: "orn-1", imageUrl: "/a.png" }]) // SeasonOrnament[]
 */
function parseSeasonOrnaments(value: unknown): SeasonOrnament[] {
  if (!Array.isArray(value)) return [];
  const ornaments: SeasonOrnament[] = [];
  const ids = new Set<string>();
  const urls = new Set<string>();
  for (const item of value) {
    if (ornaments.length >= MAX_SEASON_ORNAMENTS) break;
    const row = asRecord(item);
    const id = str(row.id).trim().slice(0, 64);
    if (!id || ids.has(id)) continue;
    const rawUrl = str(row.imageUrl).trim();
    const imageUrl = rawUrl ? (seasonOrnamentImageUrl(rawUrl) ?? "") : "";
    if (rawUrl && !imageUrl) continue;
    if (imageUrl && urls.has(imageUrl)) continue;
    ids.add(id);
    if (imageUrl) urls.add(imageUrl);
    ornaments.push({
      id,
      name: parseSeasonName(row.name),
      imageUrl,
    });
  }
  return ornaments;
}

/**
 * Copies palette fields so later edits do not change the preset.
 * @example clonePalette(preset.palette) // SeasonPalette
 */
function clonePalette(palette: SeasonPalette): SeasonPalette {
  return {
    brandFrom: palette.brandFrom,
    brandTo: palette.brandTo,
    light: { ...palette.light },
    dark: { ...palette.dark },
  };
}

/**
 * True when Intl accepts the IANA zone.
 * @example isTimeZone("Asia/Kolkata") // true
 */
export function isTimeZone(value: string): boolean {
  try {
    Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/**
 * Calendar day in a timezone. An unknown zone uses Asia/Kolkata.
 * @example zonedDateParts(date, "Asia/Kolkata") // { year, month, day }
 */
export function zonedDateParts(
  now: Date,
  timeZone: string,
): { year: number; month: number; day: number } {
  const zone = isTimeZone(timeZone) ? timeZone : DEFAULT_SEASON_TIMEZONE;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return { year: read("year"), month: read("month"), day: read("day") };
}

/**
 * Days in a month. February allows 29 so an annual window can include leap day.
 * @example daysInMonth(2026, 2) // 28
 */
function daysInMonth(year: number, month: number, allowLeapDay: boolean): number {
  if (month === 2 && allowLeapDay) return 29;
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Accepts MM-DD, including 02-29.
 * @example validMonthDay("12-20") // "12-20"
 */
function validMonthDay(value: string): string | null {
  const match = value.match(/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/);
  if (!match) return null;
  const month = Number(value.slice(0, 2));
  const day = Number(value.slice(3, 5));
  if (day > daysInMonth(2024, month, true)) return null;
  return value;
}

/**
 * Accepts a real YYYY-MM-DD, including leap-day rules for that year.
 * @example validIsoDate("2026-11-08") // "2026-11-08"
 */
function validIsoDate(value: string): string | null {
  const match = value.match(/^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (day > daysInMonth(year, month, false)) return null;
  return value;
}

/**
 * Parses one schedule, keeping the preset's kind (annual vs dated).
 * @example parseSchedule({}, preset) // preset.schedule
 */
function parseSchedule(value: unknown, preset: SeasonPreset): SeasonSchedule {
  const row = asRecord(value);
  if (preset.schedule.kind === "dated") {
    const start = validIsoDate(str(row.start)) ?? preset.schedule.start;
    const end = validIsoDate(str(row.end)) ?? preset.schedule.end;
    return { kind: "dated", start, end };
  }
  const start = validMonthDay(str(row.start)) ?? preset.schedule.start;
  const end = validMonthDay(str(row.end)) ?? preset.schedule.end;
  return { kind: "annual", start, end };
}

/**
 * Parses a palette, filling gaps from the preset.
 * @example parseSeasonPalette({}, preset.palette) // SeasonPalette
 */
function parseSeasonPalette(value: unknown, fallback: SeasonPalette): SeasonPalette {
  const row = asRecord(value);
  const light = asRecord(row.light);
  const dark = asRecord(row.dark);
  const color = (source: Record<string, unknown>, key: keyof ThemePalette, preset: ThemePalette) =>
    normalizeHex(source[key], preset[key]);
  return {
    brandFrom: normalizeHex(row.brandFrom, fallback.brandFrom),
    brandTo: normalizeHex(row.brandTo, fallback.brandTo),
    light: {
      background: color(light, "background", fallback.light),
      foreground: color(light, "foreground", fallback.light),
      card: color(light, "card", fallback.light),
      chip: color(light, "chip", fallback.light),
      accentText: color(light, "accentText", fallback.light),
      accentHover: color(light, "accentHover", fallback.light),
      badge: color(light, "badge", fallback.light),
    },
    dark: {
      background: color(dark, "background", fallback.dark),
      foreground: color(dark, "foreground", fallback.dark),
      card: color(dark, "card", fallback.dark),
      chip: color(dark, "chip", fallback.dark),
      accentText: color(dark, "accentText", fallback.dark),
      accentHover: color(dark, "accentHover", fallback.dark),
      badge: color(dark, "badge", fallback.dark),
    },
  };
}

/**
 * Reads stored season JSON. Missing data stays off and keeps the three packs.
 * Saved item order is preserved: the first matching card wins on the site.
 * @example parseSeasons(undefined) // DEFAULT_SEASONS
 */
export function parseSeasons(value: unknown): SeasonsSettings {
  const row = asRecord(value);
  const modeRaw = str(row.mode);
  const mode: SeasonMode =
    modeRaw === "manual" || modeRaw === "schedule" || modeRaw === "off" ? modeRaw : "off";
  const manualRaw = str(row.manualId);
  const timezoneRaw = str(row.timezone);

  // Read the saved array once, keyed by id, in the order it was stored.
  const saved = new Map<string, Record<string, unknown>>();
  const order: string[] = [];
  if (Array.isArray(row.items)) {
    for (const item of row.items) {
      const entry = asRecord(item);
      const id = str(entry.id);
      if (id && !saved.has(id)) {
        saved.set(id, entry);
        order.push(id);
      }
    }
  }

  // Rebuild items in saved order so reordering survives a round trip.
  const items: SeasonConfig[] = [];
  const seen = new Set<string>();
  let customs = 0;
  for (const id of order) {
    const entry = saved.get(id);
    if (!entry) continue;
    const preset = getSeasonPreset(id);
    if (preset) {
      items.push(parseBuiltInSeason(entry, preset));
      seen.add(id);
    } else if (isCustomSeasonId(id) && customs < MAX_CUSTOM_SEASONS) {
      const season = parseCustomSeason(entry);
      if (!season) continue;
      items.push(season);
      seen.add(id);
      customs += 1;
    }
  }

  // Any built-in pack that was not stored still exists, appended after the saved order.
  const deletedIds = Array.isArray(row.deletedIds)
    ? row.deletedIds.map((id) => str(id)).filter(Boolean)
    : [];
  for (const preset of SEASON_PRESETS) {
    if (seen.has(preset.id) || deletedIds.includes(preset.id)) continue;
    items.push(configFromPreset(preset, true));
    seen.add(preset.id);
  }

  return {
    mode,
    manualId: items.some((item) => item.id === manualRaw) ? manualRaw : null,
    timezone: isTimeZone(timezoneRaw) ? timezoneRaw : DEFAULT_SEASON_TIMEZONE,
    items,
    ornaments: parseSeasonOrnaments(row.ornaments),
    deletedIds,
  };
}

/**
 * Reads user-chosen positions for ornament images, dropping unmapped or invalid positions.
 * @example parseOrnamentPositions({ "/a.png": "top-left" }, ["/a.png"]) // { "/a.png": "top-left" }
 */
export function parseOrnamentPositions(
  value: unknown,
  allowedImages: string[],
): Record<string, OrnamentPosition> {
  const row = asRecord(value);
  const result: Record<string, OrnamentPosition> = {};
  for (const img of allowedImages) {
    const raw = str(row[img]).trim();
    if (isOrnamentPosition(raw)) {
      result[img] = raw;
    }
  }
  return result;
}

/**
 * Reads placement groups, validating each property and sanitizing asset URLs.
 * @example parsePlacements([{ name: "Header Garland", position: "header" }])
 */
export function parsePlacements(value: unknown): PlacementGroup[] {
  if (!Array.isArray(value)) return [];
  const groups: PlacementGroup[] = [];
  const seenIds = new Set<string>();

  for (const item of value) {
    const row = asRecord(item);
    let id = str(row.id).trim().slice(0, 64);
    if (!id || seenIds.has(id)) {
      id = `pg-${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
    }
    seenIds.add(id);

    const name = str(row.name).replace(/[\u0000-\u001F]/g, "").trim().slice(0, 60) || "Placement";

    const posRaw = str(row.position);
    const position: PlacementPosition = VALID_PLACEMENT_POSITIONS.has(posRaw)
      ? (posRaw as PlacementPosition)
      : "header";

    const alignRaw = str(row.alignment);
    const alignment: PlacementAlignment = VALID_PLACEMENT_ALIGNMENTS.has(alignRaw)
      ? (alignRaw as PlacementAlignment)
      : "center";

    const orientRaw = str(row.orientation);
    const orientation: PlacementOrientation = VALID_PLACEMENT_ORIENTATIONS.has(orientRaw)
      ? (orientRaw as PlacementOrientation)
      : "horizontal";

    const rawAssets = Array.isArray(row.assets) ? row.assets : [];
    const assets: string[] = [];
    for (const a of rawAssets) {
      if (typeof a !== "string") continue;
      const url = seasonOrnamentImageUrl(a);
      if (url) {
        assets.push(url);
      }
      if (assets.length >= 24) break;
    }

    const repeatNum = Number(row.repeat);
    const repeat = Number.isFinite(repeatNum) ? Math.max(1, Math.min(20, Math.floor(repeatNum))) : 1;

    const spacingNum = Number(row.spacing);
    const spacing = Number.isFinite(spacingNum) ? Math.max(0, Math.min(20, Number(spacingNum.toFixed(2)))) : 2;

    const sizeRaw = str(row.size);
    const size: PlacementSize = VALID_PLACEMENT_SIZES.has(sizeRaw) ? (sizeRaw as PlacementSize) : "medium";

    const customSizeNum = Number(row.customSize);
    const customSize = Number.isFinite(customSizeNum) ? Math.max(0.5, Math.min(15, Number(customSizeNum.toFixed(2)))) : 3;

    const animRaw = str(row.animation);
    const animation: PlacementAnimation = VALID_PLACEMENT_ANIMATIONS.has(animRaw)
      ? (animRaw as PlacementAnimation)
      : "sway";

    const intenRaw = str(row.animationIntensity);
    const animationIntensity: PlacementAnimationIntensity = VALID_PLACEMENT_INTENSITIES.has(intenRaw)
      ? (intenRaw as PlacementAnimationIntensity)
      : "normal";

    const visRaw = str(row.visibility);
    const visibility: PlacementVisibility = VALID_PLACEMENT_VISIBILITIES.has(visRaw)
      ? (visRaw as PlacementVisibility)
      : "all";

    let customCoordinates: PlacementCoordinates | undefined;
    if (row.customCoordinates && typeof row.customCoordinates === "object") {
      const coords = asRecord(row.customCoordinates);
      const top = str(coords.top).trim().slice(0, 32);
      const bottom = str(coords.bottom).trim().slice(0, 32);
      const left = str(coords.left).trim().slice(0, 32);
      const right = str(coords.right).trim().slice(0, 32);
      if (top || bottom || left || right) {
        customCoordinates = {
          ...(top ? { top } : {}),
          ...(bottom ? { bottom } : {}),
          ...(left ? { left } : {}),
          ...(right ? { right } : {}),
        };
      }
    }

    groups.push({
      id,
      name,
      position,
      alignment,
      orientation,
      assets,
      repeat,
      spacing,
      size,
      customSize,
      animation,
      animationIntensity,
      visibility,
      customCoordinates,
    });

    if (groups.length >= 30) break;
  }

  return groups;
}

/**
 * Synthesizes placement groups from legacy ornamentPositions and ornamentImages.
 */
export function synthesizePlacementsFromLegacy(
  positions: Record<string, OrnamentPosition>,
  images: string[],
): PlacementGroup[] {
  const groups: PlacementGroup[] = [];
  const headerAssets: string[] = [];
  const bottomAssets: string[] = [];
  const sideAssets: string[] = [];
  const cornerAssets: string[] = [];

  for (const img of images) {
    const pos = positions[img] || "top-center";
    if (pos === "top-center") {
      headerAssets.push(img);
    } else if (pos === "top-left" || pos === "top-right") {
      cornerAssets.push(img);
    } else if (pos === "bottom-left" || pos === "bottom-right" || pos === "bottom-center") {
      bottomAssets.push(img);
    } else if (pos === "left-center" || pos === "right-center") {
      sideAssets.push(img);
    } else {
      headerAssets.push(img);
    }
  }

  if (headerAssets.length > 0) {
    groups.push(
      createPlacementGroup({
        name: "Header Garland",
        position: "header",
        alignment: "center",
        orientation: "horizontal",
        assets: headerAssets,
        repeat: 1,
        spacing: 2,
        size: "medium",
        animation: "sway",
      }),
    );
  }
  if (bottomAssets.length > 0) {
    groups.push(
      createPlacementGroup({
        name: "Floor Diyas",
        position: "bottom-edge",
        alignment: "center",
        orientation: "horizontal",
        assets: bottomAssets,
        repeat: 1,
        spacing: 2.5,
        size: "medium",
        animation: "flicker",
      }),
    );
  }
  if (sideAssets.length > 0) {
    groups.push(
      createPlacementGroup({
        name: "Side Borders",
        position: "left-edge",
        alignment: "center",
        orientation: "vertical",
        assets: sideAssets,
        repeat: 1,
        spacing: 3,
        size: "medium",
        animation: "twinkle",
      }),
    );
  }
  if (cornerAssets.length > 0) {
    groups.push(
      createPlacementGroup({
        name: "Corners",
        position: "corners",
        alignment: "stretch",
        orientation: "horizontal",
        assets: cornerAssets,
        repeat: 1,
        spacing: 2,
        size: "medium",
        animation: "sway",
      }),
    );
  }

  return groups;
}

/**
 * Reads one built-in pack, keeping its preset name and schedule kind.
 * @example parseBuiltInSeason({}, getSeasonPreset("halloween")!) // SeasonConfig
 */
function parseBuiltInSeason(entry: Record<string, unknown>, preset: SeasonPreset): SeasonConfig {
  const intensityRaw = str(entry.intensity);
  const intensity: SeasonIntensity = intensityRaw === "subtle" ? "subtle" : "full";
  const ornamentImages = parseOrnamentImages(entry.ornamentImages);
  const ornamentPositions = parseOrnamentPositions(entry.ornamentPositions, ornamentImages);
  let placements = entry.placements !== undefined ? parsePlacements(entry.placements) : undefined;
  if (placements === undefined && (ornamentImages.length > 0 || Object.keys(ornamentPositions).length > 0)) {
    placements = synthesizePlacementsFromLegacy(ornamentPositions, ornamentImages);
  } else if (placements === undefined) {
    placements = [];
  }

  for (const group of placements) {
    for (const a of group.assets) {
      if (!ornamentImages.includes(a)) {
        ornamentImages.push(a);
      }
    }
  }

  const rawCursor = seasonOrnamentImageUrl(str(entry.cursorOrnament));
  return {
    id: preset.id,
    name: parseSeasonName(entry.name) || preset.name,
    enabled: bool(entry.enabled, true),
    schedule: parseSchedule(entry.schedule, preset),
    intensity: intensityRaw === "full" || intensityRaw === "subtle" ? intensity : preset.intensity,
    palette: parseSeasonPalette(entry.palette, preset.palette),
    ornamentImages,
    cursorOrnament: rawCursor && ornamentImages.includes(rawCursor) ? rawCursor : null,
    ornamentPositions,
    placements,
  };
}

/**
 * Reads one added festival. A bad id or date window is dropped.
 * @example parseCustomSeason({ id: "fest-ab12cd34ef56" }) // SeasonConfig | null
 */
function parseCustomSeason(entry: Record<string, unknown>): SeasonConfig | null {
  const id = str(entry.id);
  if (!isCustomSeasonId(id)) return null;
  const schedule = parseCustomSchedule(entry.schedule);
  if (!schedule) return null;
  const intensityRaw = str(entry.intensity);
  const ornamentImages = parseOrnamentImages(entry.ornamentImages);
  const ornamentPositions = parseOrnamentPositions(entry.ornamentPositions, ornamentImages);
  let placements = entry.placements !== undefined ? parsePlacements(entry.placements) : undefined;
  if (placements === undefined && (ornamentImages.length > 0 || Object.keys(ornamentPositions).length > 0)) {
    placements = synthesizePlacementsFromLegacy(ornamentPositions, ornamentImages);
  } else if (placements === undefined) {
    placements = [];
  }

  for (const group of placements) {
    for (const a of group.assets) {
      if (!ornamentImages.includes(a)) {
        ornamentImages.push(a);
      }
    }
  }

  const rawCursor = seasonOrnamentImageUrl(str(entry.cursorOrnament));
  return {
    id,
    name: parseSeasonName(entry.name),
    enabled: bool(entry.enabled, true),
    schedule,
    intensity: intensityRaw === "subtle" ? "subtle" : "full",
    palette: parseSeasonPalette(entry.palette, CUSTOM_SEASON_PALETTE),
    ornamentImages,
    cursorOrnament: rawCursor && ornamentImages.includes(rawCursor) ? rawCursor : null,
    ornamentPositions,
    placements,
  };
}

/**
 * Keeps a short display name. Blank stays blank.
 * @example parseSeasonName("  Holi  ") // "Holi"
 */
function parseSeasonName(value: unknown): string {
  return str(value)
    .replace(/[\u0000-\u001F]/g, "")
    .trim()
    .slice(0, 60);
}

/**
 * Reads an added festival's window. Either kind is allowed.
 * @example parseCustomSchedule({ kind: "annual", start: "03-01", end: "03-08" }) // SeasonSchedule | null
 */
function parseCustomSchedule(value: unknown): SeasonSchedule | null {
  const row = asRecord(value);
  const kind = str(row.kind);
  if (kind === "annual") {
    const start = validMonthDay(str(row.start));
    const end = validMonthDay(str(row.end));
    if (!start || !end) return null;
    return { kind: "annual", start, end };
  }
  if (kind === "dated") {
    const start = validIsoDate(str(row.start));
    const end = validIsoDate(str(row.end));
    if (!start || !end) return null;
    return { kind: "dated", start, end };
  }
  return null;
}

/**
 * YYYY-MM-DD for a zoned calendar day.
 * @example isoFromParts({ year: 2026, month: 11, day: 8 }) // "2026-11-08"
 */
function isoFromParts(parts: { year: number; month: number; day: number }): string {
  const month = String(parts.month).padStart(2, "0");
  const day = String(parts.day).padStart(2, "0");
  return `${parts.year}-${month}-${day}`;
}

/**
 * MM-DD for a zoned calendar day.
 * @example monthDayFromParts({ month: 12, day: 20 }) // "12-20"
 */
function monthDayFromParts(parts: { month: number; day: number }): string {
  return `${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

/**
 * Inclusive annual match. When start is after end, the window crosses New Year.
 * @example inAnnualWindow("01-02", "12-20", "01-06") // true
 */
export function inAnnualWindow(monthDay: string, start: string, end: string): boolean {
  if (start <= end) return monthDay >= start && monthDay <= end;
  return monthDay >= start || monthDay <= end;
}

/**
 * True when this season's window contains the zoned day. Disabled rows do not match.
 * An inverted dated range matches nothing.
 * @example seasonWindowContains(season, parts) // boolean
 */
export function seasonWindowContains(
  season: SeasonConfig,
  parts: { year: number; month: number; day: number },
): boolean {
  if (!season.enabled) return false;
  if (season.schedule.kind === "annual") {
    return inAnnualWindow(monthDayFromParts(parts), season.schedule.start, season.schedule.end);
  }
  const iso = isoFromParts(parts);
  if (season.schedule.start > season.schedule.end) return false;
  return iso >= season.schedule.start && iso <= season.schedule.end;
}

/**
 * True when a dated window is entirely in the past.
 * @example datedWindowEnded(season, parts) // boolean
 */
export function datedWindowEnded(
  season: SeasonConfig,
  parts: { year: number; month: number; day: number },
): boolean {
  if (season.schedule.kind !== "dated") return false;
  if (season.schedule.start > season.schedule.end) return false;
  return isoFromParts(parts) > season.schedule.end;
}

/**
 * Enabled seasons whose windows contain this instant, in item (priority) order.
 * @example seasonsMatchingToday(settings, now) // SeasonConfig[]
 */
export function seasonsMatchingToday(settings: SeasonsSettings, now: Date): SeasonConfig[] {
  const parts = zonedDateParts(now, settings.timezone);
  return settings.items.filter((season) => seasonWindowContains(season, parts));
}

/**
 * Season to paint, or null when the site should keep the year-round theme.
 * Manual mode ignores dates. Schedule mode uses the first matching card.
 * @example resolveActiveSeason(settings, now) // SeasonConfig | null
 */
export function resolveActiveSeason(
  settings: SeasonsSettings | null | undefined,
  now: Date,
): SeasonConfig | null {
  const seasons = settings ?? DEFAULT_SEASONS;
  if (seasons.mode === "off") return null;
  if (seasons.mode === "manual") {
    if (!seasons.manualId) return null;
    return seasons.items.find((season) => season.id === seasons.manualId) ?? null;
  }
  return seasonsMatchingToday(seasons, now)[0] ?? null;
}

/**
 * True when a live season should paint ornaments and its cursor.
 * "Palette only" keeps colors but hides every decoration on the public site.
 * @example showsSeasonDecorations(activeSeason) // true | false
 */
export function showsSeasonDecorations(
  season: SeasonConfig | null | undefined,
): season is SeasonConfig {
  return season?.intensity === "full";
}

/**
 * Resolves the ornament image to use as cursor for the currently live season.
 * Returns null if no season is live, the season is palette-only, or no ornament cursor is configured.
 * @example resolveActiveCursorOrnament(settings, new Date()) // "/uploads/artifacts/diya.png" | null
 */
export function resolveActiveCursorOrnament(
  settings: SeasonsSettings | null | undefined,
  now: Date = new Date(),
): string | null {
  const season = resolveActiveSeason(settings, now);
  if (!showsSeasonDecorations(season) || !season.cursorOrnament) return null;
  return season.ornamentImages.includes(season.cursorOrnament) ? season.cursorOrnament : null;
}

/**
 * The season the calendar would pick on an ISO date in the season timezone.
 * Forces schedule mode so a preview date always reads the calendar, not the saved switch.
 * @example seasonForIsoDate(settings, "2026-12-25") // christmas | null
 */
export function seasonForIsoDate(settings: SeasonsSettings, iso: string): SeasonConfig | null {
  return resolveActiveSeason({ ...settings, mode: "schedule" }, new Date(`${iso}T12:00:00Z`));
}

/**
 * Applies a season palette on top of the saved theme. Null keeps the theme.
 * @example themeWithSeason(theme, null) // theme
 */
export function themeWithSeason(base: ThemeContent, season: SeasonConfig | null): ThemeContent {
  if (!season) return base;
  return {
    ...base,
    brandFrom: season.palette.brandFrom,
    brandTo: season.palette.brandTo,
    light: { ...season.palette.light },
    dark: { ...season.palette.dark },
  };
}

/**
 * Preset for a season id. Used by the reset control.
 * @example presetForSeason("christmas") // SeasonPreset
 */
export function presetForSeason(id: SeasonId): SeasonPreset {
  const preset = getSeasonPreset(id);
  if (!preset) throw new Error(`Unknown season ${id}`);
  return preset;
}
