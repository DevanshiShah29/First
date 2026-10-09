import type { BookOrientation, ShelfDecorPlacement } from "@/content/types";

export type PaletteKind = BookOrientation | "decor" | "spacer";

export type DragPayload =
  | { source: "palette"; kind: PaletteKind }
  | { source: "palette-decor"; artifactId: string }
  | { source: "item"; itemId: string }
  | {
      source: "decor-move";
      decorId: string;
      offsetXRem: number;
      offsetYPct: number;
    }
  | {
      source: "decor-resize";
      decorId: string;
      corner: "nw" | "ne" | "sw" | "se";
      startX: number;
      startY: number;
      startW: number;
      startH: number;
      startXRem: number;
      startYP: number;
    };

export type PendingStack = {
  orientation: BookOrientation;
  plankIndex: number;
  itemIndex: number;
  appendToId?: string;
};

export type PendingDecor = { xRem: number; yPercent: number; xPercent: number };

export type Selection =
  | { kind: "stack" | "spacer"; id: string }
  | { kind: "decor"; id: string }
  | null;

export const ORIENTATION_META: {
  kind: BookOrientation;
  label: string;
  icon: string;
}[] = [
  { kind: "vertical", label: "Vertical", icon: "📚" },
  { kind: "horizontal", label: "Horizontal", icon: "📕" },
  { kind: "tilt-left", label: "Tilt Left", icon: "↙" },
  { kind: "tilt-right", label: "Tilt Right", icon: "↗" },
];

/**
 * Orientation CSS class for editor spines.
 * @example orientClass("tilt-left") // "is-tilt-left"
 */
export function orientClass(orientation: BookOrientation) {
  if (orientation === "horizontal") return "is-horizontal";
  if (orientation === "tilt-left") return "is-tilt-left";
  if (orientation === "tilt-right") return "is-tilt-right";
  return "";
}

/**
 * Clamps n into [min, max].
 * @example clamp(12, 0, 10) // 10
 */
export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/**
 * Maps client coords to rem X + % Y inside the shelf room.
 * X uses rem so decor tracks rem-sized stacks when CMS width ≠ live width.
 * @example clientToRoomPos(ev.clientX, ev.clientY, rect, 16)
 */
export function clientToRoomPos(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  remSize: number,
) {
  const rem = remSize > 0 ? remSize : 16;
  const xRem = rect.width > 0 ? (clientX - rect.left) / rem : 0;
  const xPercent =
    rect.width > 0 ? ((clientX - rect.left) / rect.width) * 100 : 0;
  const yPercent =
    rect.height > 0 ? ((clientY - rect.top) / rect.height) * 100 : 0;
  return {
    xRem: Math.round(Math.max(0, xRem) * 100) / 100,
    xPercent: clamp(xPercent, 0, 100),
    yPercent: clamp(yPercent, 0, 100),
  };
}

/**
 * Effective horizontal rem for a placement (legacy percent → rem via room width).
 * @example placementXRem(item, 40)
 */
export function placementXRem(
  placement: Pick<ShelfDecorPlacement, "xRem" | "xPercent">,
  roomWidthRem: number,
) {
  if (typeof placement.xRem === "number" && Number.isFinite(placement.xRem)) {
    return placement.xRem;
  }
  if (roomWidthRem > 0) {
    return Math.round((placement.xPercent / 100) * roomWidthRem * 100) / 100;
  }
  return 0;
}
