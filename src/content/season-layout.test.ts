import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  cornerBuckets,
  motifFor,
  ornamentPlacementCopy,
  ornamentSpots,
  positionedOrnamentSpots,
  splitRails,
  spotStyle,
  visibleInTrack,
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

describe("positionedOrnamentSpots", () => {
  it("returns an empty array when there are no photos", () => {
    assert.deepEqual(positionedOrnamentSpots([]), []);
  });

  it("places ornaments in their chosen positions", () => {
    const photos = ["/a.png", "/b.png", "/c.png", "/d.png"];
    const positions = {
      "/a.png": "top-left" as const,
      "/b.png": "bottom-right" as const,
      "/c.png": "top-center" as const,
      "/d.png": "left-center" as const,
    };
    const spots = positionedOrnamentSpots(photos, positions);
    assert.equal(spots.length, 4);

    // /a.png in top-left
    assert.equal(spots[0]?.edge, "top");
    assert.equal(spots[0]?.corner, "tl");
    assert.equal(spots[0]?.anchor, "corner");
    const styleA = spotStyle(spots[0]!);
    assert.match(styleA.top ?? "", /var\(--header-h\)/);
    assert.match(styleA.left ?? "", /0\.8rem/);

    // /b.png in bottom-right
    assert.equal(spots[1]?.edge, "bottom");
    assert.equal(spots[1]?.corner, "br");
    assert.equal(spots[1]?.anchor, "corner");
    const styleB = spotStyle(spots[1]!);
    assert.match(styleB.bottom ?? "", /0\.75rem/);
    assert.match(styleB.right ?? "", /0\.8rem/);

    // /c.png in top-center
    assert.equal(spots[2]?.edge, "top");
    assert.equal(spots[2]?.anchor, "rim");
    assert.equal(spots[2]?.corner, null);
    const styleC = spotStyle(spots[2]!);
    assert.match(styleC.left ?? "", /50%/);

    // /d.png in left-center
    assert.equal(spots[3]?.edge, "left");
    assert.equal(spots[3]?.anchor, "rim");
    assert.equal(spots[3]?.corner, null);
    const styleD = spotStyle(spots[3]!);
    assert.match(styleD.top ?? "", /50%/);
  });

  it("offsets multiple ornaments configured in the same position", () => {
    const photos = ["/a.png", "/b.png"];
    const positions = {
      "/a.png": "top-left" as const,
      "/b.png": "top-left" as const,
    };
    const spots = positionedOrnamentSpots(photos, positions);
    const styleA = spotStyle(spots[0]!);
    const styleB = spotStyle(spots[1]!);
    assert.notEqual(styleA.left, styleB.left);
  });

  it("falls back to default distribution when positions are omitted", () => {
    const photos = ["/a.png", "/b.png"];
    const spots = positionedOrnamentSpots(photos);
    assert.equal(spots.length, 2);
    // 0 defaults to top-right, 1 defaults to top-left
    assert.equal(spots[0]?.corner, "tr");
    assert.equal(spots[1]?.corner, "tl");
  });
});

describe("cornerBuckets", () => {
  it("places each ornament in exactly one corner", () => {
    const buckets = cornerBuckets(["a", "b", "c", "d", "e"]);
    assert.deepEqual(
      buckets.map((bucket) => bucket.length),
      [2, 1, 1, 1],
    );
    assert.deepEqual(buckets[0], ["a", "e"]);
    assert.deepEqual([...buckets.flat()].sort(), ["a", "b", "c", "d", "e"]);
  });

  it("keeps unused corners empty", () => {
    const buckets = cornerBuckets(["only"]);
    assert.deepEqual(
      buckets.map((bucket) => bucket.length),
      [1, 0, 0, 0],
    );
  });
});

describe("splitRails", () => {
  it("balances two rails without reordering or duplicating", () => {
    const rails = splitRails(["a", "b", "c", "d", "e"]);
    assert.deepEqual(rails[0], ["a", "b", "c"]);
    assert.deepEqual(rails[1], ["d", "e"]);
    assert.deepEqual([...rails[0], ...rails[1]], ["a", "b", "c", "d", "e"]);
  });

  it("handles empty and single-item sequences", () => {
    assert.deepEqual(splitRails([]), [[], []]);
    assert.deepEqual(splitRails(["only"]), [["only"], []]);
  });
});

describe("visibleInTrack", () => {
  it("shows every ornament when the row has room", () => {
    assert.equal(visibleInTrack(8, 3, 2, 1392), 8);
    assert.equal(visibleInTrack(4, 3, 2, 400), 4);
  });

  it("keeps full size and hides the excess when the row is tight", () => {
    // 48px ornaments + 32px gaps: four fit in a 342px phone row.
    assert.equal(visibleInTrack(8, 3, 2, 342), 4);
    assert.equal(visibleInTrack(32, 3, 2, 342), 4);
    assert.equal(visibleInTrack(8, 3, 2, 566), 7);
  });

  it("handles zero spacing and empty rows", () => {
    assert.equal(visibleInTrack(8, 3, 0, 342), 7);
    assert.equal(visibleInTrack(0, 3, 2, 342), 0);
    assert.equal(visibleInTrack(8, 3, 2, 0), 0);
  });

  it("hides a single ornament only when it cannot fit", () => {
    assert.equal(visibleInTrack(1, 3, 2, 48), 1);
    assert.equal(visibleInTrack(1, 3, 2, 40), 0);
  });
});
