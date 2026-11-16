/**
 * Where placement groups render and how duplicate groups step away from their anchor.
 * Kept separate from the React layer so the editor and the public site agree.
 */

import { placementSizeRem, type PlacementGroup } from "./seasons";

export type PlacementEdge = "top" | "bottom" | "left" | "right";

export type PlacementViewport = {
  width: number;
  height: number;
  root: number;
  header: number;
};

export type PlacementLayoutEntry = {
  group: PlacementGroup;
  /** Distance from the anchor, in rem. Always 0 for custom coordinates. */
  offset: number;
  /** True when the duplicate no longer fits at this viewport. */
  hidden: boolean;
};

export type PlacementLayout = {
  entries: PlacementLayoutEntry[];
  /** Ids of duplicate groups that overflowed at this viewport. */
  hiddenIds: string[];
};

/** Matches the CSS breakpoint that hides desktop-only / mobile-only groups. */
export const PLACEMENT_MOBILE_MAX_WIDTH = 640;

/**
 * True when a group paints at this viewport width. An unmeasured width keeps every group.
 * @example placementVisibleAt({ visibility: "mobile" }, 390) // true
 */
export function placementVisibleAt(group: PlacementGroup, width: number): boolean {
  if (group.visibility === "all" || width <= 0) return true;
  if (group.visibility === "desktop") return width > PLACEMENT_MOBILE_MAX_WIDTH;
  return width <= PLACEMENT_MOBILE_MAX_WIDTH;
}

/**
 * Edges a placement group actually touches. Custom coordinates stay excluded.
 * @example placementEdges({ position: "header", orientation: "horizontal" }) // ["top"]
 */
export function placementEdges(group: PlacementGroup): PlacementEdge[] {
  if (group.position === "custom") return [];
  if (group.position === "corners") return ["top", "bottom", "left", "right"];
  if (group.position === "left-edge") return ["left"];
  if (group.position === "right-edge") return ["right"];
  if (group.orientation === "vertical") return ["left", "right"];
  if (group.position === "header" || group.position === "top-edge") return ["top"];
  if (group.position === "bottom-edge") return ["bottom"];
  return [];
}

/**
 * Rendered ornament count before the viewport hides anything, including repeats.
 * @example placementItemCount({ assets: ["/a.png"], repeat: 3 }) // 3
 */
export function placementItemCount(group: PlacementGroup): number {
  const repeat = Math.max(1, Math.min(20, Math.floor(group.repeat || 1)));
  return repeat * group.assets.length;
}

/**
 * Duplicates only step away from other groups that render in the same shape.
 * A row, a pair of side rails, and a corner fan never share an offset cursor.
 * @example placementStackKey({ position: "header", orientation: "vertical" }) // "header|rails"
 */
export function placementStackKey(group: PlacementGroup): string | null {
  if (group.position === "custom") return null;
  if (group.position === "corners") return "corners";
  if (group.position === "left-edge" || group.position === "right-edge") return group.position;
  if (group.orientation === "vertical") return `${group.position}|rails`;
  return `${group.position}|row`;
}

/**
 * Largest duplicate offset that still keeps a group inside its own part of the screen.
 * Rows use the depth of their band. Rails and corners use their own half of the viewport.
 * @example duplicateOffsetLimit(group, viewport) // 10.5
 */
function duplicateOffsetLimit(group: PlacementGroup, viewport: PlacementViewport): number {
  if (group.position === "custom") return Infinity;
  if (viewport.width <= 0 || viewport.height <= 0) return Infinity;

  const root = viewport.root || 16;
  const sizePx = placementSizeRem(group) * root;
  const horizontalHalf = Math.max(0, (viewport.width / 2 - 1.5 * root - sizePx) / root);

  if (group.position === "corners") {
    const verticalHalf = Math.max(
      0,
      (viewport.height / 2 - (viewport.header + 0.35) * root - sizePx) / root,
    );
    return Math.min(horizontalHalf, verticalHalf);
  }

  if (
    group.position === "left-edge" ||
    group.position === "right-edge" ||
    group.orientation === "vertical"
  ) {
    return horizontalHalf;
  }

  const headerPx = viewport.header * root;
  let topPx: number;
  let bottomPx: number;
  if (group.position === "bottom-edge") {
    topPx = headerPx + 1.25 * root;
    bottomPx = 0.75 * root;
  } else if (group.position === "center") {
    topPx = viewport.height / 2 - sizePx / 2;
    bottomPx = 1.5 * root;
  } else if (group.position === "top-edge") {
    topPx = headerPx + 0.15 * root;
    bottomPx = 1.5 * root;
  } else {
    topPx = headerPx + 0.35 * root;
    bottomPx = 1.5 * root;
  }
  return Math.max(0, (viewport.height - topPx - sizePx - bottomPx) / root);
}

/**
 * Counts how many rendered slots actually painted after image failures.
 * Slots come from the rendered group and are expected to be unique.
 * @example renderedBreakdown(["a", "b"], new Set(["b"])) // { visible: 1, broken: 1 }
 */
export function renderedBreakdown(
  slots: string[],
  broken: ReadonlySet<string>,
): { visible: number; broken: number } {
  let brokenCount = 0;
  for (const slot of slots) {
    if (broken.has(slot)) brokenCount += 1;
  }
  return { visible: Math.max(0, slots.length - brokenCount), broken: brokenCount };
}

/**
 * Motif edges the resolved layout actually paints.
 * Hidden duplicates, hidden viewports, and empty groups never draw an edge.
 * @example placementLayoutEdges(layout) // ["top", "bottom"]
 */
export function placementLayoutEdges(
  layout: PlacementLayout,
  visibleCounts?: Record<string, number>,
): PlacementEdge[] {
  const edges = new Set<PlacementEdge>();
  for (const { group, hidden } of layout.entries) {
    if (hidden) continue;
    const count = visibleCounts?.[group.id] ?? placementItemCount(group);
    if (count <= 0) continue;
    for (const edge of placementEdges(group)) edges.add(edge);
  }
  return [...edges];
}

/**
 * Assigns duplicate offsets in CMS order, skipping groups this viewport cannot paint.
 * Same groups in the same order always resolve to the same offsets.
 * @example resolvePlacementLayout(groups, viewport).hiddenIds // ["pg-9"]
 */
export function resolvePlacementLayout(
  groups: PlacementGroup[],
  viewport: PlacementViewport,
): PlacementLayout {
  const entries: PlacementLayoutEntry[] = [];
  const cursors = new Map<string, number>();
  const hiddenIds: string[] = [];

  for (const group of groups) {
    if (!placementVisibleAt(group, viewport.width)) continue;

    const stack = placementStackKey(group);
    if (!stack) {
      entries.push({ group, offset: 0, hidden: false });
      continue;
    }

    const raw = cursors.get(stack) ?? 0;
    cursors.set(stack, raw + placementSizeRem(group) + 0.5);
    const limit = duplicateOffsetLimit(group, viewport);
    const hidden = raw > limit + 0.01;
    entries.push({ group, offset: Math.min(raw, limit), hidden });
    if (hidden) hiddenIds.push(group.id);
  }

  return { entries, hiddenIds };
}
