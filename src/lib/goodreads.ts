export type GoodreadsBook = {
  id: string;
  title: string;
  author: string;
  cover: string;
  url: string;
  reviewUrl: string;
  rating: number;
  year: string;
  pages: string;
  readAt: string;
  shelves: string;
  review: string;
};

export type GoodreadsShelf = "currently-reading" | "read" | "to-read";

export type GoodreadsCsvBook = GoodreadsBook & {
  shelf: GoodreadsShelf;
};

export type GoodreadsLibrary = {
  configured: boolean;
  name: string;
  profileUrl: string;
  currentlyReading: GoodreadsBook[];
  read: GoodreadsBook[];
  toRead: GoodreadsBook[];
};

/**
 * Extracts a Goodreads user id from a profile URL or digits.
 * @example goodreadsUserId("…/user/show/123") // "123"
 */
export function goodreadsUserId(raw: string) {
  const url = raw.trim();
  if (!url) return null;
  const match =
    url.match(/goodreads\.com\/(?:user\/show|review\/list(?:_rss)?)\/(\d+)/i) ??
    url.match(/^(\d{4,})$/);
  return match?.[1] ?? null;
}

/**
 * Empty unconfigured library shell.
 * @example emptyLibrary(profileUrl) // { configured: false, … }
 */
export function emptyLibrary(profileUrl = ""): GoodreadsLibrary {
  return {
    configured: false,
    name: "",
    profileUrl,
    currentlyReading: [],
    read: [],
    toRead: [],
  };
}

/**
 * Decodes common XML/HTML entities.
 * @example decode("&amp;") // "&"
 */
function decode(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCharCode(Number.parseInt(code, 10)),
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCharCode(Number.parseInt(code, 16)),
    )
    .trim();
}

/**
 * Strips HTML tags and normalizes whitespace.
 * @example stripHtml("<p>Hi</p>") // "Hi"
 */
function stripHtml(value: string) {
  return decode(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/**
 * Splits CSV text into rows, honoring quoted commas and newlines.
 * @example csvRows('"Title, with comma",Author') // [["Title, with comma", "Author"]]
 */
function csvRows(input: string): string[][] {
  const rows: string[][] = [];
  const text = input.replace(/^\uFEFF/, "");
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell);
      cell = "";
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

/**
 * Normalizes a CSV header for lookup.
 * @example headerKey("Book Id") // "bookid"
 */
function headerKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Normalizes an ISBN cell (strips Excel ="" wrappers).
 * @example cleanIsbn('="0439023483"') // "0439023483"
 */
function cleanIsbn(value: string) {
  return value.replace(/[^0-9Xx]/g, "").toUpperCase();
}

/**
 * Builds an Open Library cover URL from ISBN values.
 * @example coverForIsbn("9780439023481") // "https://covers.openlibrary.org/…"
 */
function coverForIsbn(...values: string[]) {
  const isbn = values.map(cleanIsbn).find((value) => value.length >= 10);
  return isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false` : "";
}

/**
 * Reads an exclusive shelf, falling back to the bookshelves column.
 * @example shelfOf("read", "fiction", "") // "read"
 */
function shelfOf(
  exclusive: string,
  bookshelves: string,
  readAt: string,
): GoodreadsShelf {
  const value = exclusive.trim().toLowerCase();
  if (value === "currently-reading" || value === "read" || value === "to-read") {
    return value;
  }
  const shelves = bookshelves.toLowerCase();
  if (shelves.includes("currently-reading")) return "currently-reading";
  if (readAt.trim()) return "read";
  return "to-read";
}

/**
 * Parses a Goodreads My Books CSV export into book records.
 * @example parseGoodreadsCsv(csv) // GoodreadsCsvBook[]
 */
export function parseGoodreadsCsv(csv: string): GoodreadsCsvBook[] {
  const rows = csvRows(csv);
  if (rows.length < 2) return [];

  const header = rows[0].map(headerKey);
  const column = (name: string) => header.indexOf(name);
  const columns = {
    id: column("bookid"),
    title: column("title"),
    author: column("author"),
    isbn: column("isbn"),
    isbn13: column("isbn13"),
    rating: column("myrating"),
    pages: column("numberofpages"),
    year: column("yearpublished"),
    originalYear: column("originalpublicationyear"),
    readAt: column("dateread"),
    shelves: column("bookshelves"),
    exclusive: column("exclusiveshelf"),
    review: column("myreview"),
  };
  if (columns.id < 0 || columns.title < 0) return [];

  /**
   * Reads one cell by column index, tolerating short rows.
   * @example read(row, columns.title) // "Title"
   */
  const read = (row: string[], index: number) =>
    index >= 0
      ? (row[index] ?? "")
          .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
          .trim()
      : "";

  const books: GoodreadsCsvBook[] = [];
  const seen = new Set<string>();

  for (const row of rows.slice(1)) {
    const id = read(row, columns.id);
    const title = decode(read(row, columns.title));
    if (!id || !title || seen.has(id)) continue;
    seen.add(id);

    const rating = Number.parseInt(read(row, columns.rating), 10);
    const bookshelves = read(row, columns.shelves);
    const readAt = read(row, columns.readAt);
    const year = read(row, columns.year) || read(row, columns.originalYear);
    const url = `https://www.goodreads.com/book/show/${id}`;

    books.push({
      id,
      title,
      author: decode(read(row, columns.author)),
      cover: coverForIsbn(read(row, columns.isbn13), read(row, columns.isbn)),
      url,
      reviewUrl: url,
      rating: Number.isFinite(rating) ? Math.max(0, Math.min(5, rating)) : 0,
      year,
      pages: read(row, columns.pages),
      readAt,
      shelves: bookshelves,
      review: stripHtml(read(row, columns.review)),
      shelf: shelfOf(read(row, columns.exclusive), bookshelves, readAt),
    });
  }

  return books;
}

/**
 * Parses a Goodreads `user_read_at` value to epoch ms.
 * @example readAtTimestamp("Fri Oct 02 00:00:00 -0700 2026") // 1790…
 */
export function readAtTimestamp(raw: string): number | null {
  const value = raw.trim();
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : time;
}

/**
 * Newest finished book first. Books with no reading date stay in their original order at the end.
 * @example books.sort(compareReadAtDesc)
 */
export function compareReadAtDesc(a: { readAt: string }, b: { readAt: string }) {
  const left = readAtTimestamp(a.readAt);
  const right = readAtTimestamp(b.readAt);
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return right - left;
}
