import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SEASON_PRESETS } from "./season-presets";
import {
  createCustomSeason,
  CUSTOM_SEASON_PALETTE,
  DEFAULT_SEASONS,
  inAnnualWindow,
  isCustomSeasonId,
  MAX_CUSTOM_SEASONS,
  parseSeasons,
  resolveActiveSeason,
  seasonOrnamentImageUrl,
  seasonsMatchingToday,
  themeWithSeason,
  type SeasonConfig,
  type SeasonsSettings,
} from "./seasons";
import { DEFAULT_THEME } from "./types";
import { checkPalette } from "@/lib/theme-contrast";

const ZONE = "Asia/Kolkata";

/**
 * Builds settings that follow the calendar in Asia/Kolkata.
 * @example calendar(DEFAULT_SEASONS.items) // SeasonsSettings
 */
function calendar(items: SeasonConfig[]): SeasonsSettings {
  return { mode: "schedule", manualId: null, timezone: ZONE, items };
}

describe("annual windows", () => {
  it("includes a day inside a same-year range", () => {
    assert.equal(inAnnualWindow("10-26", "10-25", "11-01"), true);
  });

  it("excludes the day before and the day after", () => {
    assert.equal(inAnnualWindow("10-24", "10-25", "11-01"), false);
    assert.equal(inAnnualWindow("11-02", "10-25", "11-01"), false);
  });

  it("wraps across New Year", () => {
    assert.equal(inAnnualWindow("12-20", "12-20", "01-06"), true);
    assert.equal(inAnnualWindow("01-02", "12-20", "01-06"), true);
    assert.equal(inAnnualWindow("01-07", "12-20", "01-06"), false);
    assert.equal(inAnnualWindow("12-19", "12-20", "01-06"), false);
  });
});

describe("resolveActiveSeason", () => {
  it("stays off when mode is off, even inside a window", () => {
    const now = new Date("2026-10-26T06:30:00.000Z");
    assert.equal(resolveActiveSeason({ ...calendar(DEFAULT_SEASONS.items), mode: "off" }, now), null);
  });

  it("uses the site timezone rather than UTC", () => {
    // 2026-10-24 20:00 UTC is still 24 Oct in UTC, and already 25 Oct in Kolkata.
    const now = new Date("2026-10-24T20:00:00.000Z");
    const active = resolveActiveSeason(calendar(DEFAULT_SEASONS.items), now);
    assert.equal(active?.id, "halloween");
  });

  it("matches Halloween on the last day and not the morning after", () => {
    const last = new Date("2026-11-01T18:00:00.000Z");
    const after = new Date("2026-11-01T18:31:00.000Z");
    assert.equal(resolveActiveSeason(calendar(DEFAULT_SEASONS.items), last)?.id, "halloween");
    assert.equal(resolveActiveSeason(calendar(DEFAULT_SEASONS.items), after), null);
  });

  it("matches a dated Diwali window only inside that year", () => {
    const during = new Date("2026-11-08T06:30:00.000Z");
    const after = new Date("2026-11-13T06:30:00.000Z");
    const nextYear = new Date("2027-11-08T06:30:00.000Z");
    assert.equal(resolveActiveSeason(calendar(DEFAULT_SEASONS.items), during)?.id, "diwali");
    assert.equal(resolveActiveSeason(calendar(DEFAULT_SEASONS.items), after), null);
    assert.equal(resolveActiveSeason(calendar(DEFAULT_SEASONS.items), nextYear), null);
  });

  it("skips a disabled season", () => {
    const items = DEFAULT_SEASONS.items.map((item) =>
      item.id === "halloween" ? { ...item, enabled: false } : item,
    );
    const now = new Date("2026-10-26T06:30:00.000Z");
    assert.equal(resolveActiveSeason(calendar(items), now), null);
  });

  it("lets the first matching card win", () => {
    const items = DEFAULT_SEASONS.items.map((item) =>
      item.id === "diwali"
        ? { ...item, schedule: { kind: "annual" as const, start: "10-25", end: "11-01" } }
        : item,
    );
    const now = new Date("2026-10-26T06:30:00.000Z");
    const matches = seasonsMatchingToday(calendar(items), now);
    assert.deepEqual(
      matches.map((item) => item.id),
      ["halloween", "diwali"],
    );
    assert.equal(resolveActiveSeason(calendar(items), now)?.id, "halloween");
  });

  it("forces a season outside its dates", () => {
    const now = new Date("2026-03-01T06:30:00.000Z");
    const active = resolveActiveSeason(
      { mode: "manual", manualId: "christmas", timezone: ZONE, items: DEFAULT_SEASONS.items },
      now,
    );
    assert.equal(active?.id, "christmas");
  });

  it("forces a season even when its calendar switch is off", () => {
    const items = DEFAULT_SEASONS.items.map((item) =>
      item.id === "christmas" ? { ...item, enabled: false } : item,
    );
    const active = resolveActiveSeason(
      { mode: "manual", manualId: "christmas", timezone: ZONE, items },
      new Date("2026-07-01T06:30:00.000Z"),
    );
    assert.equal(active?.id, "christmas");
  });
});

