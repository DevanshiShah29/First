"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  EMPTY_SHELF_LAYOUT,
  shelfViewportFor,
  shelfViewportHasItems,
  SHELF_MOBILE_MAX_REM,
  type BookOrientation,
  type ShelfArtifactItem,
  type ShelfDecorPlacement,
  type ShelfLayout,
  type ShelfPlankItem,
  type ShelfViewport,
} from "@/content/types";
import type { GoodreadsBook } from "@/lib/goodreads";
import { ShelfArtifact } from "./ShelfArtifacts";
import { SpineFace, spineArtClass } from "./SpineFace";
import {
  decorLeftCss,
  SHELF_GAP_REM,
  shelfLiveBayWidthRem,
  spineStyle,
} from "./spineStyle";

type ShelfSection = {
  id: string;
  title: string;
  books: GoodreadsBook[];
};

type RowItem = { kind: "book"; book: GoodreadsBook };

/**
 * Packs books into spine rows (auto-pack fallback when no CMS layout items).
 * @example packRows(books, 40)
 */
function packRows(books: GoodreadsBook[], widthRem: number) {
  const rows: RowItem[][] = [];
  let row: RowItem[] = [];
  let used = 0;
  const budget = Math.max(widthRem, 4);
  const gap = SHELF_GAP_REM;

  const pushRow = () => {
    if (!row.length) return;
    rows.push(row);
    row = [];
    used = 0;
  };

  for (const book of books) {
    const width = spineStyle(book).widthRem;
    const next = used === 0 ? width : used + gap + width;
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
 * Display box for a spine given orientation.
 * @example spineBox(book, "horizontal")
 */
function spineBox(book: GoodreadsBook, orientation: BookOrientation) {
  const style = spineStyle(book);
  if (orientation === "horizontal") {
    return { widthRem: style.heightRem, heightRem: style.widthRem, style };
  }
  return { widthRem: style.widthRem, heightRem: style.heightRem, style };
}

/**
 * Orientation → CSS modifier class.
 * @example orientationClass("tilt-left")
 */
function orientationClass(orientation: BookOrientation) {
  switch (orientation) {
    case "horizontal":
      return "is-horizontal";
    case "tilt-left":
      return "is-tilt-left";
    case "tilt-right":
      return "is-tilt-right";
    default:
      return "";
  }
}

/**
 * Spine book on a shelf (cover crop when available).
 * @example <ShelfBook book={book} />
 */
function ShelfBook({
  book,
  orientation = "vertical",
  interactive,
}: {
  book: GoodreadsBook;
  orientation?: BookOrientation;
  interactive: boolean;
}) {
  const box = spineBox(book, orientation);
  const className = [
    "bookshelf-spine",
    spineArtClass(book),
    orientationClass(orientation),
  ]
    .filter(Boolean)
    .join(" ");

  const cssVars = {
    "--spine-color": box.style.color,
    "--spine-width": `${box.widthRem}rem`,
    "--spine-height": `${box.heightRem}rem`,
    "--spine-text": box.style.textColor,
  } as CSSProperties;

  if (!interactive) {
    return (
      <div
        className={className}
        aria-label={`${book.title}${book.author ? ` by ${book.author}` : ""}`}
        style={cssVars}>
        <SpineFace book={book} style={box.style} />
      </div>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => focusListBook(book)}
      aria-label={`${book.title}${book.author ? ` by ${book.author}` : ""}`}
      style={cssVars}>
      <SpineFace book={book} style={box.style} />
    </button>
  );
}

/**
 * Auto-pack shelf bay from Goodreads sections.
 * @example <ShelfBay section={section} />
 */
function ShelfBay({ section }: { section: ShelfSection }) {
  const bayRef = useRef<HTMLDivElement>(null);
  const [widthRem, setWidthRem] = useState(36);

  useEffect(() => {
    const node = bayRef.current;
    if (!node) return;
    const update = () => {
      const rem =
        Number.parseFloat(
          getComputedStyle(document.documentElement).fontSize,
        ) || 16;
      setWidthRem(Math.max(12, (node.clientWidth - 24) / rem));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const rows = useMemo(
    () => packRows(section.books, widthRem),
    [section.books, widthRem],
  );
  const showHead = Boolean(section.title.trim());

  return (
    <section
      className="bookshelf-section"
      aria-label={showHead ? undefined : "Bookshelf"}
      aria-labelledby={showHead ? `${section.id}-title` : undefined}>
      {showHead ? (
        <div className="bookshelf-section-head">
          <h2 id={`${section.id}-title`} className="bookshelf-section-title">
            {section.title}
          </h2>
          <p className="bookshelf-count">
            {section.books.length}{" "}
            {section.books.length === 1 ? "book" : "books"}
          </p>
        </div>
      ) : null}

      <div className="bookshelf-case">
        <div className="bookshelf-case-crown" aria-hidden />
        <div className="bookshelf-case-body">
          <div className="bookshelf-case-side is-left" aria-hidden />
          <div className="bookshelf-case-back">
            <div ref={bayRef} className="bookshelf-bay">
              {rows.map((row, index) => (
                <div
                  key={`${section.id}-row-${index}`}
                  className="bookshelf-row">
                  <div className="bookshelf-books">
                    {row.map((item) => (
                      <ShelfBook
                        key={item.book.id}
                        book={item.book}
                        interactive
                      />
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
 * Renders one plank item (book-stack or spacer).
 * @example <PlankItemView item={item} … />
 */
function PlankItemView({
  item,
  bookById,
  interactive,
}: {
  item: ShelfPlankItem;
  bookById: Map<string, GoodreadsBook>;
  interactive: boolean;
}) {
  if (item.type === "spacer") {
    return (
      <div
        className="bookshelf-spacer"
        style={{ width: `${item.widthRem}rem` }}
        aria-hidden
      />
    );
  }

  if (item.type !== "book-stack" || !Array.isArray(item.bookIds)) return null;

  const books = item.bookIds
    .map((id) => bookById.get(id))
    .filter((book): book is GoodreadsBook => Boolean(book));
  if (!books.length) return null;

  return (
    <div
      className={`bookshelf-stack is-${item.orientation}`}
      data-stack-id={item.id}>
      {books.map((book) => (
        <ShelfBook
          key={`${item.id}-${book.id}`}
          book={book}
          orientation={item.orientation}
          interactive={interactive}
        />
      ))}
    </div>
  );
}

/**
 * Free-positioned decor overlay (X in rem so it tracks stacks across viewport widths).
 * @example <DecorLayer placements={…} />
 */
function DecorLayer({
  placements,
  artifactById,
  roomWidthRem,
}: {
  placements: ShelfDecorPlacement[];
  artifactById: Map<string, ShelfArtifactItem>;
  roomWidthRem: number;
}) {
  if (!placements.length) return null;
  return (
    <div className="bookshelf-decor-layer" aria-hidden>
      {placements.map((placement) => {
        const artifact = artifactById.get(placement.artifactId);
        if (!artifact || !artifact.enabled || !artifact.imageUrl.trim())
          return null;
        return (
          <ShelfArtifact
            key={placement.id}
            artifact={{
              imageUrl: artifact.imageUrl,
              widthRem: placement.widthRem ?? artifact.widthRem,
              heightRem: placement.heightRem ?? artifact.heightRem,
              name: artifact.name,
              leftCss: decorLeftCss(placement, roomWidthRem),
              yPercent: placement.yPercent,
            }}
          />
        );
      })}
    </div>
  );
}

/**
 * CMS plank cabinet.
 * @example <PlankCabinet planks={…} />
 */
function PlankCabinet({
  planks,
  bookById,
  interactive,
}: {
  planks: { id: string; items: ShelfPlankItem[] }[];
  bookById: Map<string, GoodreadsBook>;
  interactive: boolean;
}) {
  return (
    <section className="bookshelf-section" aria-label="Bookshelf">
      <div className="bookshelf-case">
        <div className="bookshelf-case-crown" aria-hidden />
        <div className="bookshelf-case-body">
          <div className="bookshelf-case-side is-left" aria-hidden />
          <div className="bookshelf-case-back">
            <div className="bookshelf-bay">
              {planks.map((plank) => (
                <div
                  key={plank.id}
                  className="bookshelf-row"
                  data-plank-id={plank.id}>
                  <div
                    className={`bookshelf-books${plank.items.length === 0 ? " is-empty-bay" : ""}`}>
                    {plank.items.map((item) => (
                      <PlankItemView
                        key={item.id}
                        item={item}
                        bookById={bookById}
                        interactive={interactive}
                      />
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
 * Tracks desktop vs mobile shelf viewport.
 * @example useShelfViewport()
 */
function useShelfViewport(force?: ShelfViewport): ShelfViewport {
  const [viewport, setViewport] = useState<ShelfViewport>("desktop");

  useEffect(() => {
    if (force) return;
    const mq = window.matchMedia(`(max-width: ${SHELF_MOBILE_MAX_REM}rem)`);
    const sync = () => setViewport(mq.matches ? "mobile" : "desktop");
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [force]);

  return force ?? viewport;
}

/**
 * Wooden spine shelves — CMS plank layout when configured, else auto-pack.
 * @example <Bookshelf sections={sections} shelfLayout={layout} />
 */
export function Bookshelf({
  sections,
  artifacts = [],
  shelfLayout = EMPTY_SHELF_LAYOUT,
  interactiveBooks = true,
  forceViewport,
  layoutMode = "auto",
}: {
  sections: ShelfSection[];
  artifacts?: ShelfArtifactItem[];
  shelfLayout?: ShelfLayout;
  interactiveBooks?: boolean;
  forceViewport?: ShelfViewport;
  layoutMode?: "auto" | "builder";
}) {
  const viewport = useShelfViewport(forceViewport);
  const filled = sections.filter((section) => section.books.length > 0);
  const bookById = useMemo(() => {
    const map = new Map<string, GoodreadsBook>();
    for (const section of filled) {
      for (const book of section.books) map.set(book.id, book);
    }
    return map;
  }, [filled]);

  const artifactById = useMemo(() => {
    const map = new Map<string, ShelfArtifactItem>();
    for (const item of artifacts) map.set(item.id, item);
    return map;
  }, [artifacts]);

  const view = shelfViewportFor(shelfLayout, viewport);
  const useBuilderLayout =
    layoutMode === "builder" || shelfViewportHasItems(view);
  const roomRef = useRef<HTMLDivElement>(null);
  const [roomWidthRem, setRoomWidthRem] = useState(
    shelfLiveBayWidthRem(viewport),
  );

  useEffect(() => {
    const node = roomRef.current;
    if (!node) return;
    const update = () => {
      const rem =
        Number.parseFloat(
          getComputedStyle(document.documentElement).fontSize,
        ) || 16;
      setRoomWidthRem(Math.max(4, node.clientWidth / rem));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [viewport, useBuilderLayout, view.planks.length]);

  if (!filled.length && !useBuilderLayout) return null;

  return (
    <div
      className={`bookshelf${interactiveBooks ? "" : " is-placement-canvas"}${
        useBuilderLayout ? " is-builder-layout" : ""
      }`}>
      {interactiveBooks ? (
        ""
      ) : (
        <p className="bookshelf-hint">
          Drop stacks onto a plank · decor places freely on the cabinet
        </p>
      )}

      <div ref={roomRef} className="bookshelf-room">
        <div className="bookshelf-stage">
          {useBuilderLayout ? (
            <PlankCabinet
              planks={view.planks}
              bookById={bookById}
              interactive={interactiveBooks}
            />
          ) : (
            filled.map((section) => (
              <ShelfBay key={section.id} section={section} />
            ))
          )}
        </div>

        {useBuilderLayout ? (
          <DecorLayer
            placements={view.decor ?? []}
            artifactById={artifactById}
            roomWidthRem={roomWidthRem}
          />
        ) : null}
      </div>
    </div>
  );
}
