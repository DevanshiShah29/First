import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import type { GoodreadsShelf } from "@/lib/goodreads";
import { deleteBook, updateBook, type BookUpdate } from "@/server/books";
import { requireCmsMutation } from "@/server/cms-auth";

export const runtime = "nodejs";

const SHELVES = new Set<GoodreadsShelf>(["currently-reading", "read", "to-read"]);
const TEXT_FIELDS = [
  "title",
  "author",
  "cover",
  "url",
  "reviewUrl",
  "year",
  "pages",
  "readAt",
  "shelves",
  "review",
] as const;

/**
 * Validates an editable book payload.
 * @example parseUpdate({ title: "Book" }) // { ok: true, update: { title: "Book" } }
 */
function parseUpdate(
  body: unknown,
): { ok: true; update: BookUpdate } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid book payload." };
  }
  const raw = body as Record<string, unknown>;
  const update: BookUpdate = {};
  const text = update as Record<string, string>;

  for (const field of TEXT_FIELDS) {
    const value = raw[field];
    if (value === undefined) continue;
    if (typeof value !== "string") {
      return { ok: false, error: `${field} must be text.` };
    }
    text[field] = value.trim();
  }

  if (update.title !== undefined && !update.title) {
    return { ok: false, error: "Title is required." };
  }

  if (raw.rating !== undefined) {
    const rating = Number(raw.rating);
    if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
      return { ok: false, error: "Rating must be a whole number from 0 to 5." };
    }
    update.rating = rating;
  }

  if (raw.shelf !== undefined) {
    if (typeof raw.shelf !== "string" || !SHELVES.has(raw.shelf as GoodreadsShelf)) {
      return { ok: false, error: "Choose a valid shelf." };
    }
    update.shelf = raw.shelf as GoodreadsShelf;
  }

  if (!Object.keys(update).length) {
    return { ok: false, error: "No book changes were provided." };
  }

  return { ok: true, update };
}

/**
 * Handles PATCH /api/cms/books/:id.
 * @example PATCH { title } // { book }
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireCmsMutation(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const { id } = await params;
  if (!id.trim()) {
    return NextResponse.json({ error: "Book id is required." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = parseUpdate(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const book = await updateBook(id, parsed.update);
    if (!book) {
      return NextResponse.json({ error: "Book not found." }, { status: 404 });
    }
    revalidatePath("/reading");
    return NextResponse.json({ book });
  } catch (err) {
    console.error("updateBook failed", err);
    return NextResponse.json(
      { error: "Could not save that book." },
      { status: 500 },
    );
  }
}

/**
 * Handles DELETE /api/cms/books/:id.
 * @example DELETE // { ok: true }
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireCmsMutation(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const { id } = await params;
  try {
    const removed = await deleteBook(id);
    if (!removed) {
      return NextResponse.json({ error: "Book not found." }, { status: 404 });
    }
    revalidatePath("/reading");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("deleteBook failed", err);
    return NextResponse.json(
      { error: "Could not delete that book." },
      { status: 500 },
    );
  }
}
