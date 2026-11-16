"use client";

import { usePathname } from "next/navigation";
import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import {
  cornerBuckets,
  motifFor,
  positionedOrnamentSpots,
  splitRails,
  spotStyle,
  visibleInTrack,
  type OrnamentSpot,
} from "@/content/season-layout";
import {
  placementLayoutEdges,
  renderedBreakdown,
  resolvePlacementLayout,
} from "@/content/season-placement-layout";
import {
  placementSizeRem,
  seasonOrnamentImageUrl,
  type OrnamentPosition,
  type PlacementAlignment,
  type PlacementGroup,
} from "@/content/seasons";

/**
 * Ornament images for the active season, placed on custom placement groups or legacy positions.
 * Clicks pass through. The admin shell skips them; the preview iframe opts in.
 * @example <SeasonLayer season="diwali" placements={season.placements} placement="preview" />
 */
export function SeasonLayer({
  season,
  images = [],
  positions,
  placements,
  placement = "site",
}: {
  season: string;
  images?: string[];
  positions?: Record<string, OrnamentPosition>;
  placements?: PlacementGroup[];
  placement?: "site" | "preview";
}) {
  const pathname = usePathname();
  // Rows and rails can hide their tail inside the group. An edge disappears
  // with its last rendered ornament, not with its last configured one.
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({});
  const reportVisible = useCallback((groupId: string, count: number) => {
    setVisibleCounts((current) =>
      current[groupId] === count ? current : { ...current, [groupId]: count },
    );
  }, []);
  const isAdminShell = placement === "site" && pathname.startsWith("/admin");
  const viewport = useViewportMetrics(!isAdminShell);
  if (isAdminShell) return null;

  const motif = motifFor(season);

  // Placement groups win when at least one has a usable ornament. A season that
  // uses groups keeps its placement layout even when a group's images fail;
  // legacy positions only apply to seasons that never configured groups.
  const usablePlacements = (placements ?? []).filter((group) =>
    group.assets?.some((src) => Boolean(seasonOrnamentImageUrl(src))),
  );

  // Duplicate positions are staggered in CMS order instead of stacking exactly.
  // Groups the current viewport cannot paint are skipped, so mobile-only groups
  // never consume the offset another group needs on desktop (and the reverse).
  const layout = resolvePlacementLayout(usablePlacements, viewport);
  const placedGroups = layout.entries.filter((entry) => !entry.hidden);

  const dataEdges = placementLayoutEdges(layout, visibleCounts).join(" ");

  // A season using placement groups never falls back to legacy positions just
  // because this width hides every group. Falling back would paint the same
  // assets in the old scatter layout on mobile.
  if (usablePlacements.length > 0) {
    if (placedGroups.length === 0) {
      // Keep the layer's report so the editor can explain which duplicates
      // overflowed instead of showing every group as unexpectedly missing.
      return (
        <div
          className={`season-layer season-layer--motif-${motif} season-layer--placed`}
          data-motif={motif}
          data-edges=""
          data-hidden-groups={layout.hiddenIds.length || undefined}
          data-hidden-group-ids={layout.hiddenIds.join(" ") || undefined}
          aria-hidden="true"
        />
      );
    }
    return (
      <div
        className={`season-layer season-layer--motif-${motif} season-layer--placed`}
        data-motif={motif}
        data-edges={dataEdges}
        data-hidden-groups={layout.hiddenIds.length || undefined}
        data-hidden-group-ids={layout.hiddenIds.join(" ") || undefined}
        aria-hidden="true"
      >
        {placedGroups.map(({ group, offset }) => {
          const key = `${season}|${groupKey(group)}`;
          return (
            <PlacementGroupContainer
              key={key}
              group={group}
              duplicateOffset={offset}
              onVisibleCount={reportVisible}
            />
          );
        })}
      </div>
    );
  }

  // Fallback to legacy ornamentPositions and photos
  const photos = images
    .map((src) => seasonOrnamentImageUrl(src))
    .filter((src): src is string => Boolean(src));
  if (!photos.length) return null;
  const spots = positionedOrnamentSpots(photos, positions);
  return (
    <div className={`season-layer season-layer--motif-${motif}`} data-motif={motif} aria-hidden="true">
      {photos.map((src, index) => (
        <Photo key={`${src}-${index}`} src={src} spot={spots[index]} />
      ))}
    </div>
  );
}

