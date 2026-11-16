/**
 * What the live preview actually painted, read from the preview iframe DOM.
 * The editor uses this instead of guessing from configured data.
 */

export type PreviewViewport = "desktop" | "tablet" | "mobile";

export type PreviewPlacementCount = {
  id: string;
  position: string;
  visibility: string;
  /** Configured items, including repeats. */
  total: number;
  /** Items the public layer actually painted at this width. */
  visible: number;
  /** Rendered images that failed to load and stayed hidden. */
  broken: number;
};

export type PreviewSeasonSummary = {
  seasonId: string | null;
  viewport: PreviewViewport;
  /** Preview iframe width in CSS pixels. */
  width: number;
  edges: string[];
  /** Duplicate groups that could not fit at this width. */
  hiddenDuplicateIds: string[];
  placements: PreviewPlacementCount[];
};

/**
 * Reads the rendered season layer from the preview document.
 * @example readPreviewSummary(iframe.contentDocument, "mobile") // PreviewSeasonSummary
 */
export function readPreviewSummary(
  doc: Document,
  viewport: PreviewViewport,
): PreviewSeasonSummary {
  const layer = doc.querySelector<HTMLElement>(".season-layer");
  const placements = Array.from(doc.querySelectorAll<HTMLElement>("[data-placement-id]"))
    .map((element) => ({
      id: element.dataset.placementId ?? "",
      position: element.dataset.position ?? "",
      visibility: element.dataset.placementVisibility ?? "all",
      total: Number(element.dataset.totalCount) || 0,
      visible: Number(element.dataset.visibleCount) || 0,
      broken: Number(element.dataset.brokenCount) || 0,
    }))
    .filter((entry) => entry.id);

  const split = (value: string | undefined) => (value ?? "").split(/\s+/).filter(Boolean);

  return {
    seasonId: doc.documentElement.getAttribute("data-season"),
    viewport,
    width: doc.defaultView?.innerWidth ?? doc.documentElement.clientWidth,
    edges: split(layer?.dataset.edges),
    hiddenDuplicateIds: split(layer?.dataset.hiddenGroupIds),
    placements,
  };
}

/**
 * True when two summaries describe the same rendered output.
 * @example samePreviewSummary(a, b) // false
 */
export function samePreviewSummary(
  a: PreviewSeasonSummary | null,
  b: PreviewSeasonSummary | null,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.seasonId === b.seasonId &&
    a.viewport === b.viewport &&
    a.width === b.width &&
    a.edges.join(" ") === b.edges.join(" ") &&
    a.hiddenDuplicateIds.join(" ") === b.hiddenDuplicateIds.join(" ") &&
    a.placements.length === b.placements.length &&
    a.placements.every((entry, index) => {
      const other = b.placements[index];
      return (
        entry.id === other.id &&
        entry.position === other.position &&
        entry.visibility === other.visibility &&
        entry.total === other.total &&
        entry.visible === other.visible &&
        entry.broken === other.broken
      );
    })
  );
}
