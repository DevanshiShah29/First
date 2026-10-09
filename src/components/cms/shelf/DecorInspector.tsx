"use client";

import type { ShelfArtifactItem, ShelfDecorPlacement } from "@/content/types";
import { ConfirmButton } from "../components/ConfirmDialog";
import { clamp, placementXRem } from "./shelfPlacementShared";

/**
 * Inspector for free-placed Decor ornament.
 */
export function DecorInspector({
  decor,
  artifact,
  roomWidthRem,
  onPatch,
  onRemove,
  onClose,
}: {
  decor: ShelfDecorPlacement;
  artifact?: ShelfArtifactItem;
  roomWidthRem: number;
  onPatch: (patch: Record<string, unknown>) => void;
  onRemove: () => void;
  onClose?: () => void;
}) {
  return (
    <div className="wp-shelf-selection wp-shelf-inspector">
      <div className="wp-shelf-inspector-head">
        <strong title={artifact?.name || decor.artifactId}>
          Decor: {artifact?.name || "Ornament"}
        </strong>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="wp-shelf-inspector-meta">
            {placementXRem(decor, roomWidthRem).toFixed(1)}rem,{" "}
            {decor.yPercent.toFixed(0)}%
          </span>
          {onClose ? (
            <button
              type="button"
              className="wp-shelf-inspector-close"
              onClick={onClose}
              title="Deselect"
              aria-label="Deselect">
              ✕
            </button>
          ) : null}
        </div>
      </div>
      <div className="wp-shelf-inspector-field">
        <span>X</span>
        <input
          type="number"
          min={0}
          max={Math.max(roomWidthRem, 4)}
          step={0.1}
          value={Math.round(placementXRem(decor, roomWidthRem) * 100) / 100}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isFinite(n)) return;
            const nextXRem = Math.max(0, n);
            onPatch({
              xRem: Math.round(nextXRem * 100) / 100,
              xPercent: clamp((nextXRem / roomWidthRem) * 100, 0, 100),
            });
          }}
        />
        <span>rem</span>
      </div>
      <div className="wp-shelf-inspector-field">
        <span>Y</span>
        <input
          type="number"
          min={0}
          max={100}
          step={1}
          value={Math.round(decor.yPercent * 10) / 10}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isFinite(n)) return;
            onPatch({
              yPercent: clamp(Math.round(n * 10) / 10, 0, 100),
            });
          }}
        />
        <span>%</span>
      </div>
      <div className="wp-shelf-inspector-field">
        <span>Width</span>
        <input
          type="number"
          min={0.5}
          max={24}
          step={0.1}
          value={decor.widthRem ?? artifact?.widthRem ?? 1.85}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isFinite(n) || n <= 0) return;
            onPatch({ widthRem: Math.round(n * 100) / 100 });
          }}
        />
        <span>rem</span>
      </div>
      <div className="wp-shelf-inspector-field">
        <span>Height</span>
        <input
          type="number"
          min={0.5}
          max={24}
          step={0.1}
          value={decor.heightRem ?? artifact?.heightRem ?? 5.4}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isFinite(n) || n <= 0) return;
            onPatch({ heightRem: Math.round(n * 100) / 100 });
          }}
        />
        <span>rem</span>
      </div>
      <ConfirmButton
        className="wp-btn wp-btn-small"
        title="Remove this decor?"
        message="It stays in the catalog. Save to update the live site."
        confirmLabel="Remove decor"
        onConfirm={onRemove}>
        Remove decor
      </ConfirmButton>
    </div>
  );
}
