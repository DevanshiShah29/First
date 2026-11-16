import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SEASON_PRESETS } from "./season-presets";
import {
  createCustomSeason,
  createPlacementGroup,
  CUSTOM_SEASON_PALETTE,
  DEFAULT_SEASONS,
  defaultOrnamentPosition,
  inAnnualWindow,
  isCustomSeasonId,
  isOrnamentPosition,
  MAX_CUSTOM_SEASONS,
  ORNAMENT_POSITIONS,
  parseOrnamentPositions,
  parsePlacements,
  parseSeasons,
  placementSizeRem,
  resolveActiveCursorOrnament,
  resolveActiveSeason,
  seasonForIsoDate,
  seasonOrnamentImageUrl,
  seasonsMatchingToday,
  showsSeasonDecorations,
  synthesizePlacementsFromLegacy,
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
  return { mode: "schedule", manualId: null, timezone: ZONE, items, ornaments: [] };
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

  it("covers the New Year window at both calendar boundaries", () => {
    assert.equal(inAnnualWindow("12-30", "12-31", "01-02"), false);
    assert.equal(inAnnualWindow("12-31", "12-31", "01-02"), true);
    assert.equal(inAnnualWindow("01-01", "12-31", "01-02"), true);
    assert.equal(inAnnualWindow("01-02", "12-31", "01-02"), true);
    assert.equal(inAnnualWindow("01-03", "12-31", "01-02"), false);
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
      { mode: "manual", manualId: "christmas", timezone: ZONE, items: DEFAULT_SEASONS.items, ornaments: [] },
      now,
    );
    assert.equal(active?.id, "christmas");
  });

  it("forces a season even when its calendar switch is off", () => {
    const items = DEFAULT_SEASONS.items.map((item) =>
      item.id === "christmas" ? { ...item, enabled: false } : item,
    );
    const active = resolveActiveSeason(
      { mode: "manual", manualId: "christmas", timezone: ZONE, items, ornaments: [] },
      new Date("2026-07-01T06:30:00.000Z"),
    );
    assert.equal(active?.id, "christmas");
  });
});

describe("seasonForIsoDate", () => {
  it("reads the calendar for a date regardless of the saved mode", () => {
    const settings = { ...calendar(DEFAULT_SEASONS.items), mode: "off" as const };
    assert.equal(seasonForIsoDate(settings, "2026-10-26")?.id, "halloween");
    assert.equal(seasonForIsoDate(settings, "2026-12-25")?.id, "christmas");
    assert.equal(seasonForIsoDate(settings, "2026-07-01"), null);
  });
});