/** Four corner anchors in reading order, with the edge each one grows from. */
const CORNERS = [
  { key: "tl", className: "season-placement-corner is-tl", verticalReverse: false, horizontalReverse: false },
  { key: "tr", className: "season-placement-corner is-tr", verticalReverse: false, horizontalReverse: true },
  { key: "bl", className: "season-placement-corner is-bl", verticalReverse: true, horizontalReverse: false },
  { key: "br", className: "season-placement-corner is-br", verticalReverse: true, horizontalReverse: true },
] as const;

/**
 * Identifies a group by its assets so editing them retries a failed image set.
 * @example groupKey(group) // "pg-1|/uploads/a.png|/uploads/b.png"
 */
function groupKey(group: PlacementGroup): string {
  return `${group.id}|${group.assets.join("|")}`;
}

/**
 * Width a row can use without spilling outside the viewport.
 * Reads resolved insets so custom percentages and calc values work too.
 * @example availableWidthFor(el, "header", custom, 16) // 1392
 */
function availableWidthFor(
  el: HTMLElement,
  position: PlacementGroup["position"],
  custom: { hasLeft: boolean; hasRight: boolean; hasAny: boolean },
  root: number,
): number {
  const viewport = document.documentElement.clientWidth;
  if (position === "center") return Math.max(0, viewport * 0.8);
  const style = getComputedStyle(el);
  const left = parseFloat(style.left) || 0;
  const right = parseFloat(style.right) || 0;
  if (position !== "custom") return Math.max(0, viewport - left - right);
  if (!custom.hasAny) return Math.max(0, viewport - 4 * root);
  if (custom.hasLeft && custom.hasRight) return Math.max(0, viewport - left - right);
  if (custom.hasLeft) return Math.max(0, viewport - left - 0.75 * root);
  if (custom.hasRight) return Math.max(0, viewport - right - 0.75 * root);
  return Math.max(0, viewport - 0.75 * root);
}

/**
 * Fits a single row by hiding the tail, never by shrinking the visible ornaments.
 * Runs before paint and re-measures on viewport or layout changes.
 * @example useQuietRow(ref, 8, 3, 2, true, "header", "header", custom) // 4
 */
function useQuietRow(
  ref: RefObject<HTMLElement | null>,
  count: number,
  sizeRem: number,
  spacingRem: number,
  enabled: boolean,
  layoutKey: string,
  position: PlacementGroup["position"],
  custom: { hasLeft: boolean; hasRight: boolean; hasAny: boolean },
): number {
  const [visible, setVisible] = useState(count);
  const { hasLeft, hasRight, hasAny } = custom;

  useLayoutEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    /**
     * Reads the row's usable width and the current root font size.
     * @example measure() // setVisible(visibleInTrack(...))
     */
    const measure = () => {
      const style = getComputedStyle(el);
      if (style.display === "none") return;
      const root = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const available = availableWidthFor(el, position, { hasLeft, hasRight, hasAny }, root);
      setVisible(visibleInTrack(count, sizeRem, spacingRem, available, root));
    };

    let frame = 0;
    const schedule = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = 0;
        measure();
      });
    };

    measure();
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
    };
  }, [ref, count, sizeRem, spacingRem, enabled, layoutKey, position, hasLeft, hasRight, hasAny]);

  return enabled ? visible : count;
}

/**
 * Fits a vertical rail by hiding its tail at the configured size and spacing.
 * Re-measures when the viewport or layout changes.
 * @example useQuietRail(ref, 8, 3, 2, true, "header", viewportKey) // 9
 */
function useQuietRail(
  ref: RefObject<HTMLElement | null>,
  count: number,
  sizeRem: number,
  spacingRem: number,
  enabled: boolean,
  layoutKey: string,
  viewportKey: string,
): number {
  const [capacity, setCapacity] = useState(count);

  useLayoutEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    /**
     * Reads the rail's usable height and the current root font size.
     * @example measure() // setCapacity(visibleInTrack(...))
     */
    const measure = () => {
      const style = getComputedStyle(el);
      if (style.display === "none") return;
      const root = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const available = el.getBoundingClientRect().height;
      setCapacity(visibleInTrack(count, sizeRem, spacingRem, available, root));
    };

    measure();
  }, [ref, count, sizeRem, spacingRem, enabled, layoutKey, viewportKey]);

  return enabled ? capacity : count;
}

