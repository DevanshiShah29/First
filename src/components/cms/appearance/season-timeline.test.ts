import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SeasonConfig } from "@/content/seasons";
import { dayOffset, daysInYear, seasonSegments, seasonsOverlap, type DayParts } from "./season-timeline";
import { seasonBadges, seasonCountdown, sortSeasonsByNearestDate } from "./season-labels";

/**
 * Minimal season with the schedule under test.
 * @example season({ kind: "annual", start: "12-31", end: "01-02" }) // SeasonConfig
 */
function season(
  schedule: SeasonConfig["schedule"],
  name = "Test",
  id = "fest-ab12cd34ef56",
): SeasonConfig {
  return {
    id,
    name,
    enabled: true,
    schedule,
    intensity: "subtle",
    palette: {
      brandFrom: "#000000",
      brandTo: "#ffffff",
      light: {
        background: "#ffffff",
        foreground: "#000000",
        card: "#ffffff",
        chip: "#ffffff",
        accentText: "#000000",
        accentHover: "#000000",
        badge: "#000000",
      },
      dark: {
        background: "#000000",
        foreground: "#ffffff",
        card: "#000000",
        chip: "#000000",
        accentText: "#ffffff",
        accentHover: "#ffffff",
        badge: "#ffffff",
      },
    },
    ornamentImages: [],
  };
}

const parts = (year: number, month: number, day: number): DayParts => ({ year, month, day });

describe("season timeline", () => {
  it("counts leap years", () => {
    assert.equal(daysInYear(2024), 366);
    assert.equal(daysInYear(2026), 365);
  });

  it("measures whole days from Jan 1", () => {
    assert.equal(dayOffset(parts(2026, 1, 1), 2026), 0);
    assert.equal(dayOffset(parts(2026, 12, 31), 2026), 364);
    assert.equal(dayOffset(parts(2026, 10, 25), 2026), 297);
  });

  it("keeps a same-year annual window in one span", () => {
    assert.deepEqual(seasonSegments(season({ kind: "annual", start: "10-25", end: "10-31" }), 2026), [
      { start: 297, end: 303 },
    ]);
  });

  it("splits an annual window that crosses New Year", () => {
    assert.deepEqual(seasonSegments(season({ kind: "annual", start: "12-31", end: "01-02" }), 2026), [
      { start: 364, end: 364 },
      { start: 0, end: 1 },
    ]);
  });

  it("clips a dated window that starts in the previous year", () => {
    assert.deepEqual(
      seasonSegments(season({ kind: "dated", start: "2025-12-30", end: "2026-01-02" }), 2026),
      [{ start: 0, end: 1 }],
    );
  });

  it("drops a dated window outside the year and an inverted window", () => {
    assert.equal(
      seasonSegments(season({ kind: "dated", start: "2027-01-01", end: "2027-01-02" }), 2026),
      null,
    );
    assert.equal(
      seasonSegments(season({ kind: "dated", start: "2026-12-30", end: "2026-01-02" }), 2026),
      null,
    );
  });

  it("detects overlapping season windows", () => {
    const s1 = { ...season({ kind: "annual", start: "10-25", end: "11-02" }), id: "fest-1" };
    const s2 = { ...season({ kind: "annual", start: "10-30", end: "11-05" }), id: "fest-2" };
    const s3 = { ...season({ kind: "annual", start: "11-10", end: "11-15" }), id: "fest-3" };

    assert.equal(seasonsOverlap(s1, s2, 2026), true);
    assert.equal(seasonsOverlap(s1, s3, 2026), false);
    assert.equal(seasonsOverlap(s1, s1, 2026), false);
  });
});

