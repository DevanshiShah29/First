import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  motifFor,
  ornamentPlacementCopy,
  ornamentSpots,
  spotStyle,
  type OrnamentSpot,
} from "./season-layout";

const SEASON_IDS = [
  "newyear",
  "valentine",
  "holi",
  "rakhi",
  "navratri",
  "halloween",
  "diwali",
  "christmas",
] as const;

const CENTER = { min: 30, max: 70 };

/**
 * True when a top-edge image sits over the middle of the header band.
 * @example crossesTopCenter({ along: 50, edge: "top" }) // true
 */
function crossesTopCenter(spot: OrnamentSpot): boolean {
  return spot.edge === "top" && spot.along > CENTER.min && spot.along < CENTER.max;
}

describe("motifFor", () => {
  it("maps each built-in festival to its own placement", () => {
    assert.equal(motifFor("christmas"), "garland");
    assert.equal(motifFor("newyear"), "lights");
    assert.equal(motifFor("diwali"), "diyas");
    assert.equal(motifFor("navratri"), "doorway");
    assert.equal(motifFor("holi"), "color");
    assert.equal(motifFor("halloween"), "eaves");
    assert.equal(motifFor("valentine"), "rise");
    assert.equal(motifFor("rakhi"), "tie");
  });

  it("frames an added festival instead of scattering it", () => {
    assert.equal(motifFor("fest-ab12cd34"), "frame");
    assert.equal(motifFor("unknown"), "frame");
  });
});

describe("ornamentSpots", () => {
  it("returns one spot per image and nothing for an empty set", () => {
    assert.equal(ornamentSpots("diwali", 0).length, 0);
    assert.equal(ornamentSpots("christmas", 12).length, 12);
  });

  it("hangs Christmas on the top rim at mixed lengths", () => {
    const spots = ornamentSpots("christmas", 6);
    assert.ok(spots.every((spot) => spot.edge === "top" && spot.motion === "sway"));
    assert.ok(new Set(spots.map((spot) => spot.drop)).size > 1);
  });

  it("keeps New Year lights even, on the top rim", () => {
    const spots = ornamentSpots("newyear", 5);
    assert.ok(spots.every((spot) => spot.edge === "top" && spot.motion === "twinkle"));
    assert.equal(new Set(spots.map((spot) => spot.drop)).size, 1);
  });

  it("keeps Diwali diyas on the outer floor, not the center", () => {
    const spots = ornamentSpots("diwali", 8);
    assert.ok(
      spots.every(
        (spot) => spot.edge === "bottom" && spot.along <= 24 && (spot.side === "left" || spot.side === "right"),
      ),
    );
    assert.ok(spots.some((spot) => spot.side === "left"));
    assert.ok(spots.some((spot) => spot.side === "right"));
  });

  it("frames Navratri on the two side jambs", () => {
    const spots = ornamentSpots("navratri", 6);
    assert.ok(spots.every((spot) => spot.edge === "left" || spot.edge === "right"));
    assert.ok(spots.every((spot) => spot.along >= 16 && spot.along <= 70));
  });

  it("keeps Holi on the rim", () => {
    const spots = ornamentSpots("holi", 8);
    for (const spot of spots) {
      if (spot.edge === "top" || spot.edge === "bottom") assert.ok(spot.along <= 18 || spot.along >= 82);
      else assert.ok(spot.edge === "left" || spot.edge === "right");
    }
  });

  it("keeps Halloween on the eaves", () => {
    const spots = ornamentSpots("halloween", 4);
    assert.ok(spots.every((spot) => spot.edge === "top" && spot.motion === "drift"));
  });

  it("raises Valentine images in the side margins", () => {
    const spots = ornamentSpots("valentine", 4);
    assert.ok(spots.every((spot) => (spot.edge === "left" || spot.edge === "right") && spot.motion === "rise"));
  });

  it("ties Rakhi in the upper corners", () => {
    const spots = ornamentSpots("rakhi", 4);
    assert.equal(spots[0]?.edge, "top");
    assert.ok((spots[0]?.along ?? 0) >= 86);
    assert.equal(spots[1]?.edge, "top");
    assert.ok((spots[1]?.along ?? 100) <= 12);
    assert.ok(spots.every((spot) => !crossesTopCenter(spot)));
  });

  it("keeps an added festival in the four corners, still and without symbolism", () => {
    const spots = ornamentSpots("fest-ab12cd34ef56", 8);
    assert.ok(spots.every((spot) => spot.anchor === "corner" && spot.motion === "still"));
    assert.ok(spots.every((spot) => spot.along <= 8));
    assert.ok(spots.some((spot) => spot.edge === "top" && spot.side === "left"));
    assert.ok(spots.some((spot) => spot.edge === "top" && spot.side === "right"));
    assert.ok(spots.some((spot) => spot.edge === "bottom" && spot.side === "left"));
    assert.ok(spots.some((spot) => spot.edge === "bottom" && spot.side === "right"));
  });

  it("parks a single image off the middle", () => {
    const christmas = ornamentSpots("christmas", 1)[0];
    assert.ok(christmas && !crossesTopCenter(christmas));
    const diwali = ornamentSpots("diwali", 1)[0];
    assert.equal(diwali?.edge, "bottom");
    assert.ok((diwali?.along ?? 100) <= 8);
  });
});

describe("spotStyle", () => {
  it("measures a right-hand diya in from the right", () => {
    const spot = ornamentSpots("diwali", 2)[1];
    assert.ok(spot);
    const style = spotStyle(spot);
    assert.equal(style.left, undefined);
    assert.match(style.right ?? "", /%$/);
    assert.match(style.bottom ?? "", /rem$/);
  });

  it("measures a top-right corner in from the right", () => {
    const spot = ornamentSpots("fest-ab12cd34", 1)[0];
    assert.ok(spot);
    const style = spotStyle(spot);
    assert.equal(style.left, undefined);
    assert.match(style.right ?? "", /%$/);
  });

  it("keeps a doorway garland below the header", () => {
    const spot = ornamentSpots("navratri", 1)[0];
    assert.ok(spot);
    assert.match(spotStyle(spot).top ?? "", /var\(--header-h\)/);
  });
});

describe("ornamentPlacementCopy", () => {
  it("describes every built-in festival without the old scatter", () => {
    for (const id of SEASON_IDS) {
      const copy = ornamentPlacementCopy(id);
      assert.ok(copy.length > 20);
      assert.equal(copy.includes("scattered across"), false);
    }
    assert.match(ornamentPlacementCopy("fest-ab12cd34"), /corners/);
    assert.match(ornamentPlacementCopy("fest-ab12cd34"), /still/);
  });
});
