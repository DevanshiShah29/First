"use client";

import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import type { ShelfArtifactItem, ShelfDecorPlacement } from "@/content/types";
import { decorLeftCss } from "@/components/reading/spineStyle";

/**
 * Free-placed decor component inside bookshelf-decor-layer.
 */
export function EditorDecorItem({
  placement,
  artifact,
  isSelected,
  roomWidthRem,
  onSelect,
  onMoveStart,
  onResizeStart,
}: {
  placement: ShelfDecorPlacement;
  artifact?: ShelfArtifactItem;
  isSelected: boolean;
  roomWidthRem: number;
  onSelect: () => void;
  onMoveStart: (e: ReactPointerEvent) => void;
  onResizeStart: (
    e: ReactPointerEvent,
    corner: "nw" | "ne" | "sw" | "se",
    widthRem: number,
    heightRem: number,
  ) => void;
}) {
  const widthRem = placement.widthRem ?? artifact?.widthRem ?? 1.85;
  const heightRem = placement.heightRem ?? artifact?.heightRem ?? 5.4;

  return (
    <div
      role="button"
      tabIndex={0}
      className={`bookshelf-artifact is-free wp-shelf-artifact${isSelected ? " is-selected" : ""}`}
      style={
        {
          "--artifact-w": `${widthRem}rem`,
          "--artifact-h": `${heightRem}rem`,
          "--artifact-x": decorLeftCss(placement, roomWidthRem),
          "--artifact-y": `${placement.yPercent}%`,
        } as CSSProperties
      }
      onPointerDown={onMoveStart}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-label={`${artifact?.name || "Decor"} (drag to move, handles to resize)`}>
      {artifact?.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={artifact.imageUrl}
          alt=""
          className="bookshelf-artifact-img"
          draggable={false}
        />
      ) : (
        <span className="wp-sub">Missing</span>
      )}
      {isSelected
        ? (["nw", "ne", "sw", "se"] as const).map((corner) => (
            <span
              key={corner}
              className={`wp-shelf-handle is-${corner}`}
              onPointerDown={(e) =>
                onResizeStart(e, corner, widthRem, heightRem)
              }
            />
          ))
        : null}
    </div>
  );
}
