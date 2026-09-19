import type { GoodreadsBook } from "@/lib/goodreads";

/** Cloth spine palette. */
const SPINE_COLORS = [
  "#2f4a6e",
  "#6b2d3c",
  "#3d5c45",
  "#8b4513",
  "#1f2433",
  "#5c3d2e",
  "#4a3f6b",
  "#8b3a3a",
  "#2f4f4f",
  "#704214",
  "#3b4d61",
  "#7a4b2e",
  "#4f3a2e",
  "#5a2d4a",
  "#365c4a",
  "#6e4a2f",
] as const;

const FOIL_COLORS = ["#e8d5a3", "#f3e6c4", "#d7c08a", "#f7f1df"] as const;

export type SpineVariant = "cloth" | "leather" | "banded";

/**
 * Stable 32-bit hash for deterministic spine styling.
 * @example hashKey("abc") // number
 */
function hashKey(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Shortens a title for vertical spine lettering.
 * @example spineLabel("Dune: Messiah") // "Dune"
 */
export function spineLabel(title: string) {
  const trimmed = title.split(/[:(/–—]/)[0]?.trim() || title;
  return trimmed.length > 26 ? `${trimmed.slice(0, 25).trimEnd()}…` : trimmed;
}

export type SpineStyle = {
  color: string;
  widthRem: number;
  heightRem: number;
  textColor: string;
  variant: SpineVariant;
  /** Horizontal crop focus for cover-on-spine (percent). */
  artPositionPercent: number;
};

/**
 * Flush Bookology packing — must match CSS `.bookshelf-books` / `.bookshelf-stack` gap.
 */
export const SHELF_GAP_REM = 0.06;

/** Spine width from page count (thin pamphlet → thick tome). */
export const SPINE_WIDTH_MIN_REM = 1.35;
export const SPINE_WIDTH_MAX_REM = 2.55;
/** Page counts that map to min/max spine width. */
export const SPINE_PAGES_MIN = 100;
export const SPINE_PAGES_MAX = 800;

/** Spine height band — Bookology-like variety (~2rem spread). */
export const SPINE_HEIGHT_BASE_REM = 8.9;
export const SPINE_HEIGHT_STEP_REM = 0.5;
export const SPINE_HEIGHT_STEPS = 5;
/** Tallest spine in the band (base + (steps - 1) * step). */
export const SPINE_HEIGHT_MAX_REM =
  SPINE_HEIGHT_BASE_REM + (SPINE_HEIGHT_STEPS - 1) * SPINE_HEIGHT_STEP_REM;
/**
 * Shelf row min-height (CSS `.bookshelf-books` / CMS drop zone).
 * Must stay above SPINE_HEIGHT_MAX_REM so there is clear air above the books.
 */
export const SHELF_ROW_MIN_HEIGHT_REM = 11.6;

/**
 * Live /reading plank content width (rem) for CMS overflow checks.
 * Derived from `.section-shell` (max 72rem, desktop pad 2.5rem) minus cabinet chrome
 * (sides 1rem, case-back pad 0.5rem, books pad 0.12rem) each side.
 */
export const SHELF_LIVE_BAY_WIDTH_DESKTOP_REM = 63.76;
/**
 * Live mobile plank content width (rem) at a ~390px phone (CMS mobile preview).
 * Derived from 390px (24.375rem) minus .section-shell pad (1.5rem each side) and cabinet chrome
 * (sides 0.78rem, case-back pad 0.35rem, books pad 0.12rem) each side.
 */
export const SHELF_LIVE_BAY_WIDTH_MOBILE_REM = 18.88;

/**
 * Plank capacity used by the CMS overflow badge (matches live /reading, not the CMS panel).
 * @example shelfLiveBayWidthRem("desktop") // 63.76
 */
export function shelfLiveBayWidthRem(viewport: "desktop" | "mobile") {
  return viewport === "mobile"
    ? SHELF_LIVE_BAY_WIDTH_MOBILE_REM
    : SHELF_LIVE_BAY_WIDTH_DESKTOP_REM;
}

/**
 * Resolves decor horizontal offset in rem (preferred) or falls back to percent of room width.
 * Stacks are rem-sized and left-aligned — percent-of-room X drifts when CMS ≠ live width.
 * @example decorLeftCss({ xRem: 12.5, xPercent: 40 }, 60) // { value: "12.5rem" }
 */
export function decorLeftCss(
  placement: { xRem?: number | null; xPercent: number },
  roomWidthRem: number,
) {
  if (typeof placement.xRem === "number" && Number.isFinite(placement.xRem)) {
    return `${placement.xRem}rem`;
  }
  if (roomWidthRem > 0 && Number.isFinite(placement.xPercent)) {
    return `${Math.round((placement.xPercent / 100) * roomWidthRem * 100) / 100}rem`;
  }
  return `${placement.xPercent}%`;
}

/** Drop TBR from the visual shelf once the library exceeds this many books. */
export const SHELF_TBR_MAX_TOTAL = 40;

/**
 * Maps page count → spine width. Missing pages get a mid default.
 * @example widthFromPages(400) // ~1.9
 */
export function widthFromPages(pages: number, hash = 0) {
  if (!Number.isFinite(pages) || pages <= 0) {
    return Math.round((1.7 + ((hash >>> 3) % 5) * 0.05) * 100) / 100;
  }
  const t = Math.min(1, Math.max(0, (pages - SPINE_PAGES_MIN) / (SPINE_PAGES_MAX - SPINE_PAGES_MIN)));
  return Math.round((SPINE_WIDTH_MIN_REM + t * (SPINE_WIDTH_MAX_REM - SPINE_WIDTH_MIN_REM)) * 100) / 100;
}

/**
 * Derives flat spine styling from book metadata.
 * @example spineStyle(book) // { color, widthRem, heightRem, … }
 */
export function spineStyle(book: GoodreadsBook): SpineStyle {
  const key = book.id || book.title;
  const hash = hashKey(key);
  const color = SPINE_COLORS[hash % SPINE_COLORS.length] ?? SPINE_COLORS[0];
  const pages = Number.parseInt(book.pages, 10);
  // Thickness tracks page count (more pages → wider spine).
  const widthRem = widthFromPages(pages, hash);
  // Subtle height variety; always below SHELF_ROW_MIN_HEIGHT_REM.
  const heightRem =
    SPINE_HEIGHT_BASE_REM + ((hash >>> 5) % SPINE_HEIGHT_STEPS) * SPINE_HEIGHT_STEP_REM;
  const variants: SpineVariant[] = ["cloth", "leather", "banded"];
  const variant = variants[hash % variants.length] ?? "cloth";
  const textColor = FOIL_COLORS[hash % FOIL_COLORS.length] ?? FOIL_COLORS[0];
  // Prefer the left third of the cover — usually more distinctive than center.
  const artPositionPercent = 8 + ((hash >>> 9) % 28);
  return { color, widthRem, heightRem, textColor, variant, artPositionPercent };
}
