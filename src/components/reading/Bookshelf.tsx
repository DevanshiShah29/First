"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { isShelfArtifactPlaced, type ShelfArtifactItem } from "@/content/types";
import type { GoodreadsBook } from "@/lib/goodreads";
import { MediaImage } from "../MediaImage";
import { ShelfArtifact } from "./ShelfArtifacts";
import { SHELF_GAP_REM, spineLabel, spineStyle } from "./spineStyle";

type ShelfSection = {
  id: string;
  title: string;
  books: GoodreadsBook[];
};

type RowItem = { kind: "book"; book: GoodreadsBook };

/**
 * Packs books into spine rows (full width — decor is a free 2D overlay).
 * @example packRows(books, 40) // RowItem[][]
 */
function packRows(books: GoodreadsBook[], widthRem: number) {
  const rows: RowItem[][] = [];
  let row: RowItem[] = [];
  let used = 0;
  const budget = Math.max(widthRem, 4);

  const pushRow = () => {
    if (!row.length) return;
    rows.push(row);
    row = [];
    used = 0;
  };

  for (const book of books) {
    const width = spineStyle(book).widthRem;
    const next = used === 0 ? width : used + SHELF_GAP_REM + width;
    if (row.length > 0 && next > budget) {
      pushRow();
      row = [{ kind: "book", book }];
      used = width;
      continue;
    }
    row.push({ kind: "book", book });
    used = next;
  }

  pushRow();
  return rows;
}

/**
 * Scrolls the matching list card into view.
 * @example focusListBook(book)
 */
function focusListBook(book: GoodreadsBook) {
  const target = document.getElementById(`book-${book.id}`);
  if (!target) {
    window.open(book.url, "_blank", "noopener,noreferrer");
    return;
  }
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  target.classList.add("is-shelf-focus");
  window.setTimeout(() => target.classList.remove("is-shelf-focus"), 1600);
}

/**
 * Flat spine book on a shelf.
 * @example <ShelfBook book={book} />
 */
function ShelfBook({ book }: { book: GoodreadsBook }) {
  const style = spineStyle(book);
  return (
    <button
      type="button"
      className={`bookshelf-spine is-${style.variant}`}
      onClick={() => focusListBook(book)}
      aria-label={`${book.title}${book.author ? ` by ${book.author}` : ""}`}
      style={
        {
          "--spine-color": style.color,
          "--spine-width": `${style.widthRem}rem`,
          "--spine-height": `${style.heightRem}rem`,
          "--spine-text": style.textColor,
        } as CSSProperties
      }
    >
      {book.cover ? (
        <MediaImage
          src={book.cover}
          alt=""
          className="bookshelf-spine-art"
          width={80}
          height={240}
          sizes="40px"
          loading="lazy"
        />
      ) : null}
      <span className="bookshelf-spine-shade" aria-hidden />
      <span className="bookshelf-spine-title">{spineLabel(book.title)}</span>
    </button>
  );
}

/**
 * One labeled status shelf with wooden rows.
 * @example <ShelfBay section={section} />
 */
function ShelfBay({ section }: { section: ShelfSection }) {
  const bayRef = useRef<HTMLDivElement>(null);
  const [widthRem, setWidthRem] = useState(36);

  useEffect(() => {
    const node = bayRef.current;
    if (!node) return;

    const update = () => {
      const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const next = Math.max(12, (node.clientWidth - 24) / rem);
      setWidthRem(next);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const rows = useMemo(() => packRows(section.books, widthRem), [section.books, widthRem]);

  const showHead = Boolean(section.title.trim());

  return (
    <section
      className="bookshelf-section"
      aria-label={showHead ? undefined : "Bookshelf"}
      aria-labelledby={showHead ? `${section.id}-title` : undefined}
    >
      {showHead ? (
        <div className="bookshelf-section-head">
          <h2 id={`${section.id}-title`} className="bookshelf-section-title">
            {section.title}
          </h2>
          <p className="bookshelf-count">
            {section.books.length} {section.books.length === 1 ? "book" : "books"}
          </p>
        </div>
      ) : null}

{/* Bookology-style cabinet: crown, side walls, recessed back */}
      <div className="bookshelf-case">
        <div className="bookshelf-case-crown" aria-hidden />
        <div className="bookshelf-case-body">
          <div className="bookshelf-case-side is-left" aria-hidden />
          <div className="bookshelf-case-back">
            <div ref={bayRef} className="bookshelf-bay">
              {rows.map((row, index) => (
                <div key={`${section.id}-row-${index}`} className="bookshelf-row">
                  <div className="bookshelf-books">
                    {row.map((item) => (
                      <ShelfBook key={item.book.id} book={item.book} />
                    ))}
                  </div>
                  <div className="bookshelf-plank" aria-hidden />
                </div>
              ))}
            </div>
          </div>
          <div className="bookshelf-case-side is-right" aria-hidden />
        </div>
      </div>
    </section>
  );
}

/**
 * Wooden spine shelves with free-placed decor overlay.
 * @example <Bookshelf sections={sections} artifacts={items} />
 */
export function Bookshelf({
  sections,
  artifacts = [],
  interactiveBooks = true,
}: {
  sections: ShelfSection[];
  artifacts?: ShelfArtifactItem[];
  /** When false, book taps are disabled (CMS placement canvas). */
  interactiveBooks?: boolean;
}) {
  const filled = sections.filter((section) => section.books.length > 0);
  const placedArtifacts = useMemo(
    () => artifacts.filter(isShelfArtifactPlaced),
    [artifacts],
  );

  if (!filled.length) return null;

  return (
    <div className={`bookshelf${interactiveBooks ? "" : " is-placement-canvas"}`}>
      {interactiveBooks ? (
        <p className="bookshelf-hint">Tap a shelf book to jump to its notes below</p>
      ) : (
        <p className="bookshelf-hint">Drag ornaments onto the shelf · resize from corners</p>
      )}

      <div className="bookshelf-room">
        <div className="bookshelf-stage">
          {filled.map((section) => (
            <ShelfBay key={section.id} section={section} />
          ))}
        </div>
        {placedArtifacts.length > 0 ? (
          <div className="bookshelf-decor-layer" aria-hidden={interactiveBooks || undefined}>
            {placedArtifacts.map((item) => (
              <ShelfArtifact key={item.id} artifact={item} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
