"use client";

import type { CSSProperties, DragEvent as ReactDragEvent } from "react";
import type { ShelfPlankItem } from "@/content/types";
import type { GoodreadsBook } from "@/lib/goodreads";
import { SpineFace, spineArtClass } from "@/components/reading/SpineFace";
import { spineBox } from "./shelfFootprint";
import { orientClass } from "./shelfPlacementShared";

/**
 * One placed plank item in the editor drop zone.
 * @example <EditorItem item={…} … />
 */
export function EditorItem({
  item,
  bookById,
  selected,
  dragging,
  showInsertBefore,
  onSelect,
  onDragStart,
  onDragEnd,
}: {
  item: ShelfPlankItem;
  bookById: Map<string, GoodreadsBook>;
  selected: boolean;
  dragging: boolean;
  showInsertBefore: boolean;
  onSelect: () => void;
  onDragStart: (e: ReactDragEvent) => void;
  onDragEnd: () => void;
}) {
  if (item.type === "spacer") {
    return (
      <>
        {showInsertBefore ? (
          <span className="wp-shelf-insert-caret" aria-hidden />
        ) : null}
        <div
          role="button"
          tabIndex={0}
          data-editor-item={item.id}
          draggable
          className={`wp-shelf-spacer${selected ? " is-selected" : ""}${
            dragging ? " is-dragging" : ""
          }`}
          style={{
            width: `${item.widthRem}rem`,
            flex: `0 0 ${item.widthRem}rem`,
          }}
          onClick={onSelect}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect();
            }
          }}
          aria-label={`White Space ${item.widthRem}rem (drag to reorder)`}>
          White Space
        </div>
      </>
    );
  }

  const books = item.bookIds
    .map((id) => bookById.get(id))
    .filter((book): book is GoodreadsBook => Boolean(book));

  return (
    <>
      {showInsertBefore ? (
        <span className="wp-shelf-insert-caret" aria-hidden />
      ) : null}
      <div
        role="button"
        tabIndex={0}
        data-editor-item={item.id}
        draggable
        className={`bookshelf-stack wp-shelf-stack ${orientClass(item.orientation)}${
          selected ? " is-selected" : ""
        }${dragging ? " is-dragging" : ""}`}
        onClick={onSelect}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect();
          }
        }}
        aria-label={
          books.length
            ? `${books.map((b) => b.title).join(", ")} (select to edit or remove)`
            : "Empty stack"
        }>
        {books.map((book) => {
          const box = spineBox(book, item.orientation);
          return (
            <div
              key={book.id}
              className={`bookshelf-spine ${spineArtClass(book)} ${orientClass(item.orientation)}`}
              style={
                {
                  "--spine-width": `${box.widthRem}rem`,
                  "--spine-height": `${box.heightRem}rem`,
                  "--spine-color": box.style.color,
                  "--spine-text": box.style.textColor,
                } as CSSProperties
              }>
              <SpineFace book={book} style={box.style} />
            </div>
          );
        })}
        {!books.length ? <span className="wp-sub">Missing books</span> : null}
      </div>
    </>
  );
}