/**
 * Tracks the viewport size for corner boxes and vertical rails.
 * Corner boxes are capped at half the viewport, so they measure the page, not their content.
 * @example useViewportMetrics(true) // { width: 1440, height: 900, root: 16, header: 4.5 }
 */
function useViewportMetrics(enabled: boolean): {
  width: number;
  height: number;
  root: number;
  header: number;
} {
  const [metrics, setMetrics] = useState({ width: 0, height: 0, root: 16, header: 4.5 });

  useLayoutEffect(() => {
    if (!enabled) return;

    /**
     * Reads the current viewport size, root font size, and header height.
     * @example read() // setMetrics({ width, height, root, header })
     */
    const read = () => {
      const root = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const header =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue("--header-h") || "",
        ) || 4.5;
      const width = window.innerWidth;
      const height = window.innerHeight;
      setMetrics((prev) =>
        prev.width === width &&
        prev.height === height &&
        prev.root === root &&
        prev.header === header
          ? prev
          : { width, height, root, header },
      );
    };

    let frame = 0;
    const schedule = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = 0;
        read();
      });
    };

    read();
    window.addEventListener("resize", schedule);
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(schedule);
    observer?.observe(document.documentElement);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, [enabled]);

  return metrics;
}

/**
 * Maps an alignment label to the main-axis value of a row.
 * @example rowJustify("right") // "flex-end"
 */
function rowJustify(alignment: PlacementAlignment): CSSProperties["justifyContent"] {
  if (alignment === "left") return "flex-start";
  if (alignment === "right") return "flex-end";
  if (alignment === "stretch") return "space-between";
  return "center";
}

/**
 * Edge columns reuse alignment as vertical distribution.
 * @example edgeAlignContent("left") // "flex-start"
 */
function edgeAlignContent(alignment: PlacementAlignment): CSSProperties["alignContent"] {
  if (alignment === "left") return "flex-start";
  if (alignment === "right") return "flex-end";
  if (alignment === "stretch") return "space-between";
  return "center";
}

/**
 * Renders one placement group container with its layout, spacing, and repeated assets.
 */
