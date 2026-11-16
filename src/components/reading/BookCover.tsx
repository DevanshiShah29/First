"use client";

import { useState } from "react";
import type { GoodreadsBook } from "@/lib/goodreads";
import { MediaImage } from "../MediaImage";

/**
 * Book cover that falls back to the empty placeholder when a cover fails to load.
 * @example <BookCover book={book} decorative />
 */
export function BookCover({
  book,
  className,
  decorative = false,
}: {
  book: GoodreadsBook;
  className?: string;
  decorative?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const cover = book.cover.trim();

  if (!cover || failed) {
    return (
      <div
        className={`${className ?? ""} reading-cover is-empty`}
        aria-hidden
      />
    );
  }

  return (
    <MediaImage
      src={cover}
      alt={decorative ? "" : `${book.title} cover`}
      className={`${className ?? ""} reading-cover`}
      width={200}
      height={300}
      sizes="(max-width: 640px) 40vw, 140px"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
