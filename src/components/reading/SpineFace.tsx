import type { CSSProperties } from "react";
import type { GoodreadsBook } from "@/lib/goodreads";
import { spineLabel, type SpineStyle } from "./spineStyle";

/**
 * Clean photographic spine face: cover crop + light shade + title.
 * @example <SpineFace book={book} style={spine} />
 */
export function SpineFace({
  book,
  style,
}: {
  book: GoodreadsBook;
  style: SpineStyle;
}) {
  const cover = book.cover.trim();
  const hasArt = Boolean(cover);
  const artVars = {
    "--spine-art-x": `${style.artPositionPercent}%`,
  } as CSSProperties;

  return (
    <>
      {hasArt ? (
        // eslint-disable-next-line @next/next/no-img-element -- Goodreads CDN covers; decorative crop
        <img
          className="bookshelf-spine-art"
          src={cover}
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          draggable={false}
          style={artVars}
          onError={(event) => {
            const node = event.currentTarget;
            node.parentElement?.classList.remove("has-art");
            node.remove();
          }}
        />
      ) : null}
      <span className="bookshelf-spine-shade" aria-hidden />
      <span className="bookshelf-spine-title">{spineLabel(book.title)}</span>
    </>
  );
}

/**
 * Marks a spine element as having cover art when a cover URL exists.
 * @example spineArtClass(book) // "has-art" | ""
 */
export function spineArtClass(book: GoodreadsBook) {
  return book.cover.trim() ? "has-art" : "";
}
