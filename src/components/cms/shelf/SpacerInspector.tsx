"use client";

import {
  SHELF_SPACER_MAX_REM,
  SHELF_SPACER_MIN_REM,
  type ShelfPlankItem,
} from "@/content/types";
import { ConfirmButton } from "../components/ConfirmDialog";
import { clamp } from "./shelfPlacementShared";

/**
 * Inspector for White Space gap.
 */
export function SpacerInspector({
  item,
  onPatch,
  onRemove,
  onClose,
}: {
  item: Extract<ShelfPlankItem, { type: "spacer" }>;
  onPatch: (patch: Record<string, unknown>) => void;
  onRemove: () => void;
  onClose?: () => void;
}) {
  return (
    <div className="wp-shelf-selection wp-shelf-inspector">
      <div className="wp-shelf-inspector-head">
        <strong>White Space</strong>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="wp-shelf-inspector-meta">
            {item.widthRem.toFixed(1)} rem
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
        <span>Width</span>
        <input
          type="range"
          min={SHELF_SPACER_MIN_REM}
          max={SHELF_SPACER_MAX_REM}
          step={0.1}
          value={item.widthRem}
          onChange={(e) => {
            const n = Number(e.target.value);
            const clamped = clamp(
              n,
              SHELF_SPACER_MIN_REM,
              SHELF_SPACER_MAX_REM,
            );
            onPatch({ widthRem: Math.round(clamped * 100) / 100 });
          }}
        />
        <input
          type="number"
          min={SHELF_SPACER_MIN_REM}
          max={SHELF_SPACER_MAX_REM}
          step={0.1}
          value={item.widthRem}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isFinite(n)) return;
            const clamped = clamp(
              n,
              SHELF_SPACER_MIN_REM,
              SHELF_SPACER_MAX_REM,
            );
            onPatch({ widthRem: Math.round(clamped * 100) / 100 });
          }}
        />
        <span>rem</span>
      </div>
      <ConfirmButton
        className="wp-btn wp-btn-small"
        title="Remove this white space?"
        message="This takes the gap off the plank. Save to update the live site."
        confirmLabel="Remove"
        onConfirm={onRemove}>
        Remove White Space
      </ConfirmButton>
    </div>
  );
}