describe("parseSeasons", () => {
  it("fills the eight packs and stays off when nothing is stored", () => {
    const parsed = parseSeasons(undefined);
    assert.equal(parsed.mode, "off");
    assert.deepEqual(
      parsed.items.map((item) => item.id),
      ["newyear", "valentine", "holi", "rakhi", "navratri", "halloween", "diwali", "christmas"],
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

  it("keeps the shared ornament catalog and drops unsafe or duplicate rows", () => {
    const parsed = parseSeasons({
      ornaments: [
        { id: "orn-1", name: "  Diya  ", imageUrl: "/uploads/artifacts/diya.png" },
        { id: "orn-2", name: "Duplicate", imageUrl: "/uploads/artifacts/diya.png" },
        { id: "orn-3", name: "Unsafe", imageUrl: "javascript:alert(1)" },
        { id: "orn-4", name: "Pending", imageUrl: "" },
      ],
    });
    assert.deepEqual(parsed.ornaments, [
      { id: "orn-1", name: "Diya", imageUrl: "/uploads/artifacts/diya.png" },
      { id: "orn-4", name: "Pending", imageUrl: "" },
    ]);
  });

  it("preserves the saved item order and fills missing packs", () => {
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
      ["fest-ab12cd34ef56", "newyear", "valentine", "holi", "rakhi", "navratri", "halloween", "diwali", "christmas"],
    );
    const holi = parsed.items[0];
    assert.equal(holi?.name, "Holi");
    assert.equal(holi?.schedule.kind, "dated");
    assert.equal(holi?.palette.brandFrom, "#ABCDEF");
    assert.deepEqual(holi?.ornamentImages, ["/uploads/artifacts/holi.png"]);
    assert.equal(parsed.manualId, "fest-ab12cd34ef56");
  });

  it("keeps a reordered list so a festival can outrank a built-in", () => {
    const parsed = parseSeasons({
      mode: "schedule",
      items: [
        { id: "fest-ab12cd34ef56", name: "Holi", schedule: { kind: "annual", start: "10-25", end: "11-01" } },
        { id: "halloween" },
        { id: "diwali" },
        { id: "christmas" },
      ],
    });
    assert.deepEqual(
      parsed.items.map((item) => item.id),
      ["fest-ab12cd34ef56", "halloween", "diwali", "christmas", "newyear", "valentine", "holi", "rakhi", "navratri"],
    );
    const active = resolveActiveSeason(parsed, new Date("2026-10-26T06:30:00.000Z"));
    assert.equal(active?.id, "fest-ab12cd34ef56");
  });

  it("keeps a festival reordered between two built-in packs", () => {
    const parsed = parseSeasons({
      mode: "schedule",
      items: [
        { id: "halloween" },
        { id: "fest-ab12cd34ef56", name: "Holi", schedule: { kind: "annual", start: "10-25", end: "11-01" } },
        { id: "christmas" },
      ],
    });
    assert.deepEqual(
      parsed.items.map((item) => item.id),
      ["halloween", "fest-ab12cd34ef56", "christmas", "newyear", "valentine", "holi", "rakhi", "navratri", "diwali"],
    );
  });

  it("drops a festival with a bad id or date window", () => {
    const parsed = parseSeasons({
      items: [
        { id: "not-a-festival", name: "Holi", schedule: { kind: "annual", start: "03-01", end: "03-02" } },
        { id: "fest-ab12cd34ef56", name: "Holi", schedule: { kind: "annual", start: "13-01", end: "03-02" } },
      ],
    });
    assert.deepEqual(
      parsed.items.map((item) => item.id),
      ["newyear", "valentine", "holi", "rakhi", "navratri", "halloween", "diwali", "christmas"],
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
    assert.equal(parsed.items.filter((item) => isCustomSeasonId(item.id)).length, MAX_CUSTOM_SEASONS);
    assert.equal(parsed.items[11]?.id, "fest-000000000011");
  });

  it("keeps cursorOrnament when it matches an ornament image, and drops it otherwise", () => {
    const parsed = parseSeasons({
      items: [
        {
          id: "halloween",
          ornamentImages: ["/uploads/artifacts/bat.png"],
          cursorOrnament: "/uploads/artifacts/bat.png",
        },
        {
          id: "christmas",
          ornamentImages: ["/uploads/artifacts/tree.png"],
          cursorOrnament: "/uploads/artifacts/snowflake.png",
        },
      ],
    });
    const halloween = parsed.items.find((item) => item.id === "halloween");
    assert.equal(halloween?.cursorOrnament, "/uploads/artifacts/bat.png");
    const christmas = parsed.items.find((item) => item.id === "christmas");
    assert.equal(christmas?.cursorOrnament, null);
  });

  it("keeps valid ornamentPositions matching ornamentImages and drops invalid ones", () => {
    const parsed = parseSeasons({
      items: [
        {
          id: "diwali",
          ornamentImages: ["/uploads/artifacts/diya.png", "/uploads/artifacts/lantern.png"],
          ornamentPositions: {
            "/uploads/artifacts/diya.png": "bottom-left",
            "/uploads/artifacts/lantern.png": "top-right",
            "/uploads/artifacts/unmapped.png": "top-center",
            "/uploads/artifacts/diya.png-bad": "invalid-position",
          },
        },
      ],
    });
    const diwali = parsed.items.find((item) => item.id === "diwali");
    assert.deepEqual(diwali?.ornamentPositions, {
      "/uploads/artifacts/diya.png": "bottom-left",
      "/uploads/artifacts/lantern.png": "top-right",
    });
  });

  it("does not resurrect deleted presets when deletedIds is stored", () => {
    const parsed = parseSeasons({
      items: [{ id: "christmas" }],
      deletedIds: ["halloween", "diwali"],
    });
    assert.equal(parsed.items.some((item) => item.id === "halloween"), false);
    assert.equal(parsed.items.some((item) => item.id === "diwali"), false);
    assert.equal(parsed.items.some((item) => item.id === "christmas"), true);
  });
});

describe("parseOrnamentPositions", () => {
  it("extracts positions only for allowed images with valid position ids", () => {
    const result = parseOrnamentPositions(
      {
        "/a.png": "top-left",
        "/b.png": "bottom-center",
        "/c.png": "not-a-position",
        "/d.png": "top-right",
      },
      ["/a.png", "/b.png", "/c.png"],
    );
    assert.deepEqual(result, {
      "/a.png": "top-left",
      "/b.png": "bottom-center",
    });
  });

  it("validates ornament position identifiers", () => {
    assert.equal(isOrnamentPosition("top-left"), true);
    assert.equal(isOrnamentPosition("bottom-right"), true);
    assert.equal(isOrnamentPosition("random"), false);
    assert.equal(isOrnamentPosition(null), false);
    assert.equal(ORNAMENT_POSITIONS.length, 8);
  });

  it("cycles through default positions by index", () => {
    assert.equal(defaultOrnamentPosition(0), "top-right");
    assert.equal(defaultOrnamentPosition(1), "top-left");
    assert.equal(defaultOrnamentPosition(2), "bottom-right");
    assert.equal(defaultOrnamentPosition(3), "bottom-left");
    assert.equal(defaultOrnamentPosition(8), "top-right");
  });
});

describe("resolveActiveCursorOrnament", () => {
  it("returns the ornament cursor when a festival is live and has one configured", () => {
    const settings: SeasonsSettings = {
      mode: "manual",
      manualId: "halloween",
      timezone: ZONE,
      items: [
        {
          ...DEFAULT_SEASONS.items[0],
          id: "halloween",
          ornamentImages: ["/uploads/artifacts/bat.png"],
          cursorOrnament: "/uploads/artifacts/bat.png",
        },
      ],
      ornaments: [],
    };
    assert.equal(resolveActiveCursorOrnament(settings), "/uploads/artifacts/bat.png");
  });

  it("returns null when no season is live or mode is off", () => {
    const settings: SeasonsSettings = {
      mode: "off",
      manualId: "halloween",
      timezone: ZONE,
      items: [
        {
          ...DEFAULT_SEASONS.items[0],
          id: "halloween",
          ornamentImages: ["/uploads/artifacts/bat.png"],
          cursorOrnament: "/uploads/artifacts/bat.png",
        },
      ],
      ornaments: [],
    };
    assert.equal(resolveActiveCursorOrnament(settings), null);
    assert.equal(resolveActiveCursorOrnament(null), null);
  });

  it("returns null when the live season has no cursorOrnament set", () => {
    const settings: SeasonsSettings = {
      mode: "manual",
      manualId: "halloween",
      timezone: ZONE,
      items: [
        {
          ...DEFAULT_SEASONS.items[0],
          id: "halloween",
          ornamentImages: ["/uploads/artifacts/bat.png"],
          cursorOrnament: null,
        },
      ],
      ornaments: [],
    };
    assert.equal(resolveActiveCursorOrnament(settings), null);
  });

  it("returns null when a palette-only season has a cursor configured", () => {
    const settings: SeasonsSettings = {
      mode: "manual",
      manualId: "halloween",
      timezone: ZONE,
      items: [
        {
          ...DEFAULT_SEASONS.items[0],
          id: "halloween",
          intensity: "subtle",
          ornamentImages: ["/uploads/artifacts/bat.png"],
          cursorOrnament: "/uploads/artifacts/bat.png",
        },
      ],
      ornaments: [],
    };
    assert.equal(resolveActiveCursorOrnament(settings), null);
  });
});

describe("showsSeasonDecorations", () => {
  it("only paints decorations for the full look", () => {
    assert.equal(showsSeasonDecorations(null), false);
    assert.equal(showsSeasonDecorations({ intensity: "subtle" } as SeasonConfig), false);
    assert.equal(showsSeasonDecorations({ intensity: "full" } as SeasonConfig), true);
  });

  it("follows a manual season switch for ornaments and cursor", () => {
    const base = DEFAULT_SEASONS.items[0];
    const settings: SeasonsSettings = {
      mode: "manual",
      manualId: "christmas",
      timezone: ZONE,
      items: [
        {
          ...base,
          id: "christmas",
          intensity: "full",
          ornamentImages: ["/uploads/artifacts/bell.png"],
          cursorOrnament: "/uploads/artifacts/bell.png",
        },
        {
          ...base,
          id: "halloween",
          intensity: "subtle",
          ornamentImages: ["/uploads/artifacts/bat.png"],
          cursorOrnament: "/uploads/artifacts/bat.png",
        },
      ],
      ornaments: [],
    };

    const christmas = resolveActiveSeason(settings, new Date());
    assert.equal(showsSeasonDecorations(christmas), true);
    assert.equal(resolveActiveCursorOrnament(settings), "/uploads/artifacts/bell.png");

    const halloweenSettings: SeasonsSettings = { ...settings, manualId: "halloween" };
    const halloween = resolveActiveSeason(halloweenSettings, new Date());
    assert.equal(showsSeasonDecorations(halloween), false);
    assert.equal(resolveActiveCursorOrnament(halloweenSettings), null);
  });
});

describe("placementSizeRem", () => {
  it("maps each preset to its rendered size", () => {
    assert.equal(placementSizeRem({ size: "small" }), 2);
    assert.equal(placementSizeRem({ size: "medium" }), 3);
    assert.equal(placementSizeRem({ size: "large" }), 4);
  });

  it("uses the custom size, with a safe default", () => {
    assert.equal(placementSizeRem({ size: "custom", customSize: 5 }), 5);
    assert.equal(placementSizeRem({ size: "custom" }), 3);
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

describe("placement groups", () => {
  it("creates a placement group with defaults and overrides", () => {
    const defaultGroup = createPlacementGroup();
    assert.equal(defaultGroup.name, "Header Garland");
    assert.equal(defaultGroup.position, "header");
    assert.equal(defaultGroup.alignment, "center");
    assert.equal(defaultGroup.orientation, "horizontal");
    assert.equal(defaultGroup.size, "medium");
    assert.equal(defaultGroup.animation, "sway");
    assert.equal(defaultGroup.animationIntensity, "normal");
    assert.equal(defaultGroup.visibility, "all");
    assert.equal(defaultGroup.repeat, 1);
    assert.equal(defaultGroup.spacing, 2);
    assert.deepEqual(defaultGroup.assets, []);

    const custom = createPlacementGroup({
      name: "Left Floor Diyas",
      position: "bottom-edge",
      alignment: "left",
      orientation: "horizontal",
      size: "large",
      animation: "flicker",
      animationIntensity: "energetic",
      visibility: "desktop",
      repeat: 3,
      spacing: 1.5,
      assets: ["/uploads/artifacts/diya.png"],
    });
    assert.equal(custom.name, "Left Floor Diyas");
    assert.equal(custom.position, "bottom-edge");
    assert.equal(custom.alignment, "left");
    assert.equal(custom.size, "large");
    assert.equal(custom.animation, "flicker");
    assert.equal(custom.animationIntensity, "energetic");
    assert.equal(custom.visibility, "desktop");
    assert.equal(custom.repeat, 3);
    assert.equal(custom.spacing, 1.5);
    assert.deepEqual(custom.assets, ["/uploads/artifacts/diya.png"]);
  });

  it("parses placement groups, allowing multiple groups, repeats, and same ornament in multiple groups", () => {
    const raw = [
      {
        id: "pg-1",
        name: "Top Garland",
        position: "header",
        alignment: "center",
        orientation: "horizontal",
        assets: ["/uploads/artifacts/star.png", "/uploads/artifacts/star.png", "/uploads/artifacts/bell.png"],
        repeat: 2,
        spacing: 2.5,
        size: "medium",
        animation: "sway",
        animationIntensity: "subtle",
        visibility: "all",
      },
      {
        id: "pg-2",
        name: "Floor Accents",
        position: "bottom-edge",
        alignment: "stretch",
        orientation: "horizontal",
        assets: ["/uploads/artifacts/star.png"], // Same ornament reused in second group
        repeat: 4,
        spacing: 3,
        size: "small",
        animation: "twinkle",
        animationIntensity: "energetic",
        visibility: "mobile",
        customCoordinates: { bottom: "1rem" },
      },
    ];

    const parsed = parsePlacements(raw);
    assert.equal(parsed.length, 2);

    // Group 1
    assert.equal(parsed[0].name, "Top Garland");
    assert.equal(parsed[0].position, "header");
    assert.equal(parsed[0].repeat, 2);
    assert.equal(parsed[0].spacing, 2.5);
    assert.equal(parsed[0].animation, "sway");
    assert.equal(parsed[0].animationIntensity, "subtle");
    // Verifies same ornament can be repeated within one group
    assert.deepEqual(parsed[0].assets, [
      "/uploads/artifacts/star.png",
      "/uploads/artifacts/star.png",
      "/uploads/artifacts/bell.png",
    ]);

    // Group 2
    assert.equal(parsed[1].name, "Floor Accents");
    assert.equal(parsed[1].position, "bottom-edge");
    assert.equal(parsed[1].alignment, "stretch");
    assert.equal(parsed[1].visibility, "mobile");
    assert.equal(parsed[1].repeat, 4);
    // Verifies same ornament can be assigned to multiple placement groups
    assert.deepEqual(parsed[1].assets, ["/uploads/artifacts/star.png"]);
    assert.deepEqual(parsed[1].customCoordinates, { bottom: "1rem" });
  });

  it("handles custom festivals with exactly the same placement group capabilities", () => {
    const raw = {
      items: [
        {
          id: "fest-springcarnival",
          name: "Spring Carnival",
          enabled: true,
          schedule: { kind: "annual", start: "04-01", end: "04-10" },
          placements: [
            {
              id: "pg-carnival-1",
              name: "Floating Balloons",
              position: "center",
              alignment: "center",
              orientation: "free",
              assets: ["/uploads/artifacts/balloon.png"],
              repeat: 5,
              spacing: 3,
              size: "large",
              animation: "float",
              animationIntensity: "energetic",
              visibility: "all",
            },
          ],
        },
      ],
    };

    const parsed = parseSeasons(raw);
    const carnival = parsed.items.find((item) => item.id === "fest-springcarnival");
    assert.ok(carnival);
    assert.equal(carnival.placements?.length, 1);
    assert.equal(carnival.placements?.[0].name, "Floating Balloons");
    assert.equal(carnival.placements?.[0].position, "center");
    assert.equal(carnival.placements?.[0].orientation, "free");
    assert.equal(carnival.placements?.[0].animation, "float");
    assert.deepEqual(carnival.placements?.[0].assets, ["/uploads/artifacts/balloon.png"]);
    // Verifies assets in placements are collected into ornamentImages
    assert.ok(carnival.ornamentImages.includes("/uploads/artifacts/balloon.png"));
  });

  it("synthesizes default placement groups from legacy ornament positions if placements missing", () => {
    const synthesized = synthesizePlacementsFromLegacy(
      {
        "/uploads/artifacts/garland.png": "top-center",
        "/uploads/artifacts/diya.png": "bottom-left",
      },
      ["/uploads/artifacts/garland.png", "/uploads/artifacts/diya.png"],
    );
    assert.ok(synthesized.length >= 2);
    const headerGroup = synthesized.find((g) => g.position === "header");
    const floorGroup = synthesized.find((g) => g.position === "bottom-edge");
    assert.ok(headerGroup);
    assert.ok(floorGroup);
    assert.deepEqual(headerGroup?.assets, ["/uploads/artifacts/garland.png"]);
    assert.deepEqual(floorGroup?.assets, ["/uploads/artifacts/diya.png"]);
  });
});
