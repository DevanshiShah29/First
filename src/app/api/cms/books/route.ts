import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireCmsMutation, verifySessionCookie } from "@/server/cms-auth";
import { clearBooks, importBooks, listStoredBooks } from "@/server/books";

export const runtime = "nodejs";

const MAX_CSV_BYTES = 5 * 1024 * 1024;

/**
 * Handles GET /api/cms/books.
 * @example GET // { books } when session cookie is valid
 */
export async function GET() {
  const token = (await cookies()).get("cms_session")?.value;
  if (!(await verifySessionCookie(token))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const books = await listStoredBooks();
  return NextResponse.json({ books }, { headers: { "Cache-Control": "no-store" } });
}

/**
 * Handles POST /api/cms/books with a Goodreads CSV export body.
 * @example POST text/csv // { imported, shelves }
 */
export async function POST(req: Request) {
  const gate = await requireCmsMutation(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_CSV_BYTES) {
    return NextResponse.json(
      { error: "That CSV is too large. Export My Books again and retry." },
      { status: 413 },
    );
  }

  let csv: string;
  try {
    csv = await req.text();
  } catch {
    return NextResponse.json(
      { error: "Could not read the CSV file." },
      { status: 400 },
    );
  }

  try {
    const summary = await importBooks(csv);
    revalidatePath("/reading");
    return NextResponse.json(summary);
  } catch (err) {
    console.error("importBooks failed", err);
    const message =
      err instanceof Error && err.message.startsWith("No books found")
        ? err.message
        : "Could not import that CSV. Check the file and try again.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/**
 * Handles DELETE /api/cms/books.
 * @example DELETE // { ok: true }
 */
export async function DELETE(req: Request) {
  const gate = await requireCmsMutation(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  try {
    await clearBooks();
  } catch (err) {
    console.error("clearBooks failed", err);
    return NextResponse.json(
      { error: "Could not clear the book list." },
      { status: 500 },
    );
  }
  revalidatePath("/reading");
  return NextResponse.json({ ok: true });
}
