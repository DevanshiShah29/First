"use client";

import { useId, useState } from "react";
import {
  createPlacementGroup,
  PLACEMENT_ALIGNMENTS,
  PLACEMENT_ANIMATIONS,
  PLACEMENT_INTENSITIES,
  PLACEMENT_ORIENTATIONS,
  PLACEMENT_POSITIONS,
  PLACEMENT_SIZES,
  PLACEMENT_VISIBILITIES,
  type PlacementAlignment,
  type PlacementAnimation,
  type PlacementAnimationIntensity,
  type PlacementGroup,
  type PlacementOrientation,
  type PlacementPosition,
  type PlacementSize,
  type PlacementVisibility,
  type SeasonOrnament,
} from "@/content/seasons";
import {
  placementItemCount,
  placementVisibleAt,
} from "@/content/season-placement-layout";
import { cleanOrnamentUrl } from "./SeasonOrnamentPicker";
import { ConfirmButton } from "../components/ConfirmDialog";
import type { PreviewSeasonSummary } from "../preview/preview-summary";

const SPACING_PRESETS = [
  { label: "Tight", value: 1 },
  { label: "Normal", value: 2 },
  { label: "Loose", value: 3.5 },
  { label: "Wide", value: 5 },
];

/** Visual mini-map of which position each group uses */
function PositionMinimap({
  position,
}: {
  position: PlacementPosition;
}) {
  const cells: { id: PlacementPosition; label: string; gridArea: string }[] = [
    { id: "top-edge", label: "Top", gridArea: "1 / 1 / 2 / 4" },
    { id: "header", label: "Header", gridArea: "2 / 1 / 3 / 4" },
    { id: "left-edge", label: "L", gridArea: "3 / 1 / 4 / 2" },
    { id: "center", label: "·", gridArea: "3 / 2 / 4 / 3" },
    { id: "right-edge", label: "R", gridArea: "3 / 3 / 4 / 4" },
    { id: "corners", label: "⌞ ⌟", gridArea: "4 / 1 / 5 / 4" },
    { id: "bottom-edge", label: "Bottom", gridArea: "5 / 1 / 6 / 4" },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 2fr 1fr",
        gridTemplateRows: "auto auto auto auto auto",
        gap: 2,
        width: 90,
        flexShrink: 0,
      }}
      title={`Position: ${position}`}
    >
      {cells.map((cell) => (
        <div
          key={cell.id}
          style={{
            gridArea: cell.gridArea,
            background: position === cell.id ? "#2271b1" : "#e9e9e9",
            color: position === cell.id ? "#fff" : "#8c8f94",
            borderRadius: 2,
            fontSize: 7,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2px 3px",
            fontWeight: position === cell.id ? 700 : 400,
            lineHeight: 1,
            minHeight: cell.id === "left-edge" || cell.id === "right-edge" || cell.id === "center" ? 20 : 12,
          }}
        >
          {cell.label}
        </div>
      ))}
      {position === "custom" ? (
        <div
          style={{
            gridArea: "3 / 1 / 4 / 4",
            background: "#2271b1",
            color: "#fff",
            borderRadius: 2,
            fontSize: 7,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2px 3px",
            fontWeight: 700,
            minHeight: 20,
          }}
        >
          Custom
        </div>
      ) : null}
    </div>
  );
}

/**
 * Placement Groups editor for festival decorations.
 * Allows creating, configuring, duplicating, reordering, and deleting placement groups.
 */
