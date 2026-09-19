import type { BookOrientation, ShelfBookStackItem, ShelfPlankItem } from "@/content/types";
import type { GoodreadsBook } from "@/lib/goodreads";
import { SHELF_GAP_REM, spineStyle } from "@/components/reading/spineStyle";

/**
 * Display box for a spine given orientation (horizontal swaps axes).
 * @example spineBox(book, "horizontal")
 */
export function spineBox(book: GoodreadsBook, orientation: BookOrientation) {
  const style = spineStyle(book);
  if (orientation === "horizontal") {
    return { widthRem: style.heightRem, heightRem: style.widthRem, style };
  }
  return { widthRem: style.widthRem, heightRem: style.heightRem, style };
}

/**
 * Horizontal footprint of a book stack in rem.
 * @example stackWidthRem(item, bookById) // 6.2
 */
export function stackWidthRem(
  item: Pick<ShelfBookStackItem, "bookIds" | "orientation">,
  bookById: Map<string, GoodreadsBook>,
) {
  const bookIds = Array.isArray(item.bookIds) ? item.bookIds : [];
  const books = bookIds
    .map((id) => bookById.get(id))
    .filter((book): book is GoodreadsBook => Boolean(book));
  if (!books.length) return 1.5;

  if (item.orientation === "horizontal") {
    return Math.max(...books.map((book) => spineBox(book, "horizontal").widthRem));
  }

  let used = 0;
  books.forEach((book, index) => {
    const width = spineBox(book, item.orientation).widthRem;
    used += index === 0 ? width : SHELF_GAP_REM + width;
  });
  if (item.orientation === "tilt-left" || item.orientation === "tilt-right") {
    used += 0.3;
  }
  return used;
}

/**
 * Horizontal footprint of any plank item in rem.
 * Guards against legacy/malformed rows (missing bookIds, stray decor, etc.).
 * @example itemWidthRem(item, bookById) // 2.4
 */
export function itemWidthRem(
  item: ShelfPlankItem | null | undefined,
  bookById: Map<string, GoodreadsBook>,
) {
  if (!item) return 0;
  if (item.type === "spacer") {
    return typeof item.widthRem === "number" && item.widthRem > 0 ? item.widthRem : 0;
  }
  if (item.type === "book-stack") {
    return stackWidthRem(item, bookById);
  }
  // Legacy `stack` / unexpected shapes: use bookIds when present.
  const legacy = item as { bookIds?: string[]; orientation?: BookOrientation };
  if (Array.isArray(legacy.bookIds)) {
    return stackWidthRem(
      {
        bookIds: legacy.bookIds,
        orientation: legacy.orientation ?? "vertical",
      },
      bookById,
    );
  }
  return 0;
}

/**
 * Sum of item footprints + gaps for a plank.
 * @example plankContentWidthRem(items, bookById) // 28.4
 */
export function plankContentWidthRem(
  items: ShelfPlankItem[] | null | undefined,
  bookById: Map<string, GoodreadsBook>,
) {
  const list = Array.isArray(items) ? items : [];
  let used = 0;
  list.forEach((item, index) => {
    const width = itemWidthRem(item, bookById);
    used += index === 0 ? width : SHELF_GAP_REM + width;
  });
  return used;
}
