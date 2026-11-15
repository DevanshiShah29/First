import type { SeasonConfig } from "@/content/seasons";

export type DayParts = { year: number; month: number; day: number };

export type SeasonSegment = { start: number; end: number };

/** Days in a year, leap-aware. */
export function daysInYear(year: number): number {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
}

/** Whole days from Jan 1 of `year` to the date (0 = Jan 1; may be negative). */
export function dayOffset(parts: DayParts, year: number): number {
  return Math.round(
    (Date.UTC(parts.year, parts.month - 1, parts.day) - Date.UTC(year, 0, 1)) / 86_400_000,
  );
}

/** YYYY-MM-DD into calendar parts. */
export function isoParts(value: string): DayParts {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
}

/** MM-DD into calendar parts for a given year. */
function monthDayParts(year: number, value: string): DayParts {
  return { year, month: Number(value.slice(0, 2)), day: Number(value.slice(3, 5)) };
}

/**
 * Day spans a season covers in `year`, or null when it falls outside.
 * Annual windows crossing New Year split into two spans.
 * @example seasonSegments(christmas, 2026) // [{ start: 352, end: 359 }]
 */
export function seasonSegments(item: SeasonConfig, year: number): SeasonSegment[] | null {
  const days = daysInYear(year);
  if (item.schedule.kind === "annual") {
    const start = dayOffset(monthDayParts(year, item.schedule.start), year);
    const end = dayOffset(monthDayParts(year, item.schedule.end), year);
    if (item.schedule.start <= item.schedule.end) return [{ start, end }];
    return [
      { start, end: days - 1 },
      { start: 0, end },
    ];
  }
  const start = dayOffset(isoParts(item.schedule.start), year);
  const end = dayOffset(isoParts(item.schedule.end), year);
  if (end < 0 || start >= days) return null;
  const s = Math.max(0, start);
  const e = Math.min(days - 1, end);
  if (s > e) return null;
  return [{ start: s, end: e }];
}

/**
 * True when two seasons have overlapping windows in `year`.
 * @example seasonsOverlap(halloween, diwali, 2026) // false
 */
export function seasonsOverlap(a: SeasonConfig, b: SeasonConfig, year: number): boolean {
  if (a.id === b.id) return false;
  const segsA = seasonSegments(a, year);
  const segsB = seasonSegments(b, year);
  if (!segsA || !segsB) return false;
  for (const sa of segsA) {
    for (const sb of segsB) {
      if (sa.start <= sb.end && sb.start <= sa.end) {
        return true;
      }
    }
  }
  return false;
}