function PlacementGroupContainer({
  group,
  duplicateOffset,
  onVisibleCount,
}: {
  group: PlacementGroup;
  duplicateOffset: number;
  onVisibleCount?: (groupId: string, count: number) => void;
}) {
  const groupRef = useRef<HTMLDivElement>(null);
  const [brokenSlots, setBrokenSlots] = useState<Set<string>>(() => new Set());
  const assetUrls = (group.assets ?? [])
    .map((src) => seasonOrnamentImageUrl(src))
    .filter((src): src is string => Boolean(src));

  const repeatCount = Math.max(1, Math.min(20, Math.floor(group.repeat || 1)));
  const items: string[] = [];
  for (let r = 0; r < repeatCount; r++) {
    items.push(...assetUrls);
  }

  const visibilityClass =
    group.visibility === "desktop"
      ? "is-desktop-only"
      : group.visibility === "mobile"
        ? "is-mobile-only"
        : "";

  const intensityClass = `intensity-${group.animationIntensity || "normal"}`;
  const sizeRem = placementSizeRem(group);
  const isEdge = group.position === "left-edge" || group.position === "right-edge";
  const isRow = !isEdge && group.orientation !== "vertical";
  const layoutKey = [
    group.position,
    group.visibility,
    group.customCoordinates?.top,
    group.customCoordinates?.bottom,
    group.customCoordinates?.left,
    group.customCoordinates?.right,
  ]
    .filter(Boolean)
    .join("|");
  const quietCustom = {
    hasLeft: Boolean(group.customCoordinates?.left),
    hasRight: Boolean(group.customCoordinates?.right),
    hasAny: Boolean(
      group.customCoordinates?.top ||
        group.customCoordinates?.bottom ||
        group.customCoordinates?.left ||
        group.customCoordinates?.right,
    ),
  };
  const visible = useQuietRow(
    groupRef,
    items.length,
    sizeRem,
    group.spacing,
    isRow && group.position !== "corners",
    layoutKey,
    group.position,
    quietCustom,
  );
  const renderedItems = group.position === "corners" ? items : items.slice(0, visible);
  const delegatesCount =
    group.position === "corners" ||
    (!isEdge && group.orientation === "vertical" && group.position !== "custom");
  const rowSlots = renderedItems.map((_, index) => String(index));
  const { visible: painted, broken: brokenRendered } = renderedBreakdown(rowSlots, brokenSlots);

  // Corners and rails report from their own component so the count matches what paints.
  useLayoutEffect(() => {
    if (delegatesCount) return;
    onVisibleCount?.(group.id, painted);
  }, [delegatesCount, onVisibleCount, group.id, painted]);

  if (!assetUrls.length) return null;

  const reportBroken = (slot: string) => {
    setBrokenSlots((current) => {
      if (current.has(slot)) return current;
      const next = new Set(current);
      next.add(slot);
      return next;
    });
  };

  // Corners share one bucket per corner so every ornament renders exactly once.
  if (group.position === "corners") {
    return (
      <CornersGroup
        items={items}
        group={group}
        visibilityClass={visibilityClass}
        intensityClass={intensityClass}
        sizeRem={sizeRem}
        duplicateOffset={duplicateOffset}
        onVisibleCount={onVisibleCount}
      />
    );
  }

  // Vertical standard placements use edge rails. Custom keeps its existing column.
  if (!isEdge && group.orientation === "vertical" && group.position !== "custom") {
    return (
      <VerticalRails
        items={items}
        group={group}
        visibilityClass={visibilityClass}
        intensityClass={intensityClass}
        sizeRem={sizeRem}
        duplicateOffset={duplicateOffset}
        onVisibleCount={onVisibleCount}
      />
    );
  }

  const containerStyle: CSSProperties = isEdge
    ? {
        display: "grid",
        gridAutoFlow: "column",
        gridTemplateRows: `repeat(auto-fill, ${sizeRem}rem)`,
        gap: `${group.spacing}rem`,
        alignContent: edgeAlignContent(group.alignment),
        alignItems: "center",
        justifyItems: "center",
      }
    : {
        display: "flex",
        flexDirection: isRow ? "row" : "column",
        flexWrap: "nowrap",
        gap: `${group.spacing}rem`,
        alignItems: "center",
        justifyContent: rowJustify(group.alignment),
      };

  // Position coordinates
  switch (group.position) {
    case "header":
      containerStyle.top = "calc(var(--header-h, 4.5rem) + 0.35rem)";
      containerStyle.left = "1.5rem";
      containerStyle.right = "1.5rem";
      break;
    case "top-edge":
      // The top edge starts below the fixed site header so ornaments never cover it.
      containerStyle.top = "calc(var(--header-h, 4.5rem) + 0.15rem)";
      containerStyle.left = "0.75rem";
      containerStyle.right = "0.75rem";
      break;
    case "bottom-edge":
      containerStyle.bottom = "0.75rem";
      containerStyle.left = "1.5rem";
      containerStyle.right = "1.5rem";
      break;
    case "left-edge":
      containerStyle.top = "calc(var(--header-h, 4.5rem) + 1.25rem)";
      containerStyle.bottom = "1.5rem";
      containerStyle.left = "0.75rem";
      break;
    case "right-edge":
      containerStyle.top = "calc(var(--header-h, 4.5rem) + 1.25rem)";
      containerStyle.bottom = "1.5rem";
      containerStyle.right = "0.75rem";
      break;
    case "center":
      containerStyle.top = "50%";
      containerStyle.left = "50%";
      containerStyle.transform = "translate(-50%, -50%)";
      containerStyle.maxWidth = "80vw";
      break;
    case "custom": {
      const customLeft = group.customCoordinates?.left;
      const customRight = group.customCoordinates?.right;
      const customHasSpan = Boolean(customLeft && customRight);
      if (group.customCoordinates?.top) containerStyle.top = group.customCoordinates.top;
      if (group.customCoordinates?.bottom) containerStyle.bottom = group.customCoordinates.bottom;
      if (customLeft) containerStyle.left = customLeft;
      if (customRight) containerStyle.right = customRight;
      if (
        !group.customCoordinates?.top &&
        !group.customCoordinates?.bottom &&
        !customLeft &&
        !customRight
      ) {
        containerStyle.top = "calc(var(--header-h, 4.5rem) + 2rem)";
        containerStyle.left = "2rem";
        containerStyle.right = "2rem";
      } else if (isRow && !customHasSpan) {
        // Keep a one-sided custom row inside the viewport instead of letting it run off.
        containerStyle.maxWidth =
          customLeft && !customRight
            ? `calc(100vw - ${customLeft} - 0.75rem)`
            : customRight && !customLeft
              ? `calc(100vw - ${customRight} - 0.75rem)`
              : "calc(100vw - 0.75rem)";
      }
      break;
    }
  }

  // Duplicate groups step away from their anchor in CMS order.
  if (duplicateOffset > 0) {
    if (isEdge) {
      const direction = group.position === "left-edge" ? 1 : -1;
      containerStyle.translate = `${duplicateOffset * direction}rem 0`;
    } else if (group.orientation !== "vertical") {
      const direction = group.position === "bottom-edge" ? -1 : 1;
      containerStyle.translate = `0 ${duplicateOffset * direction}rem`;
    }
  }

  return (
    <div
      ref={groupRef}
      className={[
        "season-placement-group",
        visibilityClass,
        intensityClass,
        isRow ? "is-row" : "",
        isEdge ? "is-edge" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={containerStyle}
      data-placement-id={group.id}
      data-position={group.position}
      data-placement-visibility={group.visibility}
      data-visible-count={painted}
      data-broken-count={brokenRendered}
      data-total-count={items.length}
    >
      {renderedItems.map((src, index) => (
        <PlacementOrnament
          key={`${group.id}-${src}-${index}`}
          src={src}
          group={group}
          index={index}
          slot={String(index)}
          onBroken={reportBroken}
        />
      ))}
    </div>
  );
}

/**
 * Lays a standard vertical placement out as edge rails.
 * Left/right alignment keeps one rail on that side; center/stretch balances two
 * rails on the outer edges. Height overflow is hidden, never shrunk or wrapped.
 * Custom placements keep their existing column and coordinates.
 */
function VerticalRails({
  items,
  group,
  visibilityClass,
  intensityClass,
  sizeRem,
  duplicateOffset,
  onVisibleCount,
}: {
  items: string[];
  group: PlacementGroup;
  visibilityClass: string;
  intensityClass: string;
  sizeRem: number;
  duplicateOffset: number;
  onVisibleCount?: (groupId: string, count: number) => void;
}) {
  const groupRef = useRef<HTMLDivElement>(null);
  const [brokenSlots, setBrokenSlots] = useState<Set<string>>(() => new Set());
  const { width, height, root } = useViewportMetrics(true);
  const viewportKey = `${width}x${height}x${root}`;
  const wantsTwoRails = group.alignment === "center" || group.alignment === "stretch";
  const canTwoRails = width === 0 || sizeRem * root * 2 + 1.5 * root <= width;
  const railCount = wantsTwoRails && canTwoRails ? 2 : 1;

  const layoutKey = `${group.position}|${group.visibility}`;
  const perRail = useQuietRail(
    groupRef,
    items.length,
    sizeRem,
    group.spacing,
    true,
    layoutKey,
    viewportKey,
  );
  const visibleTotal = Math.min(items.length, perRail * railCount);
  const visible = items.slice(0, visibleTotal).map((src, index) => ({ src, index }));
  const rails = railCount === 2 ? splitRails(visible) : [visible];
  const renderedSlots = visible.map((item) => String(item.index));
  const { visible: painted, broken: brokenRendered } = renderedBreakdown(
    renderedSlots,
    brokenSlots,
  );

  useLayoutEffect(() => {
    onVisibleCount?.(group.id, painted);
  }, [onVisibleCount, group.id, painted]);

  const reportBroken = (slot: string) => {
    setBrokenSlots((current) => {
      if (current.has(slot)) return current;
      const next = new Set(current);
      next.add(slot);
      return next;
    });
  };

  const containerStyle: CSSProperties = {
    display: "flex",
    flexDirection: "row",
    alignItems: "stretch",
    gap: 0,
    left: "0.75rem",
    right: "0.75rem",
  };

  if (group.position === "bottom-edge") {
    containerStyle.top = "calc(var(--header-h, 4.5rem) + 1.25rem)";
    containerStyle.bottom = "0.75rem";
  } else if (group.position === "top-edge") {
    containerStyle.top = "calc(var(--header-h, 4.5rem) + 0.15rem)";
    containerStyle.bottom = "1.5rem";
  } else {
    containerStyle.top = "calc(var(--header-h, 4.5rem) + 0.35rem)";
    containerStyle.bottom = "1.5rem";
  }
  containerStyle.justifyContent =
    railCount === 2
      ? "space-between"
      : group.alignment === "right"
        ? "flex-end"
        : "flex-start";

  const railJustify: CSSProperties["justifyContent"] =
    group.alignment === "stretch"
      ? "space-between"
      : group.position === "center"
        ? "center"
        : group.position === "bottom-edge"
          ? "flex-end"
          : "flex-start";

  const railStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: `${group.spacing}rem`,
    alignItems: "center",
    justifyContent: railJustify,
    height: "100%",
  };

  return (
    <div
      className={["season-placement-group is-vertical", visibilityClass, intensityClass]
        .filter(Boolean)
        .join(" ")}
      ref={groupRef}
      style={containerStyle}
      data-placement-id={group.id}
      data-position={group.position}
      data-placement-visibility={group.visibility}
      data-visible-count={painted}
      data-broken-count={brokenRendered}
      data-total-count={items.length}
      data-rail-count={railCount}
    >
      {rails.map((rail, railIndex) => {
        const direction =
          railCount === 2
            ? railIndex === 0
              ? 1
              : -1
            : group.alignment === "right"
              ? -1
              : 1;
        const style: CSSProperties =
          duplicateOffset > 0
            ? { ...railStyle, translate: `${duplicateOffset * direction}rem 0` }
            : railStyle;

        return (
          <div key={railIndex} style={style} data-rail={railIndex}>
            {rail.map(({ src, index }) => (
              <PlacementOrnament
                key={`${railIndex}-${index}-${src}`}
                src={src}
                group={group}
                index={index}
                slot={String(index)}
                onBroken={reportBroken}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Distributes a group's ornaments across the four corners.
 * Each corner grows inward from its own edge, and every item renders once.
 */
function CornersGroup({
  items,
  group,
  visibilityClass,
  intensityClass,
  sizeRem,
  duplicateOffset,
  onVisibleCount,
}: {
  items: string[];
  group: PlacementGroup;
  visibilityClass: string;
  intensityClass: string;
  sizeRem: number;
  duplicateOffset: number;
  onVisibleCount?: (groupId: string, count: number) => void;
}) {
  const [brokenSlots, setBrokenSlots] = useState<Set<string>>(() => new Set());
  const buckets = cornerBuckets(items);
  const isColumn = group.orientation === "vertical";
  const { width, height, root, header } = useViewportMetrics(true);
  const availableWidth = width > 0 ? width / 2 - 1.5 * root : 0;
  const availableTop = height > 0 ? height / 2 - (header + 0.35) * root : 0;
  const availableBottom = height > 0 ? height / 2 - 0.75 * root : 0;

  // Each corner hides its own tail at the configured size and spacing.
  const slices = buckets.map((bucket, index) => {
    const corner = CORNERS[index];
    const available = isColumn
      ? corner.verticalReverse
        ? availableBottom
        : availableTop
      : availableWidth;
    const ready = isColumn ? height > 0 : width > 0;
    const visible = ready
      ? visibleInTrack(bucket.length, sizeRem, group.spacing, available, root)
      : bucket.length;
    return {
      items: bucket.slice(0, visible),
      maxHeight: isColumn && ready ? Math.max(0, available) : undefined,
    };
  });
  const renderedSlots = slices.flatMap((slice, cornerIndex) =>
    slice.items.map((_, itemIndex) => `${CORNERS[cornerIndex].key}-${itemIndex}`),
  );
  const { visible: painted, broken: brokenRendered } = renderedBreakdown(
    renderedSlots,
    brokenSlots,
  );

  useLayoutEffect(() => {
    onVisibleCount?.(group.id, painted);
  }, [onVisibleCount, group.id, painted]);

  const reportBroken = (slot: string) => {
    setBrokenSlots((current) => {
      if (current.has(slot)) return current;
      const next = new Set(current);
      next.add(slot);
      return next;
    });
  };

  return (
    <div
      className={[
        "season-placement-group is-corners",
        visibilityClass,
        intensityClass,
        isColumn ? "" : "is-row",
      ]
        .filter(Boolean)
        .join(" ")}
      data-placement-id={group.id}
      data-position={group.position}
      data-placement-visibility={group.visibility}
      data-visible-count={painted}
      data-broken-count={brokenRendered}
      data-total-count={items.length}
    >
      {CORNERS.map((corner, index) => {
        const slice = slices[index];
        if (!slice.items.length) return null;
        const reverse = isColumn ? corner.verticalReverse : corner.horizontalReverse;
        const signX = corner.key === "tl" || corner.key === "bl" ? 1 : -1;
        const signY = corner.key === "tl" || corner.key === "tr" ? 1 : -1;
        const style: CSSProperties = {
          display: "flex",
          flexDirection: isColumn
            ? reverse
              ? "column-reverse"
              : "column"
            : reverse
              ? "row-reverse"
              : "row",
          flexWrap: "nowrap",
          gap: `${group.spacing}rem`,
          alignItems: "center",
          maxWidth: "calc(50vw - 1.5rem)",
          maxHeight: slice.maxHeight != null ? `${slice.maxHeight}px` : undefined,
          translate:
            duplicateOffset > 0
              ? `${duplicateOffset * signX}rem ${duplicateOffset * signY}rem`
              : undefined,
        };

        return (
          <div key={corner.key} className={corner.className} style={style}>
            {slice.items.map((src, itemIndex) => (
              <PlacementOrnament
                key={`${corner.key}-${src}-${itemIndex}`}
                src={src}
                group={group}
                index={itemIndex}
                slot={`${corner.key}-${itemIndex}`}
                onBroken={reportBroken}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

/**
 * One ornament in a placement group.
 */
function PlacementOrnament({
  src,
  group,
  index,
  slot,
  onBroken,
}: {
  src: string;
  group: PlacementGroup;
  index: number;
  slot: string;
  onBroken: (slot: string) => void;
}) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;

  const handleError = () => {
    setHidden(true);
    onBroken(slot);
  };

  const sizeClass = `season-ornament--${group.size}`;
  const animClass = `season-ornament--${group.animation}`;

  const style: CSSProperties = {
    animationDelay: `${((index * 0.35) % 3).toFixed(2)}s`,
  };

  if (group.size === "custom" && group.customSize) {
    (style as Record<string, string>)["--ornament-size"] = `${group.customSize}rem`;
    style.width = `${group.customSize}rem`;
    style.height = `${group.customSize}rem`;
  }

  // For diagonal/free orientations, use a wrapper span so offset transforms
  // don't conflict with the CSS animation transform on the ornament itself.
  if (group.orientation === "diagonal") {
    const wrapStyle: CSSProperties = {
      display: "inline-block",
      transform: `translateY(${index * 12}px)`,
    };
    return (
      <span className="season-ornament-wrap" style={wrapStyle}>
        <span
          className={`season-ornament season-ornament--photo ${sizeClass} ${animClass}`}
          style={style}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" decoding="async" onError={handleError} />
        </span>
      </span>
    );
  }

  if (group.orientation === "free") {
    const x = (index % 2 === 0 ? 1 : -1) * (8 + ((index * 4) % 14));
    const y = (index % 3 === 0 ? -1 : 1) * (6 + ((index * 5) % 16));
    const wrapStyle: CSSProperties = {
      display: "inline-block",
      transform: `translate(${x}px, ${y}px)`,
    };
    return (
      <span className="season-ornament-wrap" style={wrapStyle}>
        <span
          className={`season-ornament season-ornament--photo ${sizeClass} ${animClass}`}
          style={style}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" decoding="async" onError={handleError} />
        </span>
      </span>
    );
  }

  return (
    <span
      className={`season-ornament season-ornament--photo ${sizeClass} ${animClass}`}
      style={style}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" decoding="async" onError={handleError} />
    </span>
  );
}

/**
 * One uploaded ornament. A broken address is removed from the layer.
 * @example <Photo src="/uploads/artifacts/bat.png" spot={spot} />
 */
function Photo({ src, spot }: { src: string; spot: OrnamentSpot | undefined }) {
  const [hidden, setHidden] = useState(false);
  if (hidden || !spot) return null;
  return (
    <span
      className={`season-ornament season-ornament--photo season-ornament--${spot.size} season-ornament--${spot.motion}${spot.quiet ? " is-quiet" : ""}${spot.anchor === "corner" ? " is-corner" : ""}`}
      data-anchor={spot.anchor}
      data-corner={spot.corner ?? undefined}
      style={spotStyle(spot) as CSSProperties}
    >
      {/* Addresses may be any https host the editor accepted. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" decoding="async" onError={() => setHidden(true)} />
    </span>
  );
}
