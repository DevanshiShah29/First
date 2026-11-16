"use client";

import {
  placementItemCount,
  placementVisibleAt,
} from "@/content/season-placement-layout";
import type { SeasonConfig } from "@/content/seasons";
import type { PreviewSeasonSummary } from "../preview/preview-summary";

const EDGE_LABELS: Record<string, string> = {
  top: "top",
  bottom: "bottom",
  left: "left",
  right: "right",
};

const VIEWPORT_LABELS: Record<PreviewSeasonSummary["viewport"], string> = {
  desktop: "desktop",
  tablet: "tablet",
  mobile: "mobile",
};

/**
 * What the public layer actually paints, not what the CMS stores.
 * @example <SeasonRenderSummary season={item} summary={summary} />
 */
export function SeasonRenderSummary({
  season,
  summary,
}: {
  season: SeasonConfig | null;
  summary: PreviewSeasonSummary | null;
}) {
  if (!season) {
    return (
      <div className="wp-season-render-summary" role="status">
        <p className="wp-season-render-summary-head">Live preview</p>
        <p className="wp-season-render-summary-note">
          No season is showing, so visitors see the year-round theme.
        </p>
      </div>
    );
  }

  const groups = (season.placements ?? []).filter((group) => group.assets.length > 0);
  const configured = groups.reduce((total, group) => total + placementItemCount(group), 0);

  if (season.intensity === "subtle") {
    return (
      <div className="wp-season-render-summary" role="status">
        <p className="wp-season-render-summary-head">Live preview</p>
        <p className="wp-season-render-summary-note is-warning">
          Palette only: {configured} configured ornament{configured === 1 ? "" : "s"} stay hidden on
          the public site.
        </p>
      </div>
    );
  }

  if (!summary || summary.seasonId !== season.id) {
    return (
      <div className="wp-season-render-summary" role="status">
        <p className="wp-season-render-summary-head">Live preview</p>
        <p className="wp-season-render-summary-note">Reading what the page renders…</p>
      </div>
    );
  }

  const renderedById = new Map(summary.placements.map((entry) => [entry.id, entry]));
  const groupById = new Map(groups.map((group) => [group.id, group]));
  const visible = summary.placements.reduce((total, entry) => {
    const group = groupById.get(entry.id);
    if (!group || !placementVisibleAt(group, summary.width)) return total;
    return total + entry.visible;
  }, 0);
  const broken = summary.placements.reduce((total, entry) => {
    const group = groupById.get(entry.id);
    if (!group || !placementVisibleAt(group, summary.width)) return total;
    return total + entry.broken;
  }, 0);
  const hiddenDuplicates = new Set(summary.hiddenDuplicateIds);
  const hiddenNames = groups
    .filter((group) => hiddenDuplicates.has(group.id))
    .map((group) => group.name || "Untitled group");
  const viewportHidden = groups.filter((group) => !placementVisibleAt(group, summary.width)).length;
  const missing = groups.filter(
    (group) =>
      placementVisibleAt(group, summary.width) &&
      !renderedById.has(group.id) &&
      !hiddenDuplicates.has(group.id),
  ).length;
  const emptyRows = summary.placements.filter((entry) => {
    const group = groupById.get(entry.id);
    return (
      entry.visible === 0 &&
      entry.broken === 0 &&
      group &&
      placementVisibleAt(group, summary.width)
    );
  }).length;
  const edges = summary.edges.map((edge) => EDGE_LABELS[edge] ?? edge);

  return (
    <div className="wp-season-render-summary" role="status" aria-live="polite">
      <p className="wp-season-render-summary-head">Live preview</p>
      <div className="wp-season-render-summary-metrics">
        <span className="wp-season-render-metric">
          <strong>{visible}</strong> of {configured} ornaments visible
        </span>
        <span className="wp-season-render-metric">
          {summary.width}px · {VIEWPORT_LABELS[summary.viewport]}
        </span>
      </div>
      <p className="wp-season-render-summary-note">
        {configured === 0
          ? "No ornaments are configured for this season."
          : edges.length
            ? `Motif edges painted: ${edges.join(", ")}.`
            : groups.every((group) => group.position === "custom")
              ? "Custom positions do not draw a motif edge."
              : "No motif edge is painted at this width."}
      </p>
      {viewportHidden > 0 ? (
        <p className="wp-season-render-summary-note">
          {viewportHidden} group{viewportHidden === 1 ? "" : "s"} only show at another screen width.
        </p>
      ) : null}
      {hiddenNames.length > 0 ? (
        <p className="wp-season-render-summary-note is-warning">
          Hidden at this width because duplicates overflow: {hiddenNames.join(", ")}.
        </p>
      ) : null}
      {missing > 0 ? (
        <p className="wp-season-render-summary-note is-warning">
          {missing} group{missing === 1 ? "" : "s"} did not render; check the ornament images.
        </p>
      ) : null}
      {broken > 0 ? (
        <p className="wp-season-render-summary-note is-warning">
          {broken} ornament image{broken === 1 ? "" : "s"} failed to load and stayed hidden.
        </p>
      ) : null}
      {emptyRows > 0 ? (
        <p className="wp-season-render-summary-note is-warning">
          {emptyRows} group{emptyRows === 1 ? "" : "s"} could not fit a single ornament at this
          width.
        </p>
      ) : null}
    </div>
  );
}