export function SeasonPlacementEditor({
  placements,
  ornaments,
  renderSummary,
  cursorOrnament,
  onOpenCatalog,
  onChangePlacements,
  onCursorOrnament,
}: {
  placements: PlacementGroup[];
  ornaments: SeasonOrnament[];
  renderSummary?: PreviewSeasonSummary | null;
  cursorOrnament: string | null;
  onOpenCatalog?: () => void;
  onChangePlacements: (placements: PlacementGroup[]) => void;
  onCursorOrnament: (cursorOrnament: string | null) => void;
}) {
  const modalId = useId();
  const [pickingGroupId, setPickingGroupId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    return placements.length > 0 ? new Set([placements[0].id]) : new Set();
  });

  const availableCatalog = ornaments.filter((item) => item.imageUrl);
  const renderedById = new Map(
    (renderSummary?.placements ?? []).map((entry) => [entry.id, entry]),
  );
  const hiddenDuplicateIds = new Set(renderSummary?.hiddenDuplicateIds ?? []);
  const viewportWidth = renderSummary?.width ?? 0;

  // All unique assets across all placement groups
  const allUsedAssets = Array.from(
    new Set(
      placements.flatMap((g) => g.assets.map((src) => cleanOrnamentUrl(src))).filter(Boolean),
    ),
  );

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAddPlacement = () => {
    const newGroup = createPlacementGroup({
      name: `Placement ${placements.length + 1}`,
      position: placements.length === 0 ? "header" : "bottom-edge",
      assets: availableCatalog.length > 0 ? [cleanOrnamentUrl(availableCatalog[0].imageUrl)] : [],
    });
    const next = [...placements, newGroup];
    setExpandedIds((prev) => new Set([...prev, newGroup.id]));
    onChangePlacements(next);
  };

  const handleDuplicate = (id: string) => {
    const idx = placements.findIndex((g) => g.id === id);
    if (idx === -1) return;
    const target = placements[idx];
    const clone: PlacementGroup = {
      ...target,
      id: `pg-${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`,
      name: `${target.name} (Copy)`,
      assets: [...target.assets],
      customCoordinates: target.customCoordinates ? { ...target.customCoordinates } : undefined,
    };
    const next = [...placements.slice(0, idx + 1), clone, ...placements.slice(idx + 1)];
    setExpandedIds((prev) => new Set([...prev, clone.id]));
    onChangePlacements(next);
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= placements.length) return;
    const next = [...placements];
    const [removed] = next.splice(index, 1);
    next.splice(targetIndex, 0, removed);
    onChangePlacements(next);
  };

  const handleDelete = (id: string) => {
    const next = placements.filter((g) => g.id !== id);
    onChangePlacements(next);
  };

  const handleUpdate = (id: string, patch: Partial<PlacementGroup>) => {
    const next = placements.map((g) => (g.id === id ? { ...g, ...patch } : g));
    onChangePlacements(next);
  };

  const handleAddAssetToGroup = (groupId: string, imageUrl: string) => {
    const group = placements.find((g) => g.id === groupId);
    if (!group) return;
    const nextAssets = [...group.assets, cleanOrnamentUrl(imageUrl)];
    handleUpdate(groupId, { assets: nextAssets });
  };

  const handleRemoveAssetFromGroup = (groupId: string, assetIndex: number) => {
    const group = placements.find((g) => g.id === groupId);
    if (!group) return;
    const nextAssets = group.assets.filter((_, idx) => idx !== assetIndex);
    handleUpdate(groupId, { assets: nextAssets });
  };

  const activePickingGroup = pickingGroupId
    ? placements.find((g) => g.id === pickingGroupId)
    : null;

  return (
    <div className="wp-season-ornaments">
      {/* Header bar */}
      <div className="wp-season-catalog-bar">
        <div>
          <h4 className="wp-palette-column-title">Placement Groups</h4>
          <p className="wp-description">
            Arrange ornaments in named groups — header garlands, edge borders, corners, or custom positions.
          </p>
          <p className="wp-description">
            “Configured” counts every repeated ornament. “Visible” comes from the live preview at the
            selected width, so it also drops groups the public page hides.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          <button
            type="button"
            className="wp-btn wp-btn-small wp-btn-primary"
            onClick={handleAddPlacement}
          >
            + Add Group
          </button>
          {onOpenCatalog ? (
            <button
              type="button"
              className="wp-btn wp-btn-small"
              onClick={onOpenCatalog}
            >
              Ornament Catalog
            </button>
          ) : null}
        </div>
      </div>

      {/* Empty State */}
      {placements.length === 0 ? (
        <div className="wp-season-detail-empty" style={{ padding: "40px 16px" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎄</div>
          <p className="wp-palette-column-title">No placement groups yet</p>
          <p className="wp-description" style={{ maxWidth: 360, margin: "4px auto 16px" }}>
            Create groups to place ornaments anywhere on the screen — top header, floor edges, side
            columns, corners, or fully custom positions.
          </p>
          <button
            type="button"
            className="wp-btn wp-btn-primary"
            onClick={handleAddPlacement}
          >
            + Add First Group
          </button>
        </div>
      ) : (
        <div
          className="wp-placement-list"
          style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}
        >
          {placements.map((group, index) => {
            const isExpanded = expandedIds.has(group.id);
            const posMeta = PLACEMENT_POSITIONS.find((p) => p.id === group.position) || PLACEMENT_POSITIONS[0];
            const sizeMeta = PLACEMENT_SIZES.find((s) => s.id === group.size) || PLACEMENT_SIZES[1];
            const animMeta = PLACEMENT_ANIMATIONS.find((a) => a.id === group.animation) || PLACEMENT_ANIMATIONS[0];
            const visMeta = PLACEMENT_VISIBILITIES.find((v) => v.id === group.visibility) || PLACEMENT_VISIBILITIES[0];
            const hasAssets = group.assets.length > 0;
            const totalItems = placementItemCount(group);
            const rendered = renderedById.get(group.id);
            const shownHere = !renderSummary || placementVisibleAt(group, viewportWidth);
            const overflowHidden = hiddenDuplicateIds.has(group.id);
            const isEdge = group.position === "left-edge" || group.position === "right-edge";
            const isCorners = group.position === "corners";
            const isCustom = group.position === "custom";
            const renderNote =
              !renderSummary || !hasAssets
                ? null
                : !shownHere
                  ? { tone: "info", text: `${visMeta.label}: this group is hidden at ${viewportWidth}px.` }
                  : overflowHidden
                    ? {
                        tone: "warning",
                        text: "Hidden at this width: earlier groups already fill this area. Reorder the list or widen the preview to see it.",
                      }
                    : !rendered
                      ? {
                          tone: "warning",
                          text: "This group did not render. Check that its ornament images load.",
                        }
                      : rendered.broken > 0
                        ? {
                            tone: "warning",
                            text: `${rendered.broken} image${rendered.broken === 1 ? "" : "s"} failed to load${rendered.visible < rendered.total ? `; ${rendered.visible} of ${rendered.total} painted` : ""}.`,
                          }
                        : rendered.visible === 0
                          ? {
                              tone: "warning",
                              text: "No ornament fits at this width. Reduce the ornament size or spacing.",
                            }
                          : rendered.visible < rendered.total
                            ? {
                                tone: "info",
                                text: `${rendered.visible} of ${rendered.total} configured ornaments fit at ${viewportWidth}px; the rest stay configured.`,
                              }
                            : {
                                tone: "ok",
                                text: `All ${rendered.total} configured ornaments render at ${viewportWidth}px.`,
                              };

            return (
              <div
                key={group.id}
                className="wp-season-pos-card"
                style={{
                  borderRadius: 8,
                  border: isExpanded ? "1px solid #2271b1" : "1px solid #dcdcde",
                  boxShadow: isExpanded
                    ? "0 0 0 1px #2271b1, 0 2px 8px rgba(34,113,177,0.08)"
                    : "0 1px 2px rgba(0,0,0,0.04)",
                  overflow: "hidden",
                  background: "#fff",
                }}
              >
                {/* Card Header — click to expand/collapse */}
                <div
                  className="wp-season-pos-card-head"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    background: isExpanded ? "#f0f6fc" : "#f6f7f7",
                    cursor: "pointer",
                    userSelect: "none",
                    borderBottom: isExpanded ? "1px solid #d0e6f7" : "none",
                  }}
                  onClick={() => toggleExpand(group.id)}
                >
                  {/* Reorder */}
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      className="wp-btn"
                      style={{ padding: "0 5px", height: 15, minHeight: 15, fontSize: 9, lineHeight: 1 }}
                      disabled={index === 0}
                      title="Move Up"
                      onClick={() => handleMove(index, -1)}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      className="wp-btn"
                      style={{ padding: "0 5px", height: 15, minHeight: 15, fontSize: 9, lineHeight: 1 }}
                      disabled={index === placements.length - 1}
                      title="Move Down"
                      onClick={() => handleMove(index, 1)}
                    >
                      ▼
                    </button>
                  </div>

                  {/* Position minimap */}
                  <div onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
                    <PositionMinimap position={group.position} />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: "#1d2327", lineHeight: 1.3 }}>
                      {group.name || "Untitled Group"}
                    </span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
                      <span className="wp-season-pos-region-badge" style={{ background: "#dbeafe", color: "#1e40af" }}>
                        {posMeta.icon} {posMeta.label}
                      </span>
                      <span className="wp-season-pos-region-badge">
                        {hasAssets
                          ? `${totalItems} configured`
                          : "⚠ no ornaments"}
                      </span>
                      <span className="wp-season-pos-region-badge">{sizeMeta.label}</span>
                      <span className="wp-season-pos-region-badge">{animMeta.label}</span>
                      {group.visibility !== "all" ? (
                        <span className="wp-season-pos-region-badge" style={{ background: "#e0f2fe", color: "#0369a1" }}>
                          {visMeta.label}
                        </span>
                      ) : null}
                      {renderSummary && hasAssets && shownHere && !overflowHidden ? (
                        <span
                          className={`wp-season-pos-region-badge${rendered && rendered.visible === 0 ? " is-warning" : ""}`}
                          title={`Rendered by the preview at ${viewportWidth}px`}
                        >
                          {rendered
                            ? `${rendered.visible} of ${rendered.total} visible`
                            : "Not rendered"}
                        </span>
                      ) : null}
                      {renderSummary && rendered && rendered.broken > 0 && shownHere ? (
                        <span
                          className="wp-season-pos-region-badge is-warning"
                          title="These images failed to load in the preview"
                        >
                          {rendered.broken} image{rendered.broken === 1 ? "" : "s"} failed
                        </span>
                      ) : null}
                      {renderSummary && hasAssets && !shownHere ? (
                        <span className="wp-season-pos-region-badge" title={visMeta.label}>
                          Not shown at {viewportWidth}px
                        </span>
                      ) : null}
                      {renderSummary && overflowHidden ? (
                        <span className="wp-season-pos-region-badge is-warning">
                          Hidden · duplicates overflow
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      className="wp-btn wp-btn-small"
                      title="Duplicate"
                      onClick={() => handleDuplicate(group.id)}
                    >
                      ⎘
                    </button>
                    <ConfirmButton
                      className="wp-btn wp-btn-small wp-btn-danger-outline"
                      title={`Delete "${group.name}"?`}
                      confirmLabel="Delete"
                      onConfirm={() => handleDelete(group.id)}
                    >
                      ✕
                    </ConfirmButton>
                    <button
                      type="button"
                      className="wp-btn wp-btn-small"
                      aria-label={isExpanded ? "Collapse" : "Expand"}
                      style={{ minWidth: 28, textAlign: "center" }}
                      onClick={() => toggleExpand(group.id)}
                    >
                      {isExpanded ? "▲" : "▼"}
                    </button>
                  </div>
                </div>

                {/* Card Body */}
                {isExpanded ? (
                  <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 18 }}>

                    {/* ── Row 1: Name + Position ── */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#50575e", textTransform: "uppercase", letterSpacing: "0.04em" }}>Group Name</span>
                        <input
                          className="wp-input"
                          value={group.name}
                          maxLength={60}
                          placeholder="e.g. Header Garland"
                          onChange={(e) => handleUpdate(group.id, { name: e.target.value })}
                        />
                      </label>

                      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#50575e", textTransform: "uppercase", letterSpacing: "0.04em" }}>Placement Area</span>
                        <select
                          className="wp-select"
                          value={group.position}
                          onChange={(e) =>
                            handleUpdate(group.id, { position: e.target.value as PlacementPosition })
                          }
                        >
                          {PLACEMENT_POSITIONS.map((pos) => (
                            <option key={pos.id} value={pos.id}>
                              {pos.icon} {pos.label} — {pos.description}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    {/* ── Custom Coordinates ── */}
                    {isCustom ? (
                      <div
                        style={{
                          padding: "12px 14px",
                          background: "#f0f6fc",
                          borderRadius: 6,
                          border: "1px dashed #93c5fd",
                        }}
                      >
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#1e40af", display: "block", marginBottom: 8 }}>
                          ✨ Custom Position (CSS values: 20%, 4rem, 50px…)
                        </span>
                        <p style={{ fontSize: 11, color: "#1e40af", margin: "0 0 10px" }}>
                          Custom coordinates stay exactly as entered and do not draw a motif edge.
                        </p>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                          {(["top", "bottom", "left", "right"] as const).map((side) => (
                            <label key={side} style={{ fontSize: 11, color: "#646970", display: "flex", flexDirection: "column", gap: 3 }}>
                              <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{side}</span>
                              <input
                                className="wp-input"
                                placeholder="e.g. 10%"
                                value={group.customCoordinates?.[side] || ""}
                                onChange={(e) =>
                                  handleUpdate(group.id, {
                                    customCoordinates: {
                                      ...group.customCoordinates,
                                      [side]: e.target.value,
                                    },
                                  })
                                }
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {renderNote ? (
                      <p className={`wp-season-render-note is-${renderNote.tone}`}>
                        {renderNote.text}
                      </p>
                    ) : null}

                    {/* ── Ornaments ── */}
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#50575e", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          Ornaments
                          {group.assets.length > 0 && (
                            <span style={{ fontSize: 10, fontWeight: 400, marginLeft: 6, color: "#8c8f94", textTransform: "none" }}>
                              {group.assets.length} selected · {totalItems} configured
                            </span>
                          )}
                        </span>
                        <button
                          type="button"
                          className="wp-btn wp-btn-small wp-btn-primary"
                          onClick={() => setPickingGroupId(group.id)}
                        >
                          + Add Ornament
                        </button>
                      </div>

                      {group.assets.length > 0 ? (
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 6,
                            padding: 10,
                            background: "#fafafa",
                            border: "1px solid #e2e8f0",
                            borderRadius: 6,
                            minHeight: 48,
                            alignItems: "center",
                          }}
                        >
                          {group.assets.map((assetUrl, assetIdx) => {
                            const cleanUrl = cleanOrnamentUrl(assetUrl);
                            const match = availableCatalog.find(
                              (o) => cleanOrnamentUrl(o.imageUrl) === cleanUrl,
                            );
                            const name = match?.name || "Ornament";

                            return (
                              <div
                                key={`${assetUrl}-${assetIdx}`}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 5,
                                  background: "#fff",
                                  border: "1px solid #c3c4c7",
                                  borderRadius: 20,
                                  padding: "3px 8px 3px 4px",
                                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                                }}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={cleanUrl}
                                  alt=""
                                  style={{ width: 20, height: 20, objectFit: "contain", borderRadius: 10 }}
                                />
                                <span style={{ fontSize: 11, fontWeight: 500, color: "#1d2327", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {name}
                                </span>
                                <button
                                  type="button"
                                  title="Add another copy"
                                  style={{ border: "none", background: "none", color: "#2271b1", cursor: "pointer", fontSize: 11, padding: "0 1px", fontWeight: 700, lineHeight: 1 }}
                                  onClick={() => handleAddAssetToGroup(group.id, assetUrl)}
                                >
                                  +1
                                </button>
                                <button
                                  type="button"
                                  title="Remove"
                                  style={{ border: "none", background: "none", color: "#b32d2e", cursor: "pointer", fontSize: 11, padding: "0 1px", lineHeight: 1 }}
                                  onClick={() => handleRemoveAssetFromGroup(group.id, assetIdx)}
                                >
                                  ✕
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <button
                          type="button"
                          style={{
                            width: "100%",
                            padding: "16px",
                            textAlign: "center",
                            background: "#fafafa",
                            border: "1.5px dashed #c3c4c7",
                            borderRadius: 6,
                            cursor: "pointer",
                            color: "#646970",
                            fontSize: 12,
                          }}
                          onClick={() => setPickingGroupId(group.id)}
                        >
                          Click to pick ornaments from the catalog →
                        </button>
                      )}
                    </div>

                    {/* ── Divider ── */}
                    <div style={{ borderTop: "1px solid #f0f0f1" }} />

                    {/* ── Alignment + Orientation ── */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#50575e", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 6 }}>
                          Alignment
                        </span>
                        {isCorners ? (
                          <p className="wp-season-control-note">
                            Each corner grows from its own edge, so alignment is not used.
                          </p>
                        ) : (
                          <div className="wp-seg" role="group" aria-label="Alignment">
                            {PLACEMENT_ALIGNMENTS.map((align) => (
                              <label
                                key={align.id}
                                className={group.alignment === align.id ? "is-selected" : undefined}
                              >
                                <input
                                  type="radio"
                                  name={`group-align-${group.id}`}
                                  checked={group.alignment === align.id}
                                  onChange={() =>
                                    handleUpdate(group.id, { alignment: align.id as PlacementAlignment })
                                  }
                                />
                                {align.label}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#50575e", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 6 }}>
                          Orientation
                        </span>
                        {isEdge ? (
                          <p className="wp-season-control-note">
                            Edge rails always run vertically down the page.
                          </p>
                        ) : (
                          <div className="wp-seg" role="group" aria-label="Orientation">
                            {PLACEMENT_ORIENTATIONS.map((orient) => (
                              <label
                                key={orient.id}
                                className={group.orientation === orient.id ? "is-selected" : undefined}
                              >
                                <input
                                  type="radio"
                                  name={`group-orient-${group.id}`}
                                  checked={group.orientation === orient.id}
                                  onChange={() =>
                                    handleUpdate(group.id, { orientation: orient.id as PlacementOrientation })
                                  }
                                />
                                {orient.label}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── Repeat + Spacing ── */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#50575e", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 6 }}>
                          Repeat Sequence
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <button
                            type="button"
                            className="wp-btn wp-btn-small"
                            disabled={group.repeat <= 1}
                            onClick={() => handleUpdate(group.id, { repeat: Math.max(1, group.repeat - 1) })}
                          >
                            −
                          </button>
                          <input
                            type="range"
                            min={1}
                            max={12}
                            step={1}
                            value={group.repeat}
                            style={{ flex: 1 }}
                            onChange={(e) => handleUpdate(group.id, { repeat: Number(e.target.value) })}
                          />
                          <button
                            type="button"
                            className="wp-btn wp-btn-small"
                            disabled={group.repeat >= 12}
                            onClick={() => handleUpdate(group.id, { repeat: Math.min(12, group.repeat + 1) })}
                          >
                            +
                          </button>
                          <span style={{ fontSize: 12, fontWeight: 700, minWidth: 28, textAlign: "right", color: "#2271b1" }}>
                            {group.repeat}×
                          </span>
                        </div>
                        <p style={{ fontSize: 11, color: "#8c8f94", margin: "4px 0 0" }}>
                          {totalItems} ornament{totalItems !== 1 ? "s" : ""} configured in total
                        </p>
                      </div>

                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#50575e", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 6 }}>
                          Spacing — {group.spacing}rem
                        </span>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
                          {SPACING_PRESETS.map((preset) => (
                            <button
                              key={preset.value}
                              type="button"
                              className={`wp-btn wp-btn-small${group.spacing === preset.value ? " wp-btn-primary" : ""}`}
                              onClick={() => handleUpdate(group.id, { spacing: preset.value })}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                        <input
                          type="range"
                          min={0.5}
                          max={8}
                          step={0.25}
                          value={group.spacing}
                          style={{ width: "100%" }}
                          onChange={(e) => handleUpdate(group.id, { spacing: Number(e.target.value) })}
                        />
                      </div>
                    </div>

                    {/* ── Size + Animation ── */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#50575e", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 6 }}>
                          Size
                        </span>
                        <div className="wp-seg" role="group" aria-label="Size">
                          {PLACEMENT_SIZES.map((s) => (
                            <label key={s.id} className={group.size === s.id ? "is-selected" : undefined}>
                              <input
                                type="radio"
                                name={`group-size-${group.id}`}
                                checked={group.size === s.id}
                                onChange={() => handleUpdate(group.id, { size: s.id as PlacementSize })}
                              />
                              {s.label}
                            </label>
                          ))}
                        </div>
                        {group.size === "custom" ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                            <span style={{ fontSize: 11, color: "#50575e", flexShrink: 0 }}>Size:</span>
                            <input
                              type="range"
                              min={1}
                              max={8}
                              step={0.25}
                              value={group.customSize || 3}
                              style={{ flex: 1 }}
                              onChange={(e) => handleUpdate(group.id, { customSize: Number(e.target.value) })}
                            />
                            <span style={{ fontSize: 11, fontWeight: 700, minWidth: 36, color: "#2271b1" }}>
                              {group.customSize || 3}rem
                            </span>
                          </div>
                        ) : null}
                      </div>

                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#50575e", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 6 }}>
                          Animation
                        </span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {PLACEMENT_ANIMATIONS.map((anim) => (
                            <button
                              key={anim.id}
                              type="button"
                              className={`wp-btn wp-btn-small${group.animation === anim.id ? " wp-btn-primary" : ""}`}
                              onClick={() => handleUpdate(group.id, { animation: anim.id as PlacementAnimation })}
                            >
                              {anim.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* ── Intensity + Visibility ── */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#50575e", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 6 }}>
                          Animation Intensity
                        </span>
                        <div className="wp-seg" role="group" aria-label="Intensity">
                          {PLACEMENT_INTENSITIES.map((inten) => (
                            <label
                              key={inten.id}
                              className={group.animationIntensity === inten.id ? "is-selected" : undefined}
                              title={inten.description}
                            >
                              <input
                                type="radio"
                                name={`group-intensity-${group.id}`}
                                checked={group.animationIntensity === inten.id}
                                onChange={() =>
                                  handleUpdate(group.id, {
                                    animationIntensity: inten.id as PlacementAnimationIntensity,
                                  })
                                }
                              />
                              {inten.label}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#50575e", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 6 }}>
                          Responsive Visibility
                        </span>
                        <div className="wp-seg" role="group" aria-label="Visibility">
                          {PLACEMENT_VISIBILITIES.map((vis) => (
                            <label
                              key={vis.id}
                              className={group.visibility === vis.id ? "is-selected" : undefined}
                            >
                              <input
                                type="radio"
                                name={`group-visibility-${group.id}`}
                                checked={group.visibility === vis.id}
                                onChange={() =>
                                  handleUpdate(group.id, { visibility: vis.id as PlacementVisibility })
                                }
                              />
                              {vis.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {/* Asset Picker Modal */}
      {pickingGroupId && activePickingGroup ? (
        <div
          className="wp-shelf-modal-backdrop wp-season-picker-backdrop"
          role="presentation"
          onClick={() => setPickingGroupId(null)}
        >
          <div
            className="wp-season-picker-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${modalId}-picker-title`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="wp-season-picker-modal-head">
              <div>
                <h3 id={`${modalId}-picker-title`} className="wp-palette-column-title">
                  Add Ornament to &ldquo;{activePickingGroup.name}&rdquo;
                </h3>
                <p className="wp-description">
                  Pick from your catalog. You can add the same ornament multiple times.
                </p>
              </div>
              <button
                type="button"
                className="wp-btn wp-btn-small"
                onClick={() => setPickingGroupId(null)}
              >
                Close
              </button>
            </div>

            <div className="wp-season-picker-modal-body">
              {availableCatalog.length ? (
                <ul className="wp-season-picker-grid">
                  {availableCatalog.map((orn) => {
                    const cleanUrl = cleanOrnamentUrl(orn.imageUrl);
                    const countInThisGroup = activePickingGroup.assets.filter(
                      (src) => cleanOrnamentUrl(src) === cleanUrl,
                    ).length;

                    return (
                      <li key={orn.id} className="wp-season-picker-card">
                        <div className="wp-season-ornament-thumb">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={cleanUrl} alt="" />
                          {countInThisGroup > 0 ? (
                            <span className="wp-season-pos-badge" title="Added to this group">
                              ✓ {countInThisGroup}×
                            </span>
                          ) : null}
                        </div>
                        <span className="wp-season-picker-name">{orn.name || "Ornament"}</span>
                        <button
                          type="button"
                          className="wp-btn wp-btn-small wp-btn-primary"
                          onClick={() => {
                            handleAddAssetToGroup(activePickingGroup.id, cleanUrl);
                          }}
                        >
                          + Add
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="wp-season-detail-empty">
                  <p className="wp-palette-column-title">No ornaments in the catalog yet</p>
                  <p className="wp-description">
                    Upload ornament images to the shared catalog first.
                  </p>
                  {onOpenCatalog ? (
                    <button
                      type="button"
                      className="wp-btn wp-btn-small wp-btn-primary"
                      style={{ marginTop: 8 }}
                      onClick={() => {
                        setPickingGroupId(null);
                        onOpenCatalog();
                      }}
                    >
                      Open Ornament Catalog
                    </button>
                  ) : null}
                </div>
              )}
            </div>

            <div className="wp-season-picker-modal-foot">
              <button
                type="button"
                className="wp-btn wp-btn-small wp-btn-primary"
                onClick={() => setPickingGroupId(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Custom Cursor Section */}
      <div className="wp-season-cursor-box" style={{ marginTop: 20 }}>
        <div className="wp-season-cursor-head">
          <h4 className="wp-palette-column-title">Custom Cursor</h4>
          <p className="wp-description">
            Select an ornament to trail as the cursor when this festival is live.
          </p>
        </div>

        <div className="wp-season-cursor-select">
          <label className={`wp-check wp-cursor-option${!cursorOrnament ? " is-selected" : ""}`}>
            <input
              type="radio"
              name="season-placement-cursor"
              checked={!cursorOrnament}
              onChange={() => onCursorOrnament(null)}
            />
            <span>Default brand arrow</span>
          </label>
          {allUsedAssets.map((url) => {
            const match = availableCatalog.find((o) => cleanOrnamentUrl(o.imageUrl) === url);
            const name = match?.name || "Ornament";
            const isChecked = cleanOrnamentUrl(cursorOrnament ?? "") === url;

            return (
              <label
                key={url}
                className={`wp-check wp-cursor-option${isChecked ? " is-selected" : ""}`}
              >
                <input
                  type="radio"
                  name="season-placement-cursor"
                  checked={isChecked}
                  onChange={() => onCursorOrnament(url)}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="wp-season-cursor-preview-img" />
                <span>{name}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