describe("parseSeasons", () => {
  it("fills the three packs and stays off when nothing is stored", () => {
    const parsed = parseSeasons(undefined);
    assert.equal(parsed.mode, "off");
    assert.deepEqual(
      parsed.items.map((item) => item.id),
      ["halloween", "diwali", "christmas"],
    );
  });

  it("keeps Diwali dated even if the payload says annual", () => {
    const parsed = parseSeasons({
      mode: "schedule",
      items: [{ id: "diwali", schedule: { kind: "annual", start: "11-01", end: "11-05" } }],
    });
    const diwali = parsed.items.find((item) => item.id === "diwali");
    assert.equal(diwali?.schedule.kind, "dated");
    assert.equal(diwali?.schedule.start, "2026-11-06");
  });

  it("drops an unknown timezone", () => {
    assert.equal(parseSeasons({ timezone: "Mars/Olympus" }).timezone, "Asia/Kolkata");
  });

  it("keeps a saved palette color", () => {
    const parsed = parseSeasons({
      items: [{ id: "christmas", palette: { brandFrom: "#123456" } }],
    });
    assert.equal(parsed.items.find((item) => item.id === "christmas")?.palette.brandFrom, "#123456");
  });

  it("keeps a saved ornament color", () => {
    const parsed = parseSeasons({
      items: [{ id: "halloween", ornaments: { bat: "#112233" } }],
    });
    assert.equal(parsed.items.find((item) => item.id === "halloween")?.ornaments.bat, "#112233");
  });

  it("keeps uploaded ornament images and drops unsafe addresses", () => {
    const parsed = parseSeasons({
      items: [
        {
          id: "christmas",
          ornamentImages: [
            "/uploads/artifacts/holly.png",
            "https://cdn.example/snow.png",
            "javascript:alert(1)",
            "https://user:pass@cdn.example/secret.png",
            "/uploads/artifacts/holly.png",
          ],
        },
      ],
    });
    assert.deepEqual(parsed.items.find((item) => item.id === "christmas")?.ornamentImages, [
      "/uploads/artifacts/holly.png",
      "https://cdn.example/snow.png",
    ]);
    assert.equal(seasonOrnamentImageUrl("data:image/svg+xml,x"), null);
  });

  it("keeps an added festival after the three packs", () => {
    const parsed = parseSeasons({
      mode: "manual",
      manualId: "fest-ab12cd34ef56",
      items: [
        {
          id: "fest-ab12cd34ef56",
          name: "  Holi  ",
          schedule: { kind: "dated", start: "2026-03-03", end: "2026-03-04" },
          palette: { brandFrom: "#ABCDEF" },
          ornamentImages: ["/uploads/artifacts/holi.png"],
        },
      ],
    });
    assert.deepEqual(
      parsed.items.map((item) => item.id),
      ["halloween", "diwali", "christmas", "fest-ab12cd34ef56"],
    );
    const holi = parsed.items[3];
    assert.equal(holi?.name, "Holi");
    assert.equal(holi?.schedule.kind, "dated");
    assert.equal(holi?.palette.brandFrom, "#ABCDEF");
    assert.deepEqual(holi?.ornamentImages, ["/uploads/artifacts/holi.png"]);
    assert.equal(parsed.manualId, "fest-ab12cd34ef56");
  });

  it("drops a festival with a bad id or date window", () => {
    const parsed = parseSeasons({
      items: [
        { id: "holi", name: "Holi", schedule: { kind: "annual", start: "03-01", end: "03-02" } },
        { id: "fest-ab12cd34ef56", name: "Holi", schedule: { kind: "annual", start: "13-01", end: "03-02" } },
      ],
    });
    assert.deepEqual(
      parsed.items.map((item) => item.id),
      ["halloween", "diwali", "christmas"],
    );
  });

  it("keeps only the first 12 added festivals", () => {
    const items = Array.from({ length: MAX_CUSTOM_SEASONS + 2 }, (_, index) => ({
      id: `fest-${String(index).padStart(12, "0")}`,
      name: `Festival ${index}`,
      schedule: { kind: "annual" as const, start: "01-01", end: "01-02" },
    }));
    const parsed = parseSeasons({ items });
    assert.equal(parsed.items.length, SEASON_PRESETS.length + MAX_CUSTOM_SEASONS);
    assert.equal(parsed.items.at(-1)?.id, "fest-000000000011");
  });
});

describe("createCustomSeason", () => {
  it("starts unnamed, dated, and on for seven days", () => {
    const season = createCustomSeason(new Date("2026-10-09T06:30:00.000Z"), ZONE);
    assert.equal(isCustomSeasonId(season.id), true);
    assert.equal(season.name, "");
    assert.equal(season.enabled, true);
    assert.deepEqual(season.schedule, { kind: "dated", start: "2026-10-09", end: "2026-10-15" });
    assert.equal(season.palette.brandFrom, CUSTOM_SEASON_PALETTE.brandFrom);
  });
});

describe("themeWithSeason", () => {
  it("leaves the year-round theme when no season is active", () => {
    assert.equal(themeWithSeason(DEFAULT_THEME, null), DEFAULT_THEME);
  });

  it("swaps brand colors without dropping the theme mode", () => {
    const christmas = DEFAULT_SEASONS.items.find((item) => item.id === "christmas");
    const next = themeWithSeason(DEFAULT_THEME, christmas ?? null);
    assert.equal(next.brandFrom, christmas?.palette.brandFrom);
    assert.equal(next.defaultMode, DEFAULT_THEME.defaultMode);
    assert.equal(next.allowToggle, DEFAULT_THEME.allowToggle);
  });
});

describe("season palettes", () => {
  it("passes the appearance contrast check", () => {
    for (const preset of SEASON_PRESETS) {
      assert.deepEqual(checkPalette(preset.palette.light), [], preset.id);
      assert.deepEqual(checkPalette(preset.palette.dark), [], preset.id);
    }
    assert.deepEqual(checkPalette(CUSTOM_SEASON_PALETTE.light), []);
    assert.deepEqual(checkPalette(CUSTOM_SEASON_PALETTE.dark), []);
  });
});
