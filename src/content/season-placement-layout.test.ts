import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  placementEdges,
  placementItemCount,
  placementLayoutEdges,
  placementStackKey,
  placementVisibleAt,
  renderedBreakdown,
  resolvePlacementLayout,
  type PlacementViewport,
} from "./season-placement-layout";
import type { PlacementGroup } from "./seasons";

const DESKTOP: PlacementViewport = { width: 1440, height: 900, root: 16, header: 4.5 };
const MOBILE: PlacementViewport = { width: 390, height: 844, root: 16, header: 4.5 };

/**
 * Builds a placement group with predictable defaults.
 * @example group({ position: "bottom-edge" }) // PlacementGroup
 */
function group(overrides: Partial<PlacementGroup> = {}): PlacementGroup {
  return {
    id: "pg-1",
    name: "Group",
    position: "header",
    alignment: "center",
    orientation: "horizontal",
    assets: ["/a.png"],
    repeat: 1,
    spacing: 2,
    size: "medium",
    animation: "sway",
    animationIntensity: "normal",
    visibility: "all",
    ...overrides,
  };
}

describe("placementVisibleAt", () => {
  it("follows the CSS breakpoint for responsive groups", () => {
    assert.equal(placementVisibleAt(group({ visibility: "desktop" }), 390), false);
    assert.equal(placementVisibleAt(group({ visibility: "desktop" }), 641), true);
    assert.equal(placementVisibleAt(group({ visibility: "mobile" }), 640), true);
    assert.equal(placementVisibleAt(group({ visibility: "mobile" }), 768), false);
    assert.equal(placementVisibleAt(group({ visibility: "all" }), 390), true);
  });

  it("keeps every group before the viewport is measured", () => {
    assert.equal(placementVisibleAt(group({ visibility: "desktop" }), 0), true);
    assert.equal(placementVisibleAt(group({ visibility: "mobile" }), 0), true);
  });
});

describe("placementEdges", () => {
  it("maps each placement area to the edges it touches", () => {
    assert.deepEqual(placementEdges(group({ position: "header" })), ["top"]);
    assert.deepEqual(placementEdges(group({ position: "top-edge" })), ["top"]);
    assert.deepEqual(placementEdges(group({ position: "bottom-edge" })), ["bottom"]);
    assert.deepEqual(placementEdges(group({ position: "left-edge" })), ["left"]);
    assert.deepEqual(placementEdges(group({ position: "right-edge" })), ["right"]);
    assert.deepEqual(placementEdges(group({ position: "corners" })), [
      "top",
      "bottom",
      "left",
      "right",
    ]);
  });

  it("treats a vertical standard placement as side rails", () => {
    assert.deepEqual(placementEdges(group({ position: "header", orientation: "vertical" })), [
      "left",
      "right",
    ]);
  });

  it("never gives custom coordinates a motif edge", () => {
    assert.deepEqual(placementEdges(group({ position: "custom" })), []);
  });
});

describe("placementItemCount", () => {
  it("multiplies the assets by the repeat cap", () => {
    assert.equal(placementItemCount(group({ assets: ["/a.png", "/b.png"], repeat: 3 })), 6);
    assert.equal(placementItemCount(group({ assets: [], repeat: 3 })), 0);
    assert.equal(placementItemCount(group({ repeat: 40 })), 20);
  });
});

