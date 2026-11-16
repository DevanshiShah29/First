import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readPreviewSummary, samePreviewSummary } from "./preview-summary";

/**
 * Minimal preview document with one season layer and rendered groups.
 * @example fakePreviewDocument({ seasonId: "diwali" }) // Document
 */
function fakePreviewDocument({
  seasonId = "diwali",
  width = 390,
  edges = "top bottom",
  hidden = "pg-9",
  placements = [
    { id: "pg-1", position: "top-edge", visibility: "all", total: 4, visible: 3, broken: 1 },
    { id: "pg-2", position: "bottom-edge", visibility: "all", total: 2, visible: 2, broken: 0 },
  ],
}: {
  seasonId?: string;
  width?: number;
  edges?: string;
  hidden?: string;
  placements?: {
    id: string;
    position: string;
    visibility: string;
    total: number;
    visible: number;
    broken: number;
  }[];
} = {}) {
  const layer = {
    dataset: { edges, hiddenGroupIds: hidden } as Record<string, string>,
  };
  const nodes = placements.map((entry) => ({
    dataset: {
      placementId: entry.id,
      position: entry.position,
      placementVisibility: entry.visibility,
      totalCount: String(entry.total),
      visibleCount: String(entry.visible),
      brokenCount: String(entry.broken),
    },
  }));
  return {
    querySelector: (selector: string) => (selector === ".season-layer" ? layer : null),
    querySelectorAll: () => nodes,
    documentElement: {
      clientWidth: width,
      getAttribute: (name: string) => (name === "data-season" ? seasonId : null),
    },
  } as unknown as Document;
}

describe("readPreviewSummary", () => {
  it("reads the rendered season, edges, hidden duplicates, and counts", () => {
    const summary = readPreviewSummary(fakePreviewDocument(), "mobile");
    assert.equal(summary.seasonId, "diwali");
    assert.equal(summary.viewport, "mobile");
    assert.equal(summary.width, 390);
    assert.deepEqual(summary.edges, ["top", "bottom"]);
    assert.deepEqual(summary.hiddenDuplicateIds, ["pg-9"]);
    assert.deepEqual(summary.placements, [
      { id: "pg-1", position: "top-edge", visibility: "all", total: 4, visible: 3, broken: 1 },
      { id: "pg-2", position: "bottom-edge", visibility: "all", total: 2, visible: 2, broken: 0 },
    ]);
  });

  it("reports an empty layer when no season decorations painted", () => {
    const summary = readPreviewSummary(
      fakePreviewDocument({ seasonId: "holi", edges: "", hidden: "", placements: [] }),
      "desktop",
    );
    assert.equal(summary.seasonId, "holi");
    assert.deepEqual(summary.edges, []);
    assert.deepEqual(summary.hiddenDuplicateIds, []);
    assert.deepEqual(summary.placements, []);
  });

  it("drops incomplete placement rows", () => {
    const summary = readPreviewSummary(
      fakePreviewDocument({
        placements: [
          { id: "", position: "header", visibility: "all", total: 1, visible: 1, broken: 0 },
          { id: "pg-ok", position: "header", visibility: "all", total: 1, visible: 1, broken: 0 },
        ],
      }),
      "tablet",
    );
    assert.deepEqual(summary.placements.map((entry) => entry.id), ["pg-ok"]);
  });
});

describe("samePreviewSummary", () => {
  it("treats identical renders as equal and count changes as different", () => {
    const first = readPreviewSummary(fakePreviewDocument(), "mobile");
    const second = readPreviewSummary(fakePreviewDocument(), "mobile");
    assert.equal(samePreviewSummary(first, second), true);

    const narrower = readPreviewSummary(fakePreviewDocument({ width: 360 }), "mobile");
    assert.equal(samePreviewSummary(first, narrower), false);

    const fewerVisible = readPreviewSummary(
      fakePreviewDocument({
        placements: [
          { id: "pg-1", position: "top-edge", visibility: "all", total: 4, visible: 2, broken: 0 },
          { id: "pg-2", position: "bottom-edge", visibility: "all", total: 2, visible: 2, broken: 0 },
        ],
      }),
      "mobile",
    );
    assert.equal(samePreviewSummary(first, fewerVisible), false);

    const moreBroken = readPreviewSummary(
      fakePreviewDocument({
        placements: [
          { id: "pg-1", position: "top-edge", visibility: "all", total: 4, visible: 3, broken: 2 },
          { id: "pg-2", position: "bottom-edge", visibility: "all", total: 2, visible: 2, broken: 0 },
        ],
      }),
      "mobile",
    );
    assert.equal(samePreviewSummary(first, moreBroken), false);
  });

  it("handles the empty state", () => {
    assert.equal(samePreviewSummary(null, null), true);
    assert.equal(samePreviewSummary(null, readPreviewSummary(fakePreviewDocument(), "mobile")), false);
  });
});
