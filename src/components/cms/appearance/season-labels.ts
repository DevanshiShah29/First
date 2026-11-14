import { getSeasonPreset } from "@/content/season-presets";
import type { SeasonConfig, SeasonMode } from "@/content/seasons";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export type SeasonCardFlag = "showing" | "off" | "ended" | "dates";

/**
 * Display name for a season id.
 * @example seasonName(season) // "Diwali"
 */
export function seasonName(season: SeasonConfig): string {
  const preset = getSeasonPreset(season.id);
  if (preset) return preset.name;
  const name = season.name.trim();
  return name || "Festival";
}

/**
 * Readable window, including the year for a one-off range.
 * @example scheduleSummary({ kind: "annual", start: "10-25", end: "11-01" }) // "Every year, October 25 – November 1"
 */
export function scheduleSummary(schedule: SeasonConfig["schedule"]): string {
  if (schedule.kind === "annual") {
    return `Every year, ${formatMonthDay(schedule.start)} – ${formatMonthDay(schedule.end)}`;
  }
  return `${formatIso(schedule.start)} – ${formatIso(schedule.end)}`;
}

/**
 * Short look label used on the season card.
 * @example intensitySummary("full") // "Palette and ornaments"
 */
export function intensitySummary(intensity: SeasonConfig["intensity"]): string {
  return intensity === "subtle" ? "Palette only" : "Palette and ornaments";
}

/**
 * Calendar day in the season timezone.
 * @example formatZonedDate({ year: 2026, month: 10, day: 9 }) // "October 9, 2026"
 */
export function formatZonedDate(parts: { year: number; month: number; day: number }): string {
  const month = MONTHS[parts.month - 1] ?? "";
  return `${month} ${parts.day}, ${parts.year}`;
}

/**
 * Headline for the mode that is selected.
 * @example seasonStatusCopy("off", null) // { title: "Year-round theme", … }
 */
export function seasonStatusCopy(
  mode: SeasonMode,
  active: SeasonConfig | null,
): { title: string; detail: string; quiet: boolean } {
  if (mode === "off") {
    return {
      title: "Year-round theme",
      detail: "Seasons are off. Visitors see the Appearance theme. The cards below stay saved.",
      quiet: true,
    };
  }
  if (mode === "manual") {
    return active
      ? {
          title: `Showing ${seasonName(active)}`,
          detail: "This season is forced on, so its dates do not matter.",
          quiet: false,
        }
      : {
          title: "Year-round theme",
          detail: "Force is on, but no season is chosen.",
          quiet: true,
        };
  }
  return active
    ? {
        title: `Showing ${seasonName(active)}`,
        detail: "This is the first season whose dates include today.",
        quiet: false,
      }
    : {
        title: "Year-round theme",
        detail: "No season’s dates include today.",
        quiet: true,
      };
}

/**
 * The one flag a card should shout, if any.
 * @example seasonCardFlag(item, false, false, false) // "off"
 */
export function seasonCardFlag(
  item: SeasonConfig,
  showing: boolean,
  ended: boolean,
  inverted: boolean,
): SeasonCardFlag | null {
  if (showing) return "showing";
  if (inverted) return "dates";
  if (ended) return "ended";
  if (!item.enabled) return "off";
  return null;
}

/**
 * Month and day from MM-DD.
 * @example formatMonthDay("12-05") // "December 5"
 */
function formatMonthDay(value: string): string {
  const month = Number(value.slice(0, 2));
  const day = Number(value.slice(3, 5));
  return `${MONTHS[month - 1] ?? ""} ${day}`;
}

/**
 * Month, day, and year from YYYY-MM-DD.
 * @example formatIso("2026-11-06") // "November 6, 2026"
 */
function formatIso(value: string): string {
  const [year, month, day] = value.split("-");
  return `${MONTHS[Number(month) - 1] ?? ""} ${Number(day)}, ${year}`;
}

type DayParts = { year: number; month: number; day: number };

/** YYYY-MM-DD into calendar parts. */
function isoParts(value: string): DayParts {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
}

/** MM-DD into calendar parts for a given year. */
function monthDayParts(year: number, value: string): DayParts {
  return { year, month: Number(value.slice(0, 2)), day: Number(value.slice(3, 5)) };
}

/** Whole days from a to b (positive when b is later). */
function daysBetween(a: DayParts, b: DayParts): number {
  return Math.round(
    (Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / 86_400_000,
  );
}

function pluralDays(n: number): string {
  return `${n} day${n === 1 ? "" : "s"}`;
}

/**
 * Short countdown for a season card, or null when there is nothing to say.
 * @example seasonCountdown(christmas, { year: 2026, month: 12, day: 1 }) // "Starts in 19 days"
 */
export function seasonCountdown(item: SeasonConfig, parts: DayParts): string | null {
  if (item.schedule.kind === "dated") {
    const toStart = daysBetween(parts, isoParts(item.schedule.start));
    const toEnd = daysBetween(parts, isoParts(item.schedule.end));
    if (toStart > 0) return `Starts in ${pluralDays(toStart)}`;
    if (toEnd >= 0) return toEnd === 0 ? "Ends today" : `Ends in ${pluralDays(toEnd)}`;
    return null;
  }
  if (item.schedule.start > item.schedule.end) return null;
  const start = monthDayParts(parts.year, item.schedule.start);
  const end = monthDayParts(parts.year, item.schedule.end);
  const toStart = daysBetween(parts, start);
  const toEnd = daysBetween(parts, end);
  if (toStart > 0) return `Starts in ${pluralDays(toStart)}`;
  if (toEnd >= 0) return toEnd === 0 ? "Ends today" : `Ends in ${pluralDays(toEnd)}`;
  const nextStart = monthDayParts(parts.year + 1, item.schedule.start);
  return `Starts in ${pluralDays(daysBetween(parts, nextStart))}`;
}
