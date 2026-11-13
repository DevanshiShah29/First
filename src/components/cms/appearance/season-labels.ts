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
