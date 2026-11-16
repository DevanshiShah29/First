"use client";

import { useId, useState } from "react";
import {
  defaultOrnamentPosition,
  ORNAMENT_POSITIONS,
  VALID_ORNAMENT_POSITIONS,
  type OrnamentPosition,
  type SeasonConfig,
  type SeasonOrnament,
} from "@/content/seasons";
import { ConfirmButton } from "../components/ConfirmDialog";

export type PositionRegion = "all" | "top" | "sides" | "bottom";

export const POSITION_REGIONS: {
  id: PositionRegion;
  label: string;
  positions: OrnamentPosition[];
}[] = [
  {
    id: "all",
    label: "All positions",
    positions: [
      "top-left",
      "top-center",
      "top-right",
      "left-center",
      "right-center",
      "bottom-left",
      "bottom-center",
      "bottom-right",
    ],
  },
  {
    id: "top",
    label: "Top row",
    positions: ["top-left", "top-center", "top-right"],
  },
  {
    id: "sides",
    label: "Edges & sides",
    positions: ["left-center", "right-center"],
  },
  {
    id: "bottom",
    label: "Bottom row",
    positions: ["bottom-left", "bottom-center", "bottom-right"],
  },
];

/** Strips hash or query to get the base image URL. */
export function cleanOrnamentUrl(src?: string | null): string {
  if (!src) return "";
  return src.split("#")[0].split("?")[0].trim();
}

/**
 * Converts stored season images and positions into a position -> image map.
 */
function mapSeasonToAssignments(
  images: string[],
  positions: Record<string, OrnamentPosition>,
): Partial<Record<OrnamentPosition, string>> {
  const assignments: Partial<Record<OrnamentPosition, string>> = {};

  images.forEach((imgKey, index) => {
    const baseSrc = cleanOrnamentUrl(imgKey);
    if (!baseSrc) return;

    // Detect assigned position
    const hash = imgKey.includes("#") ? imgKey.split("#")[1] : null;
    const pos =
      positions[imgKey] ||
      (hash && VALID_ORNAMENT_POSITIONS.has(hash)
        ? (hash as OrnamentPosition)
        : defaultOrnamentPosition(index));

    if (pos && !assignments[pos]) {
      assignments[pos] = baseSrc;
    }
  });

  return assignments;
}

/**
 * Converts position -> image map into stored season images and positions.
 * If the same image is assigned to multiple positions, a #position hash is appended.
 */
function mapAssignmentsToSeason(
  assignments: Partial<Record<OrnamentPosition, string>>,
): { ornamentImages: string[]; ornamentPositions: Record<string, OrnamentPosition> } {
  const ornamentImages: string[] = [];
  const ornamentPositions: Record<string, OrnamentPosition> = {};
  const seenBaseUrls = new Set<string>();

  for (const posMeta of ORNAMENT_POSITIONS) {
    const pos = posMeta.id;
    const baseSrc = assignments[pos]?.trim();
    if (!baseSrc) continue;

    let key = baseSrc;
    if (seenBaseUrls.has(baseSrc)) {
      key = `${baseSrc}#${pos}`;
    } else {
      seenBaseUrls.add(baseSrc);
    }

    ornamentImages.push(key);
    ornamentPositions[key] = pos;
  }

  return { ornamentImages, ornamentPositions };
}

/**
 * Positioning-first ornament editor:
 * Grouped by Top row, Bottom row, Edges & sides.
 * Allows choosing an ornament from the catalogue for each position, with support for reusing the same ornament across positions.
 */
