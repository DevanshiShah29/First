import type { GoodreadsBook, GoodreadsLibrary } from "@/lib/goodreads";
import { MediaImage } from "./MediaImage";
import { NewTabHint } from "./a11y";
import { Fade } from "./Fade";

/**
 * Formats a Goodreads date string for display.
 * @example prettyDate("2024-01-15") // "Jan 15, 2024"
 */
function prettyDate(raw: string) {
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Renders a 1–5 star rating row.
 * @example <Stars value={4} />
 */
function Stars({ value }: { value: number }) {
  if (value <= 0) return null;
  return (
    <p className="reading-stars">
      <span className="sr-only">{`${value} out of 5 stars`}</span>
      <span aria-hidden="true">
        <span>{"★".repeat(value)}</span>
        <span className="is-off">{"★".repeat(5 - value)}</span>
      </span>
    </p>
  );
}

/**
 * Renders a book cover image or empty placeholder.
 * @example <Cover book={book} decorative />
 */
function Cover({
  book,
  className,
  decorative = false,
}: {
  book: GoodreadsBook;
  className?: string;
  decorative?: boolean;
}) {
  if (!book.cover) return <div className={`${className ?? ""} reading-cover is-empty`} aria-hidden />;
  return (
    <MediaImage
      src={book.cover}
      alt={decorative ? "" : `${book.title} cover`}
      className={`${className ?? ""} reading-cover`}
      width={200}
      height={300}
      sizes="(max-width: 640px) 40vw, 140px"
      loading="lazy"
    />
  );
}

/**
 * Renders author/year/pages/read-date meta line.
 * @example <Meta book={book} />
 */
function Meta({ book }: { book: GoodreadsBook }) {
  const bits = [book.author, book.year, book.pages ? `${book.pages} pages` : "", prettyDate(book.readAt)].filter(
    Boolean,
  );
  return <p className="reading-meta">{bits.join(" · ")}</p>;
}

/**
 * Renders a single shelf book card.
 * @example <BookCard book={book} featured />
 */
function BookCard({ book, featured = false }: { book: GoodreadsBook; featured?: boolean }) {
  return (
    <article className={`reading-card${featured ? " is-featured" : ""}`}>
      <Cover book={book} />
      <div>
        <h3>
          <a href={book.url} target="_blank" rel="noopener noreferrer">
            {book.title}
            <NewTabHint />
          </a>
        </h3>
        <Meta book={book} />
        <Stars value={book.rating} />
        {book.shelves ? <p className="reading-shelves">{book.shelves.replace(/,/g, " · ")}</p> : null}
        {book.review ? <blockquote className="reading-review">{book.review}</blockquote> : null}
      </div>
    </article>
  );
}

/**
 * Renders Goodreads shelves (reading / read / want-to-read).
 * @example <ReadingLibrary library={data} />
 */
export function ReadingLibrary({ library }: { library: GoodreadsLibrary }) {
  const total = library.currentlyReading.length + library.read.length + library.toRead.length;

  if (!library.configured) {
    return (
      <section id="library" className="section-shell py-20 sm:py-28">
        <p className="kicker">From the desk</p>
        <h1 className="mt-3 text-4xl font-semibold text-foreground sm:text-5xl">Reading</h1>
        <p className="mt-5 max-w-xl text-muted">The bookshelf is taking a break. Add a Goodreads profile in the CMS to fill this page.</p>
      </section>
    );
  }

  if (total === 0) {
    return (
      <section id="library" className="section-shell py-20 sm:py-28">
        <p className="kicker">From the desk</p>
        <h1 className="mt-3 text-4xl font-semibold text-foreground sm:text-5xl">Reading</h1>
        <p className="mt-5 max-w-xl text-muted">
          Couldn’t load books from Goodreads right now.{" "}
          <a className="text-accent-text" href={library.profileUrl} target="_blank" rel="noopener noreferrer">
            Open the profile
            <NewTabHint />
          </a>
        </p>
      </section>
    );
  }

  return (
    <div id="library" className="pb-20 sm:pb-28">
      <section className="section-shell pt-16 sm:pt-24">
        <Fade y={24}>
          <p className="kicker">From the desk</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight text-foreground sm:text-5xl">Reading</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
            Everything on my Goodreads shelves — what I’m in the middle of, what I’ve finished, and what I want next,
            including the notes I left on the books.
          </p>
          <p className="mt-4 text-sm text-muted-soft">{total} books pulled from Goodreads</p>
          <nav className="mt-8 flex flex-wrap gap-3 text-sm" aria-label="Shelves">
            {library.currentlyReading.length ? (
              <a href="#currently-reading" className="nav-link">
                Reading ({library.currentlyReading.length})
              </a>
            ) : null}
            <a href="#read" className="nav-link">
              Read ({library.read.length})
            </a>
            <a href="#want-to-read" className="nav-link">
              Want to read ({library.toRead.length})
            </a>
          </nav>
        </Fade>
      </section>

      {library.currentlyReading.length ? (
        <section id="currently-reading" className="section-shell pt-16">
          <Fade y={24}>
            <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Currently reading</h2>
          </Fade>
          <div className="mt-8 grid gap-6">
            {library.currentlyReading.map((book) => (
              <BookCard key={book.id} book={book} featured />
            ))}
          </div>
        </section>
      ) : null}

      <section id="read" className="section-shell pt-16">
        <Fade y={24}>
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Read</h2>
        </Fade>
        <div className="mt-8 grid gap-6">
          {library.read.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </section>

      <section id="want-to-read" className="section-shell pt-16">
        <Fade y={24}>
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Want to read</h2>
        </Fade>
        <div className="reading-want mt-8">
          {library.toRead.map((book) => (
            <a key={book.id} href={book.url} target="_blank" rel="noopener noreferrer" className="reading-want-card">
              <Cover book={book} decorative />
              <strong>{book.title}</strong>
              <span>{book.author}</span>
              <NewTabHint />
            </a>
          ))}
        </div>
      </section>

      {library.profileUrl ? (
        <Fade y={16}>
          <p className="section-shell mt-14 text-sm text-muted">
            Source:{" "}
            <a className="text-accent-text" href={library.profileUrl} target="_blank" rel="noopener noreferrer">
              Goodreads profile
              <NewTabHint />
            </a>
          </p>
        </Fade>
      ) : null}
    </div>
  );
}
