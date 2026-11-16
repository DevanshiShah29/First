"use client";

import { useEffect, useRef, useState } from "react";
import type { GoodreadsCsvBook, GoodreadsShelf } from "@/lib/goodreads";
import { ConfirmButton } from "../components/ConfirmDialog";
import { Metabox } from "../components/Metabox";
import { BookEditDialog } from "./BookEditDialog";

type ImportSummary = {
  imported: number;
  shelves: Record<GoodreadsShelf, number>;
};

const SHELF_LABELS: Record<GoodreadsShelf, string> = {
  "currently-reading": "Currently reading",
  read: "Read",
  "to-read": "Want to read",
};

/**
 * Renders the Goodreads CSV import and imported book list.
 * @example <BooksScreen /> for the Book Nook CMS screen
 */
export function BooksScreen() {
  const [books, setBooks] = useState<GoodreadsCsvBook[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [filter, setFilter] = useState<"all" | GoodreadsShelf>("all");
  const [editing, setEditing] = useState<GoodreadsCsvBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Loads imported books for the summary table.
   * @example void load() // void
   */
  async function load() {
    try {
      const res = await fetch("/api/cms/books", {
        credentials: "same-origin",
        cache: "no-store",
      });
      const body = (await res.json().catch(() => ({}))) as {
        books?: GoodreadsCsvBook[];
        error?: string;
      };
      if (!res.ok) {
        setError(body.error || "Could not load the imported books.");
        return;
      }
      setError("");
      setBooks(body.books ?? []);
    } catch {
      setError("Could not load the imported books.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function loadInitial() {
      if (cancelled) return;
      await load();
    }
    void loadInitial();
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Uploads the selected CSV and replaces the library.
   * @example void runImport() // void
   */
  async function runImport() {
    if (!file) {
      setError("Choose the CSV file exported from Goodreads.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const csv = await file.text();
      const res = await fetch("/api/cms/books", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "text/csv" },
        body: csv,
      });
      const body = (await res.json().catch(() => ({}))) as ImportSummary & {
        error?: string;
      };
      if (!res.ok) {
        setError(body.error || "Could not import that CSV.");
        return;
      }
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      setNotice(
        `Imported ${body.imported} books: ${body.shelves["currently-reading"]} currently reading, ${body.shelves.read} read, ${body.shelves["to-read"]} want to read.`,
      );
      await load();
    } catch {
      setError("Could not import that CSV.");
    } finally {
      setBusy(false);
    }
  }

  /**
   * Deletes every imported book.
   * @example void removeAll() // void
   */
  async function removeAll() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/cms/books", {
        method: "DELETE",
        credentials: "same-origin",
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(body.error || "Could not clear the book list.");
        return;
      }
      setBooks([]);
      setNotice("Book list cleared.");
    } catch {
      setError("Could not clear the book list.");
    } finally {
      setBusy(false);
    }
  }

  const counts = books.reduce<Record<GoodreadsShelf, number>>(
    (total, book) => {
      total[book.shelf] += 1;
      return total;
    },
    { "currently-reading": 0, read: 0, "to-read": 0 },
  );
  const visible =
    filter === "all" ? books : books.filter((book) => book.shelf === filter);

  /**
   * Replaces one saved book in the local list.
   * @example handleSaved(book) // void
   */
  function handleSaved(book: GoodreadsCsvBook) {
    setBooks((current) =>
      current.map((item) => (item.id === book.id ? book : item)),
    );
    setEditing(null);
    setNotice(`Saved “${book.title}”.`);
  }

  /**
   * Removes one deleted book from the local list.
   * @example handleDeleted("123") // void
   */
  function handleDeleted(id: string) {
    setBooks((current) => current.filter((book) => book.id !== id));
    setEditing(null);
    setNotice("Book removed.");
  }

  return (
    <>
      <h1 className="wp-screen-title">Book Nook</h1>
      <p className="wp-sub">
        Goodreads retired its RSS feeds in October 2026. Import your library
        from a My Books CSV export instead — the public /reading page and shelf
        builder use these books.
      </p>

      {error ? (
        <div className="wp-notice is-error" role="alert">
          {error}
        </div>
      ) : null}
      {notice && !error ? (
        <div className="wp-notice is-success" role="status">
          {notice}
        </div>
      ) : null}

      <Metabox id="books_import" title="Import from Goodreads">
        <ol className="wp-sub" style={{ margin: "0 0 14px 18px", padding: 0 }}>
          <li>
            Open <strong>My Books</strong> on Goodreads and choose{" "}
            <strong>Import and export</strong>.
          </li>
          <li>Export your library as a CSV file.</li>
          <li>
            Upload that CSV below. Importing replaces the current list,
            including any books you edited by hand.
          </li>
        </ol>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <label className="wp-skill-file" style={{ margin: 0 }}>
            <span className="wp-btn">
              {file ? "Choose another CSV" : "Choose CSV"}
            </span>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              disabled={busy}
              aria-label="Goodreads My Books CSV export"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setError("");
                setNotice("");
              }}
            />
          </label>
          <span className="wp-sub" style={{ margin: 0 }}>
            {file ? file.name : "No file chosen"}
          </span>
          {books.length ? (
            <ConfirmButton
              className="wp-btn wp-btn-primary"
              disabled={!file || busy}
              title="Replace the imported library?"
              message={`This replaces the current ${books.length} books, including manual edits, with the books in this CSV.`}
              confirmLabel="Import and replace"
              onConfirm={() => void runImport()}>
              {busy ? "Importing…" : "Import CSV"}
            </ConfirmButton>
          ) : (
            <button
              type="button"
              className="wp-btn wp-btn-primary"
              disabled={!file || busy}
              onClick={() => void runImport()}>
              {busy ? "Importing…" : "Import CSV"}
            </button>
          )}
          {books.length ? (
            <ConfirmButton
              className="wp-btn wp-btn-danger"
              disabled={busy}
              title="Remove every imported book?"
              message="The public Book Nook page will show an empty shelf until you import again."
              confirmLabel="Remove all books"
              onConfirm={() => void removeAll()}>
              Remove all
            </ConfirmButton>
          ) : null}
        </div>
      </Metabox>

      <Metabox
        id="books_list"
        title="Imported books"
        badge={loading ? "Loading…" : `${books.length}`}>
        {loading ? (
          <p className="wp-sub">Loading imported books…</p>
        ) : books.length === 0 ? (
          <p className="wp-sub">No books imported yet.</p>
        ) : (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 12 }}>
              <label htmlFor="books-shelf-filter" className="wp-sub" style={{ margin: 0 }}>
                Shelf
              </label>
              <select
                id="books-shelf-filter"
                className="wp-select"
                value={filter}
                onChange={(event) =>
                  setFilter(event.target.value as "all" | GoodreadsShelf)
                }>
                <option value="all">All books ({books.length})</option>
                {(Object.keys(SHELF_LABELS) as GoodreadsShelf[]).map((shelf) => (
                  <option key={shelf} value={shelf}>
                    {SHELF_LABELS[shelf]} ({counts[shelf]})
                  </option>
                ))}
              </select>
            </div>
            <table className="wp-list-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Shelf</th>
                  <th>Rating</th>
                  <th>Date read</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((book) => (
                  <tr key={book.id}>
                    <td>
                      <button
                        type="button"
                        className="row-title"
                        onClick={() => setEditing(book)}>
                        {book.title}
                      </button>
                      <div className="wp-row-actions">
                        <button type="button" onClick={() => setEditing(book)}>
                          Edit
                        </button>
                        {" | "}
                        <a href={book.url} target="_blank" rel="noreferrer">
                          Goodreads
                        </a>
                      </div>
                    </td>
                    <td>{book.author || "—"}</td>
                    <td>{SHELF_LABELS[book.shelf]}</td>
                    <td>{book.rating > 0 ? `${book.rating} / 5` : "—"}</td>
                    <td>{book.readAt || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </Metabox>

      {editing ? (
        <BookEditDialog
          book={editing}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </>
  );
}
