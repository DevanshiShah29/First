import type { GoodreadsLibrary } from "@/lib/goodreads";
import { SHELF_TBR_MAX_TOTAL } from "./spineStyle";

/**
 * Builds one combined visual bookshelf (multiple rows), dropping TBR when too large.
 * List sections below the shelf stay separate in ReadingLibrary.
 * @example shelfSections(library) // [{ id, title: "", books }]
 */
export function shelfSections(library: GoodreadsLibrary) {
  const books = [...library.currentlyReading, ...library.read];
  const shelfTotal =
    library.currentlyReading.length + library.read.length + library.toRead.length;
  if (library.toRead.length && shelfTotal <= SHELF_TBR_MAX_TOTAL) {
    books.push(...library.toRead);
  }

  if (!books.length) return [];

  return [
    {
      id: "shelf-all",
      title: "",
      books,
    },
  ];
}
