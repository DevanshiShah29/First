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
};

/**
 * Derives flat spine styling from book metadata.
 * @example spineStyle(book) // { color, widthRem, heightRem, … }
 */
export function spineStyle(book: GoodreadsBook): SpineStyle {
  const key = book.id || book.title;
  const hash = hashKey(key);
  const color = SPINE_COLORS[hash % SPINE_COLORS.length] ?? SPINE_COLORS[0];
  const pages = Number.parseInt(book.pages, 10);
  const pageBoost = Number.isFinite(pages) ? Math.min(1.1, Math.max(0, (pages - 180) / 520)) : (hash % 7) / 10;
  const widthRem = 1.5 + pageBoost * 0.9 + ((hash >> 3) % 4) * 0.08;
  const heightRem = 9 + ((hash >> 5) % 6) * 0.35;
  const variants: SpineVariant[] = ["cloth", "leather", "banded"];
  const variant = variants[hash % variants.length] ?? "cloth";
  const textColor = FOIL_COLORS[hash % FOIL_COLORS.length] ?? FOIL_COLORS[0];
  return { color, widthRem, heightRem, textColor, variant };
}

/** Near-flush Bookology spine packing (matches CSS `.bookshelf-books` gap). */
export const SHELF_GAP_REM = 0.06;

/** Drop TBR from the visual shelf once the library exceeds this many books. */
export const SHELF_TBR_MAX_TOTAL = 40;
