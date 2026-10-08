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
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
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
 * Reads a named RSS item field (CDATA or text).
 * @example field(itemXml, "title") // "Book Title"
 */
function field(block: string, name: string) {
  const re = new RegExp(
    `<${name}(?:\\s[^>]*)?>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<]*))</${name}>`,
    "i",
  );
  const match = block.match(re);
  return decode(match?.[1] ?? match?.[2] ?? "");
}

/**
 * Upgrades a Goodreads cover URL to a larger size.
 * @example nicerCover("…_SX98_.jpg") // "…_SY475_.jpg"
 */
function nicerCover(url: string) {
  if (!url) return "";
  return url.replace(/_S[YX]\d+(_\.)?/i, "_SY475_.");
}

/**
 * Parses Goodreads RSS XML into book records.
 * @example parseGoodreadsRss(xml) // GoodreadsBook[]
 */
export function parseGoodreadsRss(xml: string): GoodreadsBook[] {
  const blocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((m) => m[1] ?? "");
  const books: GoodreadsBook[] = [];
  const seen = new Set<string>();
  for (const block of blocks) {
    const id = field(block, "book_id");
    const title = field(block, "title");
    const key = id || title;
    if (!title || !key || seen.has(key)) continue;
    seen.add(key);
    const rating = Number(field(block, "user_rating"));
    const reviewLink = field(block, "link");
    books.push({
      id: key,
      title,
      author: field(block, "author_name"),
      cover: nicerCover(
        field(block, "book_large_image_url") ||
          field(block, "book_medium_image_url") ||
          field(block, "book_image_url"),
      ),
      url: id ? `https://www.goodreads.com/book/show/${id}` : reviewLink,
      reviewUrl: reviewLink,
      rating: Number.isFinite(rating) ? Math.max(0, Math.min(5, rating)) : 0,
      year: field(block, "book_published"),
      pages: field(block, "num_pages"),
      readAt: field(block, "user_read_at"),
      shelves: field(block, "user_shelves"),
      review: stripHtml(field(block, "user_review")),
    });
  }
  return books;
}

/**
 * Fetches one Goodreads RSS page for a shelf.
 * @example await fetchGoodreadsPage("123", "read", 1) // GoodreadsBook[]
 */
async function fetchGoodreadsPage(userId: string, shelf: string, page: number) {
  const url = `https://www.goodreads.com/review/list_rss/${userId}?shelf=${encodeURIComponent(shelf)}&per_page=100&page=${page}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml",
      "User-Agent": "Mozilla/5.0 (compatible; DevanshiPortfolio/1.0)",
    },
    next: { revalidate: 1800 },
  });
  if (!res.ok) throw new Error(`Goodreads ${shelf} ${res.status}`);
  return parseGoodreadsRss(await res.text());
}

/**
 * Loads all pages of a Goodreads shelf (up to 8).
 * @example await fetchGoodreadsShelf("123", "read") // GoodreadsBook[]
 */
export async function fetchGoodreadsShelf(userId: string, shelf: string) {
  const books: GoodreadsBook[] = [];
  const seen = new Set<string>();
  for (let page = 1; page <= 8; page += 1) {
    const batch = await fetchGoodreadsPage(userId, shelf, page);
    let added = 0;
    for (const book of batch) {
      if (seen.has(book.id)) continue;
      seen.add(book.id);
      books.push(book);
      added += 1;
    }
    if (batch.length < 100 || added === 0) break;
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

/**
 * Loads currently-reading, read, and to-read shelves.
 * The read shelf is ordered by reading date, newest first.
 * @example await loadGoodreadsLibrary(url, name) // GoodreadsLibrary
 */
export async function loadGoodreadsLibrary(profileUrl: string, name: string): Promise<GoodreadsLibrary> {
  const userId = goodreadsUserId(profileUrl);
  if (!userId) return emptyLibrary(profileUrl);
  const [currentlyReading, read, toRead] = await Promise.all([
    fetchGoodreadsShelf(userId, "currently-reading"),
    fetchGoodreadsShelf(userId, "read"),
    fetchGoodreadsShelf(userId, "to-read"),
  ]);
  return {
    configured: true,
    name,
    profileUrl: `https://www.goodreads.com/user/show/${userId}`,
    currentlyReading,
    read: read.sort(compareReadAtDesc),
    toRead,
  };
}
