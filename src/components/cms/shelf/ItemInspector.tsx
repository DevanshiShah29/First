"use client";

import { SHELF_STACK_MAX_BOOKS, type ShelfPlankItem } from "@/content/types";
import type { GoodreadsBook } from "@/lib/goodreads";
import { ConfirmButton } from "../components/ConfirmDialog";
import { ORIENTATION_META } from "./shelfPlacementShared";

/**
 * Inspector for a selected book stack — edit books, orientation, or remove.
 * @example <ItemInspector … />
 */
export function ItemInspector({
  item,
  bookById,
  unplacedBooks,
  onPatch,
  onAddBooks,
  onRemoveBook,
  onRemove,
  onClose,
}: {
  item: Extract<ShelfPlankItem, { type: "book-stack" }>;
  bookById: Map<string, GoodreadsBook>;
  unplacedBooks: GoodreadsBook[];
  onPatch: (patch: Record<string, unknown>) => void;
  onAddBooks: () => void;
  onRemoveBook: (bookId: string) => void;
  onRemove: () => void;
  onClose?: () => void;
}) {
  const books = item.bookIds
    .map((id) => bookById.get(id))
    .filter((book): book is GoodreadsBook => Boolean(book));

  return (
    <div className="wp-shelf-selection wp-shelf-inspector">
      <div className="wp-shelf-inspector-head">
        <strong>Book Stack</strong>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="wp-shelf-inspector-meta">
            {books.length}/{SHELF_STACK_MAX_BOOKS} books
          </span>
          {onClose ? (
            <button
              type="button"
              className="wp-shelf-inspector-close"
              onClick={onClose}
              title="Deselect"
              aria-label="Deselect">
              ✕
            </button>
          ) : null}
        </div>
      </div>
      <div className="wp-shelf-stack-toolbar">
        <button
          type="button"
          className="wp-btn wp-btn-primary wp-btn-small"
          disabled={
            item.bookIds.length >= SHELF_STACK_MAX_BOOKS ||
            unplacedBooks.length === 0
          }
          onClick={onAddBooks}>
          Edit
        </button>
        <ConfirmButton
          className="wp-btn wp-btn-small"
          title="Remove this stack?"
          message="This takes the stack off the plank. Save to update the live site."
          confirmLabel="Remove"
          onConfirm={onRemove}>
          Remove
        </ConfirmButton>
      </div>
      <div className="wp-shelf-inspector-field">
        <span>Orientation</span>
        <select
          value={item.orientation}
          onChange={(e) => onPatch({ orientation: e.target.value })}>
          {ORIENTATION_META.map((entry) => (
            <option key={entry.kind} value={entry.kind}>
              {entry.label}
            </option>
          ))}
        </select>
      </div>
      <div className="wp-shelf-inspector-field">
        <span>Books</span>
        <ul className="wp-shelf-stack-books">
          {books.map((book) => (
            <li key={book.id}>
              <span title={book.title}>{book.title}</span>
              <ConfirmButton
                className="wp-btn wp-btn-small"
                ariaLabel={`Remove ${book.title}`}
                title={`Remove “${book.title}” from this stack?`}
                message="The book stays in your library. Save to update the live site."
                confirmLabel="Remove"
                onConfirm={() => onRemoveBook(book.id)}>
                ✕
              </ConfirmButton>
            </li>
          ))}
          {!books.length ? (
            <li className="wp-sub">No books in this stack</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
