import type { Book as BookRow } from "@prisma/client";
import {
  compareReadAtDesc,
  emptyLibrary,
  goodreadsUserId,
  parseGoodreadsCsv,
  type GoodreadsBook,
  type GoodreadsCsvBook,
  type GoodreadsLibrary,
  type GoodreadsShelf,
} from "@/lib/goodreads";
import { prisma } from "@/server/prisma";

export type StoredBook = GoodreadsBook & {
  shelf: GoodreadsShelf;
};

export type BookImportSummary = {
  imported: number;
  shelves: Record<GoodreadsShelf, number>;
};

export type BookUpdate = {
  title?: string;
  author?: string;
  cover?: string;
  url?: string;
  reviewUrl?: string;
  rating?: number;
  year?: string;
  pages?: string;
  readAt?: string;
  shelves?: string;
  review?: string;
  shelf?: GoodreadsShelf;
};

/**
 * Converts a stored row to the public book shape.
 * @example toBook(row) // GoodreadsBook
 */
function toBook(row: BookRow): StoredBook {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    cover: row.cover,
    url: row.url,
    reviewUrl: row.reviewUrl,
    rating: row.rating,
    year: row.year,
    pages: row.pages,
    readAt: row.readAt,
    shelves: row.shelves,
    review: row.review,
    shelf: row.shelf as GoodreadsShelf,
  };
}

/**
 * Loads imported books in CSV order.
 * @example await listStoredBooks() // StoredBook[]
 */
export async function listStoredBooks(): Promise<StoredBook[]> {
  const rows = await prisma.book.findMany({ orderBy: { sortOrder: "asc" } });
  return rows.map(toBook);
}

/**
 * Builds the public reading library from imported books.
 * @example await loadLibrary(goodreadsUrl, "Devanshi") // GoodreadsLibrary
 */
export async function loadLibrary(
  profileUrl: string,
  name: string,
): Promise<GoodreadsLibrary> {
  const books = await listStoredBooks();
  const userId = goodreadsUserId(profileUrl);
  const canonicalUrl = userId
    ? `https://www.goodreads.com/user/show/${userId}`
    : profileUrl.trim();

  if (!books.length && !canonicalUrl) return emptyLibrary(profileUrl);

  /**
   * Keeps only books from one shelf.
   * @example shelfBooks("read") // GoodreadsBook[]
   */
  const shelfBooks = (shelf: GoodreadsShelf) =>
    books.filter((book) => book.shelf === shelf);

  return {
    configured: true,
    name,
    profileUrl: canonicalUrl,
    currentlyReading: shelfBooks("currently-reading"),
    read: shelfBooks("read").sort(compareReadAtDesc),
    toRead: shelfBooks("to-read"),
  };
}

/**
 * Replaces the library with a Goodreads My Books CSV export.
 * @example await importBooks(csv) // { imported: 114, shelves: {…} }
 */
export async function importBooks(csv: string): Promise<BookImportSummary> {
  const books = parseGoodreadsCsv(csv);
  if (!books.length) {
    throw new Error(
      "No books found in that CSV. Export My Books from Goodreads and try again.",
    );
  }

  const shelves: Record<GoodreadsShelf, number> = {
    "currently-reading": 0,
    read: 0,
    "to-read": 0,
  };

  const data = books.map((book: GoodreadsCsvBook, index: number) => {
    shelves[book.shelf] += 1;
    return {
      id: book.id,
      sortOrder: index,
      title: book.title,
      author: book.author,
      cover: book.cover,
      url: book.url,
      reviewUrl: book.reviewUrl,
      rating: book.rating,
      year: book.year,
      pages: book.pages,
      readAt: book.readAt,
      shelves: book.shelves,
      review: book.review,
      shelf: book.shelf,
    };
  });

  await prisma.$transaction(
    async (tx) => {
      await tx.book.deleteMany();
      // Keep each INSERT under Postgres' parameter limit for very large shelves.
      for (let start = 0; start < data.length; start += 500) {
        await tx.book.createMany({ data: data.slice(start, start + 500) });
      }
    },
    { timeout: 30_000 },
  );

  return { imported: books.length, shelves };
}

/**
 * Updates one book's editable fields.
 * @example await updateBook("123", { title: "New title" }) // StoredBook | null
 */
export async function updateBook(
  id: string,
  update: BookUpdate,
): Promise<StoredBook | null> {
  const result = await prisma.book.updateMany({ where: { id }, data: update });
  if (!result.count) return null;
  const row = await prisma.book.findUnique({ where: { id } });
  return row ? toBook(row) : null;
}

/**
 * Deletes one book, returning false when it was already gone.
 * @example await deleteBook("123") // true
 */
export async function deleteBook(id: string): Promise<boolean> {
  const result = await prisma.book.deleteMany({ where: { id } });
  return result.count > 0;
}

/**
 * Deletes every imported book.
 * @example await clearBooks() // void
 */
export async function clearBooks(): Promise<void> {
  await prisma.book.deleteMany();
}