describe("sortSeasonsByNearestDate", () => {
  const today: DayParts = { year: 2026, month: 10, day: 25 };

  it("prioritizes active seasons first, then upcoming chronologically, then ended", () => {
    const activeAnnual = season({ kind: "annual", start: "10-20", end: "10-30" }, "Active Diwali", "diwali");
    const activeDated = season(
      { kind: "dated", start: "2026-10-24", end: "2026-10-28" },
      "Active Weekend",
      "weekend",
    );
    const upcomingSoon = season({ kind: "annual", start: "10-31", end: "11-05" }, "Halloween", "halloween");
    const upcomingLater = season({ kind: "annual", start: "12-20", end: "12-31" }, "Christmas", "christmas");
    const endedDated = season(
      { kind: "dated", start: "2026-09-01", end: "2026-09-10" },
      "Past Summer",
      "summer",
    );

    const unordered = [upcomingLater, endedDated, activeAnnual, upcomingSoon, activeDated];
    const sorted = sortSeasonsByNearestDate(unordered, today);

    // Active seasons first, followed by upcoming in order, followed by ended
    const sortedIds = sorted.map((s) => s.id);
    assert.deepEqual(sortedIds.slice(0, 2).sort(), ["diwali", "weekend"]);
    assert.equal(sortedIds[2], "halloween");
    assert.equal(sortedIds[3], "christmas");
    assert.equal(sortedIds[4], "summer");
  });

  it("handles annual seasons that wrap around the calendar year", () => {
    // Today: Dec 20, 2026
    const decToday: DayParts = { year: 2026, month: 12, day: 20 };
    const newYear = season({ kind: "annual", start: "12-31", end: "01-05" }, "New Year", "ny");
    const republicDay = season({ kind: "annual", start: "01-20", end: "01-28" }, "Republic Day", "rd");
    const holi = season({ kind: "annual", start: "03-20", end: "03-25" }, "Holi", "holi");

    const sorted = sortSeasonsByNearestDate([holi, republicDay, newYear], decToday);
    assert.deepEqual(
      sorted.map((s) => s.id),
      ["ny", "rd", "holi"],
    );
  });

  it("places invalid or inverted dated ranges at the bottom", () => {
    const validUpcoming = season({ kind: "dated", start: "2026-11-01", end: "2026-11-05" }, "Nov Fest", "nov");
    const invertedDated = season(
      { kind: "dated", start: "2026-12-10", end: "2026-12-05" },
      "Inverted Fest",
      "inv",
    );
    const endedDated = season(
      { kind: "dated", start: "2026-01-01", end: "2026-01-05" },
      "Old Jan Fest",
      "jan",
    );

    const sorted = sortSeasonsByNearestDate([invertedDated, endedDated, validUpcoming], today);
    assert.deepEqual(
      sorted.map((s) => s.id),
      ["nov", "jan", "inv"],
    );
  });

  it("breaks ties using festival name alphabetically", () => {
    const festB = season({ kind: "annual", start: "11-01", end: "11-05" }, "Beta Fest", "beta");
    const festA = season({ kind: "annual", start: "11-01", end: "11-05" }, "Alpha Fest", "alpha");

    const sorted = sortSeasonsByNearestDate([festB, festA], today);
    assert.deepEqual(
      sorted.map((s) => s.id),
      ["alpha", "beta"],
    );
  });

  it("sorts Navratri before Diwali when both ended earlier in the year", () => {
    const nov15: DayParts = { year: 2026, month: 11, day: 15 };
    const fall = season({ kind: "dated", start: "2026-11-15", end: "2026-11-21" }, "Fall", "fall");
    const christmas = season({ kind: "annual", start: "12-20", end: "12-26" }, "Christmas", "xmas");
    const newYear = season({ kind: "annual", start: "12-31", end: "01-02" }, "New Year", "ny");
    const navratri = season({ kind: "dated", start: "2026-10-09", end: "2026-10-15" }, "Navratri", "navratri");
    const halloween = season({ kind: "annual", start: "10-25", end: "11-01" }, "Halloween", "halloween");
    const diwali = season({ kind: "dated", start: "2026-11-06", end: "2026-11-12" }, "Diwali", "diwali");

    const sorted = sortSeasonsByNearestDate(
      [diwali, christmas, navratri, fall, halloween, newYear],
      nov15,
    );

    // Active first (Fall), then chronological nearest start date:
    // Christmas (Dec 20), New Year (Dec 31), Navratri (next Oct 9), Halloween (next Oct 25), Diwali (next Nov 6)
    assert.deepEqual(
      sorted.map((s) => s.id),
      ["fall", "xmas", "ny", "navratri", "halloween", "diwali"],
    );
  });

  it("calculates countdowns consistently for annual, cross-year, and recurring dated festivals", () => {
    const nov15: DayParts = { year: 2026, month: 11, day: 15 };
    const fall = season({ kind: "dated", start: "2026-11-15", end: "2026-11-21" }, "Fall");
    const christmas = season({ kind: "annual", start: "12-20", end: "12-26" }, "Christmas");
    const newYear = season({ kind: "annual", start: "12-31", end: "01-02" }, "New Year");
    const diwali = season({ kind: "dated", start: "2026-11-06", end: "2026-11-12" }, "Diwali");
    const navratri = season({ kind: "dated", start: "2026-10-09", end: "2026-10-15" }, "Navratri");

    assert.equal(seasonCountdown(fall, nov15), "Ends in 6 days");
    assert.equal(seasonCountdown(christmas, nov15), "Starts in 35 days");
    assert.equal(seasonCountdown(newYear, nov15), "Starts in 46 days");
    assert.equal(seasonCountdown(navratri, nov15), "Starts in 328 days");
    assert.equal(seasonCountdown(diwali, nov15), "Starts in 356 days");
  });

  it("labels active as Showing and all recurring festivals as Upcoming", () => {
    const nov15: DayParts = { year: 2026, month: 11, day: 15 };
    const fall = season({ kind: "dated", start: "2026-11-15", end: "2026-11-21" }, "Fall");
    const diwali = season({ kind: "dated", start: "2026-11-06", end: "2026-11-12" }, "Diwali");

    const fallBadges = seasonBadges(fall, true, false, false, false, nov15);
    const diwaliBadges = seasonBadges(diwali, false, true, false, false, nov15);

    assert.deepEqual(fallBadges, [{ id: "showing", label: "Showing" }]);
    assert.deepEqual(diwaliBadges, [{ id: "upcoming", label: "Upcoming" }]);
  });
});

