"use client";

import { useEffect } from "react";
import type { ShelfArtifactItem } from "@/content/types";
import { useDialogFocus } from "@/hooks/use-dialog-focus";

/**
 * Modal to pick a catalog ornament after dropping Decor.
 * @example <DecorPickerModal … />
 */
export function DecorPickerModal({
  artifacts,
  onPick,
  onClose,
}: {
  artifacts: ShelfArtifactItem[];
  onPick: (artifactId: string) => void;
  onClose: () => void;
}) {
  const dialogRef = useDialogFocus<HTMLDivElement>(true);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="wp-shelf-modal-backdrop"
      role="presentation"
      onClick={onClose}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="wp-shelf-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shelf-decor-picker-title"
        onClick={(e) => e.stopPropagation()}>
        <div className="wp-shelf-modal-head">
          <h3 id="shelf-decor-picker-title">Pick decor</h3>
          <p className="wp-sub">Choose an enabled ornament for this spot.</p>
        </div>
        <div className="wp-shelf-modal-body">
          {artifacts.length === 0 ? (
            <p className="wp-sub">
              No enabled ornaments left for this viewport. Add one in the
              catalog below.
            </p>
          ) : (
            <ul className="wp-shelf-picker-list">
              {artifacts.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="wp-shelf-picker-item is-decor"
                    onClick={() => onPick(item.id)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.imageUrl} alt="" draggable={false} />
                    <span className="wp-shelf-picker-title">{item.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="wp-shelf-modal-footer">
          <button type="button" className="wp-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
