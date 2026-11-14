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
};

export type SeasonsSettings = {
  mode: SeasonMode;
  manualId: string | null;
  timezone: string;
  items: SeasonConfig[];
  /** Shared ornament catalogue. Seasons map to these by image URL. */
  ornaments: SeasonOrnament[];
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
  for (const preset of SEASON_PRESETS) {
    if (seen.has(preset.id)) continue;
    items.push(configFromPreset(preset, true));
    seen.add(preset.id);
  }

  return {
    mode,
    manualId: items.some((item) => item.id === manualRaw) ? manualRaw : null,
    timezone: isTimeZone(timezoneRaw) ? timezoneRaw : DEFAULT_SEASON_TIMEZONE,
    items,
    ornaments: parseSeasonOrnaments(row.ornaments),
  };
}

/**
 * Reads one built-in pack, keeping its preset name and schedule kind.
 * @example parseBuiltInSeason({}, getSeasonPreset("halloween")!) // SeasonConfig
 */
function parseBuiltInSeason(entry: Record<string, unknown>, preset: SeasonPreset): SeasonConfig {
  const intensityRaw = str(entry.intensity);
  const intensity: SeasonIntensity = intensityRaw === "subtle" ? "subtle" : "full";
  const ornamentImages = parseOrnamentImages(entry.ornamentImages);
  const rawCursor = seasonOrnamentImageUrl(str(entry.cursorOrnament));
  return {
    id: preset.id,
    name: preset.name,
    enabled: bool(entry.enabled, true),
    schedule: parseSchedule(entry.schedule, preset),
    intensity: intensityRaw === "full" || intensityRaw === "subtle" ? intensity : preset.intensity,
    palette: parseSeasonPalette(entry.palette, preset.palette),
    ornamentImages,
    cursorOrnament: rawCursor && ornamentImages.includes(rawCursor) ? rawCursor : null,
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
 * Resolves the ornament image to use as cursor for the currently live season.
 * Returns null if no season is live or if the live season has no ornament cursor configured.
 * @example resolveActiveCursorOrnament(settings, new Date()) // "/uploads/artifacts/diya.png" | null
 */
export function resolveActiveCursorOrnament(
  settings: SeasonsSettings | null | undefined,
  now: Date = new Date(),
): string | null {
  const season = resolveActiveSeason(settings, now);
  if (!season || !season.cursorOrnament) return null;
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
