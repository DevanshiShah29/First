"use client";

import { useEffect, useState } from "react";
import type { BookOrientation } from "@/content/types";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import type { GoodreadsBook } from "@/lib/goodreads";
import { spineStyle } from "@/components/reading/spineStyle";

/**
 * Modal to multi-pick Goodreads books for a stack.
 * @example <BookPickerModal … />
 */
export function BookPickerModal({
  books,
  orientation,
  maxPick,
  title,
  onConfirm,
  onClose,
}: {
  books: GoodreadsBook[];
  orientation: BookOrientation;
  maxPick: number;
  title: string;
  onConfirm: (bookIds: string[]) => void;
  onClose: () => void;
}) {
  const dialogRef = useDialogFocus<HTMLDivElement>(true);
  const [picked, setPicked] = useState<string[]>([]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  /**
   * Toggles a book in the multi-select set.
   * @example toggle(id)
   */
  function toggle(id: string) {
    setPicked((current) => {
      if (current.includes(id)) return current.filter((x) => x !== id);
      if (current.length >= maxPick) return current;
      return [...current, id];
    });
  }

  return (
    <div
      className="wp-shelf-modal-backdrop"
      role="presentation"
      onClick={onClose}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="wp-shelf-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shelf-book-picker-title"
        onClick={(e) => e.stopPropagation()}>
        <div className="wp-shelf-modal-head">
          <h3 id="shelf-book-picker-title">{title}</h3>
          <p className="wp-sub">
            Orientation: <strong>{orientation}</strong> · Select up to {maxPick}
          </p>
        </div>
        <div className="wp-shelf-modal-body">
          {books.length === 0 || maxPick <= 0 ? (
            <p className="wp-sub">No more books available for this stack.</p>
          ) : (
            <ul className="wp-shelf-picker-list">
              {books.map((book) => {
                const checked = picked.includes(book.id);
                const disabled = !checked && picked.length >= maxPick;
                return (
                  <li key={book.id}>
                    <button
                      type="button"
                      className={`wp-shelf-picker-item${checked ? " is-checked" : ""}${
                        disabled ? " is-disabled" : ""
                      }`}
                      disabled={disabled}
                      onClick={() => toggle(book.id)}>
                      <input
                        type="checkbox"
                        readOnly
                        checked={checked}
                        tabIndex={-1}
                      />
                      <span
                        aria-hidden
                        className="wp-shelf-picker-swatch"
                        style={{ background: spineStyle(book).color }}
                      />
                      <span className="wp-shelf-picker-copy">
                        <span className="wp-shelf-picker-title">
                          {book.title}
                        </span>
                        {book.author ? (
                          <span className="wp-shelf-picker-author">
                            {book.author}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="wp-shelf-modal-footer">
          <button
            type="button"
            className="wp-btn wp-btn-primary"
            disabled={picked.length === 0}
            onClick={() => onConfirm(picked)}>
            Add {picked.length || ""} {picked.length === 1 ? "book" : "books"}
          </button>
          <button type="button" className="wp-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
