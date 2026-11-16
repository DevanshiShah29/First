"use client";

import { useEffect, useState } from "react";
import type { GoodreadsCsvBook, GoodreadsShelf } from "@/lib/goodreads";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import { ConfirmButton } from "../components/ConfirmDialog";
import { Field, TextArea, TextInput } from "../fields";

const SHELF_OPTIONS: { value: GoodreadsShelf; label: string }[] = [
  { value: "currently-reading", label: "Currently reading" },
  { value: "read", label: "Read" },
  { value: "to-read", label: "Want to read" },
];

type Draft = {
  title: string;
  author: string;
  cover: string;
  url: string;
  rating: number;
  year: string;
  pages: string;
  readAt: string;
  review: string;
  shelf: GoodreadsShelf;
};

/**
 * Edits one imported book without re-running the CSV import.
 * @example <BookEditDialog book={book} onSaved={…} onClose={…} />
 */
export function BookEditDialog({
  book,
  onSaved,
  onDeleted,
  onClose,
}: {
  book: GoodreadsCsvBook;
  onSaved: (book: GoodreadsCsvBook) => void;
  onDeleted: (id: string) => void;
  onClose: () => void;
}) {
  const dialogRef = useDialogFocus<HTMLDivElement>(true);
  const [draft, setDraft] = useState<Draft>({
    title: book.title,
    author: book.author,
    cover: book.cover,
    url: book.url,
    rating: book.rating,
    year: book.year,
    pages: book.pages,
    readAt: book.readAt,
    review: book.review,
    shelf: book.shelf,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  /**
   * Patches one field of the local draft.
   * @example set("author", "Jane Doe") // void
   */
  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  /**
   * Saves the edited fields to the database.
   * @example void save() // void
   */
  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/cms/books/${encodeURIComponent(book.id)}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const body = (await res.json().catch(() => ({}))) as {
        book?: GoodreadsCsvBook;
        error?: string;
      };
      if (!res.ok || !body.book) {
        setError(body.error || "Could not save that book.");
        return;
      }
      onSaved(body.book);
    } catch {
      setError("Could not save that book.");
    } finally {
      setSaving(false);
    }
  }

  /**
   * Deletes the book from the database.
   * @example void remove() // void
   */
  async function remove() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/cms/books/${encodeURIComponent(book.id)}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(body.error || "Could not delete that book.");
        return;
      }
      onDeleted(book.id);
    } catch {
      setError("Could not delete that book.");
    } finally {
      setSaving(false);
    }
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
        aria-labelledby="book-edit-title"
        onClick={(event) => event.stopPropagation()}>
        <div className="wp-shelf-modal-head">
          <h3 id="book-edit-title">Edit book</h3>
          <p className="wp-sub">
            Changes go live on the public Book Nook page immediately.
          </p>
        </div>
        <div className="wp-shelf-modal-body">
          {error ? (
            <div className="wp-notice is-error" role="alert">
              {error}
            </div>
          ) : null}
          <table className="wp-form-table">
            <tbody>
              <Field label="Title">
                <TextInput value={draft.title} onChange={(value) => set("title", value)} />
              </Field>
              <Field label="Author">
                <TextInput value={draft.author} onChange={(value) => set("author", value)} />
              </Field>
              <Field label="Shelf">
                <select
                  className="wp-select"
                  value={draft.shelf}
                  onChange={(event) => set("shelf", event.target.value as GoodreadsShelf)}>
                  {SHELF_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Rating">
                <select
                  className="wp-select"
                  value={draft.rating}
                  onChange={(event) => set("rating", Number(event.target.value))}>
                  <option value={0}>No rating</option>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <option key={rating} value={rating}>
                      {rating} / 5
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Date read" hint="Goodreads date format, for example 2026/10/02.">
                <TextInput value={draft.readAt} onChange={(value) => set("readAt", value)} />
              </Field>
              <Field label="Pages">
                <TextInput value={draft.pages} onChange={(value) => set("pages", value)} />
              </Field>
              <Field label="Year">
                <TextInput value={draft.year} onChange={(value) => set("year", value)} />
              </Field>
              <Field label="Goodreads URL">
                <TextInput value={draft.url} onChange={(value) => set("url", value)} />
              </Field>
              <Field
                label="Cover URL"
                wide
                hint="Leave blank to show a title-only spine.">
                <TextInput value={draft.cover} onChange={(value) => set("cover", value)} />
              </Field>
              <Field label="Review" wide>
                <TextArea
                  value={draft.review}
                  rows={5}
                  onChange={(value) => set("review", value)}
                />
              </Field>
            </tbody>
          </table>
        </div>
        <div className="wp-shelf-modal-footer">
          <button
            type="button"
            className="wp-btn wp-btn-primary"
            disabled={saving || !draft.title.trim()}
            onClick={() => void save()}>
            {saving ? "Saving…" : "Save changes"}
          </button>
          <button type="button" className="wp-btn" disabled={saving} onClick={onClose}>
            Cancel
          </button>
          <span style={{ flex: 1 }} />
          <ConfirmButton
            className="wp-btn wp-btn-danger"
            disabled={saving}
            title={`Delete “${book.title}”?`}
            message="This removes it from the public Book Nook page. A new CSV import can add it back."
            confirmLabel="Delete book"
            onConfirm={() => void remove()}>
            Delete
          </ConfirmButton>
        </div>
      </div>
    </div>
  );
}
