import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SeasonConfig } from "@/content/seasons";
import { dayOffset, daysInYear, seasonSegments, type DayParts } from "./season-timeline";

/**
 * Minimal season with the schedule under test.
 * @example season({ kind: "annual", start: "12-31", end: "01-02" }) // SeasonConfig
 */
function season(schedule: SeasonConfig["schedule"]): SeasonConfig {
  return {
    id: "fest-ab12cd34ef56",
    name: "Test",
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
});