export function SeasonOrnamentPicker({
  images,
  ornaments,
  positions = {},
  cursorOrnament = null,
  onChange,
  onImages,
  onPositions,
  onCursorOrnament,
  onOpenCatalog,
}: {
  images: string[];
  ornaments: SeasonOrnament[];
  positions?: Record<string, OrnamentPosition>;
  cursorOrnament?: string | null;
  onChange?: (patch: Partial<SeasonConfig>) => void;
  onImages: (images: string[]) => void;
  onPositions?: (positions: Record<string, OrnamentPosition>) => void;
  onCursorOrnament?: (cursorOrnament: string | null) => void;
  onOpenCatalog?: () => void;
}) {
  const modalId = useId();
  const [selectedRegion, setSelectedRegion] = useState<PositionRegion>("all");
  const [pickingPosition, setPickingPosition] = useState<OrnamentPosition | null>(null);

  const assignments = mapSeasonToAssignments(images, positions);

  const availableCatalog = ornaments.filter((item) => item.imageUrl);
  const cataloguedUrls = new Set(availableCatalog.map((item) => cleanOrnamentUrl(item.imageUrl)));

  // Collect any assigned images that may not be in the catalog list
  const extraImages = images
    .map((img) => cleanOrnamentUrl(img))
    .filter((url) => Boolean(url) && !cataloguedUrls.has(url));

  const allAvailableOrnaments = [
    ...availableCatalog,
    ...extraImages.map((src, i) => ({
      id: `custom-extra-${i}`,
      name: "Custom Image",
      imageUrl: src,
    })),
  ];

  /** Counts how many positions currently use each ornament URL. */
  const usageCounts: Record<string, OrnamentPosition[]> = {};
  for (const posMeta of ORNAMENT_POSITIONS) {
    const assigned = assignments[posMeta.id];
    if (assigned) {
      if (!usageCounts[assigned]) usageCounts[assigned] = [];
      usageCounts[assigned].push(posMeta.id);
    }
  }

  /**
   * Applies a new position assignment map to the season.
   */
  function applyAssignments(nextAssignments: Partial<Record<OrnamentPosition, string>>) {
    const { ornamentImages, ornamentPositions } = mapAssignmentsToSeason(nextAssignments);

    let nextCursor = cursorOrnament;
    if (
      nextCursor &&
      !ornamentImages.some((img) => cleanOrnamentUrl(img) === cleanOrnamentUrl(nextCursor))
    ) {
      nextCursor = null;
      onCursorOrnament?.(null);
    }

    if (onChange) {
      onChange({
        ornamentImages,
        ornamentPositions,
        cursorOrnament: nextCursor,
      });
    } else {
      onPositions?.(ornamentPositions);
      onImages(ornamentImages);
      if (nextCursor !== cursorOrnament) onCursorOrnament?.(nextCursor);
    }
  }

  /**
   * Assigns an ornament image to a specific screen position.
   */
  function handleAssign(pos: OrnamentPosition, imageUrl: string | null) {
    const next = { ...assignments };
    if (imageUrl) {
      next[pos] = cleanOrnamentUrl(imageUrl);
    } else {
      delete next[pos];
    }
    applyAssignments(next);
    setPickingPosition(null);
  }

  /**
   * Clears every assigned position.
   */
  function handleClearAll() {
    applyAssignments({});
  }

  // Active positions to display based on selected region
  const activeRegionMeta = POSITION_REGIONS.find((r) => r.id === selectedRegion) || POSITION_REGIONS[0];
  const activePositions = activeRegionMeta.positions;

  // Selected unique ornaments for cursor selection
  const uniqueAssignedImages = Array.from(new Set(Object.values(assignments).filter(Boolean))) as string[];
  const selectedOrnaments = uniqueAssignedImages.map((src) => {
    const match = allAvailableOrnaments.find((item) => cleanOrnamentUrl(item.imageUrl) === src);
    return {
      imageUrl: src,
      name: match?.name || "Ornament",
    };
  });

  const totalAssignedCount = Object.keys(assignments).length;
  const pickingMeta = pickingPosition
    ? ORNAMENT_POSITIONS.find((p) => p.id === pickingPosition)
    : null;

  return (
    <div className="wp-season-ornaments">
      <div className="wp-season-catalog-bar">
        <div>
          <h4 className="wp-palette-column-title">Screen positioning & decorations</h4>
          <p className="wp-description">
            Assign ornaments to positions on the screen (top row, bottom row, edges, sides). The same ornament can be placed in multiple positions.
          </p>
        </div>
        {onOpenCatalog ? (
          <button
            type="button"
            className="wp-btn wp-btn-small"
            onClick={onOpenCatalog}
          >
            Open Asset Catalog
          </button>
        ) : null}
      </div>

      {/* Screen Layout Mini-Map */}
      <div className="wp-season-wireframe" aria-label="Screen layout diagram">
        <div className="wp-season-wireframe-header">
          <span>Screen layout overview</span>
          <span className="wp-season-wireframe-count">
            {totalAssignedCount} of 8 positions configured
          </span>
        </div>
        <div className="wp-season-wireframe-screen">
          {/* Top Row */}
          <div className="wp-season-wireframe-row is-top">
            {(["top-left", "top-center", "top-right"] as const).map((posId) => {
              const assignedSrc = assignments[posId];
              const meta = ORNAMENT_POSITIONS.find((p) => p.id === posId)!;
              return (
                <button
                  key={posId}
                  type="button"
                  className={`wp-season-wireframe-cell${assignedSrc ? " has-ornament" : ""}${selectedRegion === "top" ? " is-active-region" : ""}`}
                  title={`${meta.label}: ${assignedSrc ? "Click to change" : "Click to assign"}`}
                  onClick={() => setPickingPosition(posId)}
                >
                  {assignedSrc ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={cleanOrnamentUrl(assignedSrc)} alt="" />
                  ) : (
                    <span className="wp-season-wireframe-icon">{meta.icon}</span>
                  )}
                  <span className="wp-season-wireframe-label">{meta.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sides / Edges Row */}
          <div className="wp-season-wireframe-row is-middle">
            {(["left-center", "right-center"] as const).map((posId) => {
              const assignedSrc = assignments[posId];
              const meta = ORNAMENT_POSITIONS.find((p) => p.id === posId)!;
              return (
                <button
                  key={posId}
                  type="button"
                  className={`wp-season-wireframe-cell${assignedSrc ? " has-ornament" : ""}${selectedRegion === "sides" ? " is-active-region" : ""}`}
                  title={`${meta.label}: ${assignedSrc ? "Click to change" : "Click to assign"}`}
                  onClick={() => setPickingPosition(posId)}
                >
                  {assignedSrc ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={cleanOrnamentUrl(assignedSrc)} alt="" />
                  ) : (
                    <span className="wp-season-wireframe-icon">{meta.icon}</span>
                  )}
                  <span className="wp-season-wireframe-label">{meta.label}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom Row */}
          <div className="wp-season-wireframe-row is-bottom">
            {(["bottom-left", "bottom-center", "bottom-right"] as const).map((posId) => {
              const assignedSrc = assignments[posId];
              const meta = ORNAMENT_POSITIONS.find((p) => p.id === posId)!;
              return (
                <button
                  key={posId}
                  type="button"
                  className={`wp-season-wireframe-cell${assignedSrc ? " has-ornament" : ""}${selectedRegion === "bottom" ? " is-active-region" : ""}`}
                  title={`${meta.label}: ${assignedSrc ? "Click to change" : "Click to assign"}`}
                  onClick={() => setPickingPosition(posId)}
                >
                  {assignedSrc ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={cleanOrnamentUrl(assignedSrc)} alt="" />
                  ) : (
                    <span className="wp-season-wireframe-icon">{meta.icon}</span>
                  )}
                  <span className="wp-season-wireframe-label">{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Region Selector Tabs */}
      <div className="wp-season-region-bar">
        <span className="wp-palette-column-title">Select area:</span>
        <div className="wp-seg" role="group" aria-label="Screen regions">
          {POSITION_REGIONS.map((region) => (
            <label
              key={region.id}
              className={selectedRegion === region.id ? "is-selected" : undefined}
            >
              <input
                type="radio"
                name="season-position-region"
                checked={selectedRegion === region.id}
                onChange={() => setSelectedRegion(region.id)}
              />
              {region.label}
            </label>
          ))}
        </div>
      </div>

      {/* Position Slots Grid */}
      <div className="wp-season-pos-grid">
        {activePositions.map((pos) => {
          const posMeta = ORNAMENT_POSITIONS.find((p) => p.id === pos)!;
          const assignedSrc = assignments[pos];
          const match = assignedSrc
            ? allAvailableOrnaments.find((o) => cleanOrnamentUrl(o.imageUrl) === assignedSrc)
            : null;
          const ornamentName = match?.name || "Ornament";
          const isCursor = assignedSrc && cleanOrnamentUrl(cursorOrnament ?? "") === assignedSrc;
          const usedElsewhere = assignedSrc && (usageCounts[assignedSrc]?.length ?? 0) > 1;
          const otherPositions = assignedSrc
            ? usageCounts[assignedSrc]?.filter((p) => p !== pos) ?? []
            : [];

          return (
            <div
              key={pos}
              className={`wp-season-pos-card${assignedSrc ? " is-assigned" : " is-empty"}`}
            >
              <div className="wp-season-pos-card-head">
                <span className="wp-season-pos-card-title">
                  <span className="wp-season-pos-icon" aria-hidden="true">
                    {posMeta.icon}
                  </span>
                  {posMeta.label}
                </span>
                <span className="wp-season-pos-region-badge">
                  {pos.startsWith("top")
                    ? "Top row"
                    : pos.startsWith("bottom")
                      ? "Bottom row"
                      : "Sides"}
                </span>
              </div>

              {assignedSrc ? (
                <div className="wp-season-pos-card-body">
                  <div className="wp-season-ornament-thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={assignedSrc} alt="" />
                    {isCursor ? (
                      <span className="wp-season-cursor-badge" title="Active custom cursor when live">
                        Cursor
                      </span>
                    ) : null}
                    <span className="wp-season-pos-badge" title={`Position: ${posMeta.label}`}>
                      {posMeta.icon}
                    </span>
                  </div>

                  <div className="wp-season-pos-card-meta">
                    <span className="wp-season-pos-ornament-name">{ornamentName}</span>
                    {usedElsewhere ? (
                      <span
                        className="wp-season-pos-used-tag"
                        title={`Also used in: ${otherPositions.map((p) => ORNAMENT_POSITIONS.find((m) => m.id === p)?.label).join(", ")}`}
                      >
                        Used in {usageCounts[assignedSrc]?.length} positions
                      </span>
                    ) : null}
                  </div>

                  <div className="wp-season-pos-card-actions">
                    <button
                      type="button"
                      className="wp-btn wp-btn-small"
                      onClick={() => setPickingPosition(pos)}
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      className="wp-btn wp-btn-small wp-btn-danger-outline"
                      title={`Remove ornament from ${posMeta.label}`}
                      onClick={() => handleAssign(pos, null)}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ) : (
                <div className="wp-season-pos-empty-slot">
                  <span className="wp-season-pos-empty-icon" aria-hidden="true">
                    {posMeta.icon}
                  </span>
                  <span className="wp-season-pos-empty-text">No ornament assigned</span>
                  <button
                    type="button"
                    className="wp-btn wp-btn-small wp-btn-primary"
                    onClick={() => setPickingPosition(pos)}
                  >
                    + Choose ornament
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Catalogue Chooser Modal / Drawer for Position */}
      {pickingPosition && pickingMeta ? (
        <div
          className="wp-shelf-modal-backdrop wp-season-picker-backdrop"
          role="presentation"
          onClick={() => setPickingPosition(null)}
        >
          <div
            className="wp-season-picker-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${modalId}-title`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="wp-season-picker-modal-head">
              <div>
                <h3 id={`${modalId}-title`} className="wp-palette-column-title">
                  Choose ornament for {pickingMeta.icon} {pickingMeta.label}
                </h3>
                <p className="wp-description">
                  Pick any ornament from the catalogue. One ornament can be placed in multiple positions.
                </p>
              </div>
              <button
                type="button"
                className="wp-btn wp-btn-small"
                onClick={() => setPickingPosition(null)}
              >
                Close
              </button>
            </div>

            <div className="wp-season-picker-modal-body">
              {allAvailableOrnaments.length ? (
                <ul className="wp-season-picker-grid">
                  {allAvailableOrnaments.map((orn) => {
                    const cleanUrl = cleanOrnamentUrl(orn.imageUrl);
                    const isCurrentForThisPos = assignments[pickingPosition] === cleanUrl;
                    const usedInPositions = usageCounts[cleanUrl] || [];
                    const isUsedElsewhere = usedInPositions.length > 0;

                    return (
                      <li
                        key={orn.id}
                        className={`wp-season-picker-card${isCurrentForThisPos ? " is-current" : ""}`}
                      >
                        <div className="wp-season-ornament-thumb">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={cleanUrl} alt="" />
                          {isCurrentForThisPos ? (
                            <span className="wp-season-pos-badge" title="Currently assigned here">
                              ✓ Here
                            </span>
                          ) : null}
                        </div>
                        <span className="wp-season-picker-name">{orn.name || "Ornament"}</span>
                        {isUsedElsewhere ? (
                          <span
                            className="wp-season-picker-used-badge"
                            title={`Currently placed in: ${usedInPositions.map((p) => ORNAMENT_POSITIONS.find((m) => m.id === p)?.label).join(", ")}`}
                          >
                            Used in {usedInPositions.length} spot{usedInPositions.length > 1 ? "s" : ""}
                          </span>
                        ) : null}
                        <button
                          type="button"
                          className={`wp-btn wp-btn-small${isCurrentForThisPos ? " wp-btn-primary" : ""}`}
                          onClick={() => handleAssign(pickingPosition, cleanUrl)}
                        >
                          {isCurrentForThisPos ? "Keep" : "Place here"}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="wp-season-detail-empty">
                  <p className="wp-palette-column-title">No ornaments in the catalogue yet</p>
                  <p className="wp-description">
                    Upload ornament images to the shared catalogue first.
                  </p>
                  {onOpenCatalog ? (
                    <button
                      type="button"
                      className="wp-btn wp-btn-small wp-btn-primary"
                      style={{ marginTop: 8 }}
                      onClick={() => {
                        setPickingPosition(null);
                        onOpenCatalog();
                      }}
                    >
                      Open Asset Catalog
                    </button>
                  ) : null}
                </div>
              )}
            </div>

            <div className="wp-season-picker-modal-foot">
              {assignments[pickingPosition] ? (
                <button
                  type="button"
                  className="wp-btn wp-btn-small wp-btn-danger-outline"
                  onClick={() => handleAssign(pickingPosition, null)}
                >
                  Clear this position (None)
                </button>
              ) : null}
              <button
                type="button"
                className="wp-btn wp-btn-small"
                onClick={() => setPickingPosition(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Custom Cursor Selection */}
      <div className="wp-season-cursor-box">
        <div className="wp-season-cursor-head">
          <h4 className="wp-palette-column-title">Custom cursor</h4>
          <p className="wp-description">
            Select one of the configured ornaments as the custom cursor while this festival is live. The follower trail will trail behind it.
          </p>
        </div>

        {selectedOrnaments.length ? (
          <div className="wp-season-cursor-select">
            <label className={`wp-check wp-cursor-option${!cursorOrnament ? " is-selected" : ""}`}>
              <input
                type="radio"
                name="season-cursor-choice"
                checked={!cursorOrnament}
                onChange={() => onCursorOrnament?.(null)}
              />
              <span>Default brand arrow</span>
            </label>
            {selectedOrnaments.map((orn) => {
              const checked = cleanOrnamentUrl(cursorOrnament ?? "") === orn.imageUrl;
              return (
                <label
                  key={orn.imageUrl}
                  className={`wp-check wp-cursor-option${checked ? " is-selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="season-cursor-choice"
                    checked={checked}
                    onChange={() => onCursorOrnament?.(orn.imageUrl)}
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={orn.imageUrl} alt="" className="wp-season-cursor-preview-img" />
                  <span>{orn.name}</span>
                </label>
              );
            })}
          </div>
        ) : (
          <p className="wp-description">
            Assign at least one ornament to a screen position above to make it the cursor when live.
          </p>
        )}
      </div>

      {totalAssignedCount > 0 ? (
        <div className="wp-theme-edit-actions">
          <ConfirmButton
            className="wp-btn wp-btn-small"
            title="Remove ornaments from all screen positions?"
            confirmLabel="Clear all"
            onConfirm={handleClearAll}
          >
            Clear all positions
          </ConfirmButton>
        </div>
      ) : null}
    </div>
  );
}
