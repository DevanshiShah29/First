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

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export type SeasonCardFlag = "showing" | "upcoming" | "ended" | "overlapping" | "dates";

/**
 * Display name for a season. Checks custom name first, then preset name.
 * @example seasonName(season) // "Diwali"
 */
export function seasonName(season: SeasonConfig): string {
  const name = season.name.trim();
  if (name) return name;
  const preset = getSeasonPreset(season.id);
  if (preset) return preset.name;
  return "Festival";
}

/**
 * Month and day from MM-DD in short form.
 * @example formatCompactMonthDay("12-05") // "Dec 5"
 */
function formatCompactMonthDay(value: string): string {
  const month = Number(value.slice(0, 2));
  const day = Number(value.slice(3, 5));
  return `${SHORT_MONTHS[month - 1] ?? ""} ${day}`;
}

/**
 * Compact date range for season row.
 * @example scheduleSummary({ kind: "annual", start: "10-25", end: "11-01" }) // "Oct 25 – Nov 1"
 */
export function scheduleSummary(schedule: SeasonConfig["schedule"]): string {
  if (schedule.kind === "annual") {
    return `${formatCompactMonthDay(schedule.start)} – ${formatCompactMonthDay(schedule.end)}`;
  }
  const [startYear, startMonth, startDay] = schedule.start.split("-");
  const [endYear, endMonth, endDay] = schedule.end.split("-");
  const sMonth = SHORT_MONTHS[Number(startMonth) - 1] ?? "";
  const eMonth = SHORT_MONTHS[Number(endMonth) - 1] ?? "";
  const sDay = Number(startDay);
  const eDay = Number(endDay);

  if (schedule.start === schedule.end) {
    return `${sMonth} ${sDay}, ${startYear}`;
  }
  if (startYear === endYear) {
    if (startMonth === endMonth) {
      return `${sMonth} ${sDay} – ${eDay}, ${startYear}`;
    }
    return `${sMonth} ${sDay} – ${eMonth} ${eDay}, ${startYear}`;
  }
  return `${sMonth} ${sDay}, ${startYear} – ${eMonth} ${eDay}, ${endYear}`;
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
 * True when a festival is not currently active.
 */
export function seasonIsUpcoming(item: SeasonConfig, parts: DayParts): boolean {
  if (item.schedule.kind === "dated") {
    if (item.schedule.start > item.schedule.end) return false;
    const todayIso = isoFromParts(parts);
    return todayIso < item.schedule.start || todayIso > item.schedule.end;
  }
  const todayMd = `${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
  if (item.schedule.start > item.schedule.end) {
    return todayMd < item.schedule.start && todayMd > item.schedule.end;
  }
  return todayMd < item.schedule.start || todayMd > item.schedule.end;
}

/**
 * Computes the status badges for a season row: Showing, Upcoming, Overlapping, Check dates.
 */
export function seasonBadges(
  item: SeasonConfig,
  showing: boolean,
  _ended: boolean,
  inverted: boolean,
  overlap: boolean,
  parts: DayParts,
): { id: "showing" | "upcoming" | "ended" | "overlapping" | "dates"; label: string }[] {
  if (inverted) {
    return [{ id: "dates", label: "Check dates" }];
  }
  const badges: { id: "showing" | "upcoming" | "ended" | "overlapping" | "dates"; label: string }[] = [];
  if (showing) {
    badges.push({ id: "showing", label: "Showing" });
  } else if (seasonIsUpcoming(item, parts)) {
    badges.push({ id: "upcoming", label: "Upcoming" });
  }
  if (overlap && !showing) {
    badges.push({ id: "overlapping", label: "Overlapping" });
  }
  return badges;
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
  return null;
}

type DayParts = { year: number; month: number; day: number };

/** YYYY-MM-DD for a calendar day. */
function isoFromParts(parts: DayParts): string {
  const month = String(parts.month).padStart(2, "0");
  const day = String(parts.day).padStart(2, "0");
  return `${parts.year}-${month}-${day}`;
}

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
 * Short countdown for a season card.
 * Returns "Ends in X days", "Ends today", "Starts in X days", or null for invalid dates.
 * @example seasonCountdown(christmas, { year: 2026, month: 12, day: 1 }) // "Starts in 19 days"
 */
export function seasonCountdown(item: SeasonConfig, parts: DayParts): string | null {
  const todayIso = isoFromParts(parts);
  const todayMd = `${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;

  if (item.schedule.kind === "dated") {
    const startIso = item.schedule.start;
    const endIso = item.schedule.end;
    if (startIso > endIso) return null;

    // Active today
    if (todayIso >= startIso && todayIso <= endIso) {
      const toEnd = daysBetween(parts, isoParts(endIso));
      return toEnd === 0 ? "Ends today" : `Ends in ${pluralDays(toEnd)}`;
    }

    // Future start
    if (todayIso < startIso) {
      const toStart = daysBetween(parts, isoParts(startIso));
      return toStart === 0 ? "Starts today" : `Starts in ${pluralDays(toStart)}`;
    }

    // Dated window passed: project to next recurring annual occurrence
    const startMd = startIso.slice(5);
    const nextYear = todayMd < startMd ? parts.year : parts.year + 1;
    const nextStart = monthDayParts(nextYear, startMd);
    const toNext = daysBetween(parts, nextStart);
    return `Starts in ${pluralDays(toNext)}`;
  }

  // Annual schedule
  const startMd = item.schedule.start;
  const endMd = item.schedule.end;

  const inWindow =
    startMd <= endMd
      ? todayMd >= startMd && todayMd <= endMd
      : todayMd >= startMd || todayMd <= endMd;

  if (inWindow) {
    const daysToEnd =
      startMd <= endMd
        ? daysBetween(parts, monthDayParts(parts.year, endMd))
        : todayMd >= startMd
          ? daysBetween(parts, monthDayParts(parts.year + 1, endMd))
          : daysBetween(parts, monthDayParts(parts.year, endMd));
    return daysToEnd === 0 ? "Ends today" : `Ends in ${pluralDays(daysToEnd)}`;
  }

  // Annual crossing New Year, today between endMd and startMd
  if (startMd > endMd) {
    const startParts = monthDayParts(parts.year, startMd);
    const toStart = daysBetween(parts, startParts);
    return `Starts in ${pluralDays(toStart)}`;
  }

  // Same-year annual
  const thisYearStart = monthDayParts(parts.year, startMd);
  const toThisYear = daysBetween(parts, thisYearStart);
  if (toThisYear > 0) {
    return `Starts in ${pluralDays(toThisYear)}`;
  }

  const nextYearStart = monthDayParts(parts.year + 1, startMd);
  return `Starts in ${pluralDays(daysBetween(parts, nextYearStart))}`;
}

/**
 * Distance metric in days from `today` to a season's active window or nearest start.
 * Negative for currently active seasons (placed at the very top).
 * Positive numbers for upcoming seasons (ordered chronologically by days until start).
 * Invalid dates return 999999 (placed at the bottom).
 */
export function seasonNearestDistance(item: SeasonConfig, today: DayParts): number {
  const todayIso = isoFromParts(today);
  const todayMd = `${String(today.month).padStart(2, "0")}-${String(today.day).padStart(2, "0")}`;

  if (item.schedule.kind === "dated") {
    const startIso = item.schedule.start;
    const endIso = item.schedule.end;
    if (startIso > endIso) return 999999;

    // Active today
    if (todayIso >= startIso && todayIso <= endIso) {
      const daysToEnd = daysBetween(today, isoParts(endIso));
      return -10000 + daysToEnd;
    }
    // Upcoming in future
    if (todayIso < startIso) {
      return daysBetween(today, isoParts(startIso));
    }
    // Dated window passed: distance to next recurring occurrence
    const startMd = startIso.slice(5);
    const nextYear = todayMd < startMd ? today.year : today.year + 1;
    const nextStartParts = monthDayParts(nextYear, startMd);
    return daysBetween(today, nextStartParts);
  }

  // Annual schedule
  const startMd = item.schedule.start;
  const endMd = item.schedule.end;

  const inWindow =
    startMd <= endMd
      ? todayMd >= startMd && todayMd <= endMd
      : todayMd >= startMd || todayMd <= endMd;

  if (inWindow) {
    const daysToEnd =
      startMd <= endMd
        ? daysBetween(today, monthDayParts(today.year, endMd))
        : todayMd >= startMd
          ? daysBetween(today, monthDayParts(today.year + 1, endMd))
          : daysBetween(today, monthDayParts(today.year, endMd));
    return -10000 + daysToEnd;
  }

  // Annual window crossing New Year (e.g. 12-31 to 01-02), today between end and start
  if (startMd > endMd) {
    const startParts = monthDayParts(today.year, startMd);
    return daysBetween(today, startParts);
  }

  const thisYearStart = monthDayParts(today.year, startMd);
  const toThisYear = daysBetween(today, thisYearStart);
  if (toThisYear > 0) {
    return toThisYear;
  }

  const nextYearStart = monthDayParts(today.year + 1, startMd);
  return daysBetween(today, nextYearStart);
}

/**
 * Sorts festivals by nearest date (active first, then upcoming chronologically, then ended).
 * @example sortSeasonsByNearestDate(items, today) // SeasonConfig[]
 */
export function sortSeasonsByNearestDate(items: SeasonConfig[], today: DayParts): SeasonConfig[] {
  return [...items].sort((a, b) => {
    const distA = seasonNearestDistance(a, today);
    const distB = seasonNearestDistance(b, today);
    if (distA !== distB) return distA - distB;
    return seasonName(a).localeCompare(seasonName(b));
  });
}