describe("resolvePlacementLayout", () => {
  it("resolves the same offsets for the same groups and viewport", () => {
    const groups = [
      group({ id: "pg-a", position: "top-edge", size: "small" }),
      group({ id: "pg-b", position: "top-edge", size: "large" }),
      group({ id: "pg-c", position: "bottom-edge" }),
    ];
    const first = resolvePlacementLayout(groups, DESKTOP);
    const second = resolvePlacementLayout(groups, DESKTOP);
    assert.deepEqual(first, second);
    assert.deepEqual(
      first.entries.map((entry) => [entry.group.id, entry.offset]),
      [
        ["pg-a", 0],
        ["pg-b", 2.5],
        ["pg-c", 0],
      ],
    );
  });

  it("steps different sizes in the order they are configured", () => {
    const groups = [
      group({ id: "pg-a", size: "small" }),
      group({ id: "pg-b", size: "large" }),
      group({ id: "pg-c", size: "medium" }),
    ];
    const entries = resolvePlacementLayout(groups, DESKTOP).entries;
    assert.deepEqual(entries.map((entry) => entry.offset), [0, 2.5, 7]);
  });

  it("keeps each occupied position on its own cursor", () => {
    const groups = [
      group({ id: "pg-top-a", position: "top-edge" }),
      group({ id: "pg-bottom", position: "bottom-edge" }),
      group({ id: "pg-top-b", position: "top-edge" }),
      group({ id: "pg-top-c", position: "top-edge", size: "small" }),
    ];
    const entries = resolvePlacementLayout(groups, DESKTOP).entries;
    const byId = Object.fromEntries(entries.map((entry) => [entry.group.id, entry.offset]));
    assert.equal(byId["pg-top-a"], 0);
    assert.equal(byId["pg-bottom"], 0);
    assert.equal(byId["pg-top-b"], 3.5);
    assert.equal(byId["pg-top-c"], 7);
  });

  it("does not let a different orientation consume the row offset", () => {
    const groups = [
      group({ id: "pg-row", position: "header", orientation: "horizontal" }),
      group({ id: "pg-rails", position: "header", orientation: "vertical" }),
      group({ id: "pg-row-2", position: "header", orientation: "horizontal" }),
      group({ id: "pg-rails-2", position: "header", orientation: "vertical" }),
    ];
    const entries = resolvePlacementLayout(groups, DESKTOP).entries;
    const byId = Object.fromEntries(entries.map((entry) => [entry.group.id, entry.offset]));
    assert.equal(byId["pg-row"], 0);
    assert.equal(byId["pg-rails"], 0);
    assert.equal(byId["pg-row-2"], 3.5);
    assert.equal(byId["pg-rails-2"], 3.5);
  });

  it("keeps the row, rail, and corner stacks independent", () => {
    assert.equal(placementStackKey(group({ position: "header" })), "header|row");
    assert.equal(
      placementStackKey(group({ position: "header", orientation: "vertical" })),
      "header|rails",
    );
    assert.equal(placementStackKey(group({ position: "left-edge" })), "left-edge");
    assert.equal(placementStackKey(group({ position: "corners" })), "corners");
    assert.equal(placementStackKey(group({ position: "custom" })), null);
  });

  it("skips groups the current viewport hides before assigning offsets", () => {
    const groups = [
      group({ id: "pg-desktop", visibility: "desktop" }),
      group({ id: "pg-mobile", visibility: "mobile" }),
      group({ id: "pg-mobile-2", visibility: "mobile" }),
    ];
    const mobile = resolvePlacementLayout(groups, MOBILE).entries;
    assert.deepEqual(
      mobile.map((entry) => [entry.group.id, entry.offset]),
      [
        ["pg-mobile", 0],
        ["pg-mobile-2", 3.5],
      ],
    );

    const desktop = resolvePlacementLayout(groups, DESKTOP).entries;
    assert.deepEqual(
      desktop.map((entry) => [entry.group.id, entry.offset]),
      [["pg-desktop", 0]],
    );
  });

  it("leaves custom coordinates untouched and outside duplicate cursors", () => {
    const groups = [
      group({ id: "pg-custom", position: "custom", size: "large" }),
      group({ id: "pg-header", position: "header" }),
    ];
    const entries = resolvePlacementLayout(groups, DESKTOP).entries;
    assert.equal(entries[0]?.offset, 0);
    assert.equal(entries[0]?.hidden, false);
    assert.equal(entries[1]?.offset, 0);
  });

  it("hides corner duplicates before they cross the centre", () => {
    const groups = [0, 1, 2, 3].map((index) =>
      group({ id: `pg-c${index}`, position: "corners" }),
    );
    const layout = resolvePlacementLayout(groups, MOBILE);
    // 390px wide: each corner owns 195px, so a 48px ornament with a 24px gutter fits 7.68rem of travel.
    assert.deepEqual(layout.hiddenIds, ["pg-c3"]);
  });

  it("measures a vertical rail against the screen width, not its height", () => {
    const groups = [
      group({ id: "pg-v1", position: "header", orientation: "vertical" }),
      group({ id: "pg-v2", position: "header", orientation: "vertical" }),
    ];
    const shortWide: PlacementViewport = { width: 1200, height: 200, root: 16, header: 4.5 };
    const layout = resolvePlacementLayout(groups, shortWide);
    assert.deepEqual(layout.hiddenIds, []);
    assert.deepEqual(layout.entries.map((entry) => entry.offset), [0, 3.5]);
  });

  it("hides a row duplicate that cannot fit in the band", () => {
    const groups = [
      group({ id: "pg-r1", position: "top-edge" }),
      group({ id: "pg-r2", position: "top-edge" }),
    ];
    const short: PlacementViewport = { width: 390, height: 120, root: 16, header: 4.5 };
    const layout = resolvePlacementLayout(groups, short);
    assert.deepEqual(layout.hiddenIds, ["pg-r2"]);
  });
});

describe("renderedBreakdown", () => {
  it("keeps every rendered slot visible before an image fails", () => {
    assert.deepEqual(renderedBreakdown(["0", "1", "2"], new Set()), { visible: 3, broken: 0 });
  });

  it("subtracts failed slots from the painted count", () => {
    assert.deepEqual(renderedBreakdown(["0", "1", "2"], new Set(["1"])), {
      visible: 2,
      broken: 1,
    });
  });

  it("reports zero painted when every rendered image fails", () => {
    assert.deepEqual(renderedBreakdown(["0", "1"], new Set(["0", "1"])), {
      visible: 0,
      broken: 2,
    });
  });

  it("ignores failures outside the current rendered tail", () => {
    assert.deepEqual(renderedBreakdown(["0", "1"], new Set(["0", "5"])), {
      visible: 1,
      broken: 1,
    });
  });
});

describe("placementLayoutEdges", () => {
  it("keeps an edge while another group still occupies it", () => {
    const both = [group({ id: "a", position: "top-edge" }), group({ id: "b", position: "top-edge" })];
    assert.deepEqual(placementLayoutEdges(resolvePlacementLayout(both, DESKTOP)), ["top"]);

    const one = [group({ id: "b", position: "top-edge" })];
    assert.deepEqual(placementLayoutEdges(resolvePlacementLayout(one, DESKTOP)), ["top"]);

    assert.deepEqual(placementLayoutEdges(resolvePlacementLayout([], DESKTOP)), []);
  });

  it("drops the edge when the last group on it is removed", () => {
    const groups = [group({ id: "a", position: "top-edge" })];
    assert.deepEqual(placementLayoutEdges(resolvePlacementLayout(groups, DESKTOP)), ["top"]);
    const without = groups.filter((entry) => entry.id !== "a");
    assert.deepEqual(placementLayoutEdges(resolvePlacementLayout(without, DESKTOP)), []);
  });

  it("ignores a group hidden at this viewport, even if another edge remains", () => {
    const groups = [
      group({ id: "desktop-top", position: "top-edge", visibility: "desktop" }),
      group({ id: "mobile-bottom", position: "bottom-edge", visibility: "mobile" }),
    ];
    assert.deepEqual(placementLayoutEdges(resolvePlacementLayout(groups, MOBILE)), ["bottom"]);
    assert.deepEqual(placementLayoutEdges(resolvePlacementLayout(groups, DESKTOP)), ["top"]);
  });

  it("does not draw an edge for custom positions", () => {
    const groups = [group({ id: "custom", position: "custom" })];
    assert.deepEqual(placementLayoutEdges(resolvePlacementLayout(groups, DESKTOP)), []);
  });

  it("drops an edge when its last visible ornament is hidden", () => {
    const groups = [group({ id: "a", position: "top-edge" }), group({ id: "b", position: "top-edge" })];
    const layout = resolvePlacementLayout(groups, DESKTOP);
    assert.deepEqual(placementLayoutEdges(layout, { a: 0, b: 2 }), ["top"]);
    assert.deepEqual(placementLayoutEdges(layout, { a: 0, b: 0 }), []);
  });
});
