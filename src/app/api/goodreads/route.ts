import { NextResponse } from "next/server";
import { loadContent } from "@/content/store";
import { emptyLibrary } from "@/lib/goodreads";
import { loadLibrary } from "@/server/books";

export const runtime = "nodejs";

/**
 * Handles GET /api/goodreads.
 * @example GET // Goodreads library JSON
 */
export async function GET() {
  const { site } = await loadContent();
  const profileUrl = site.goodreadsUrl.trim();
  const name = site.name.split(" ")[0] || site.name;
  try {
    const library = await loadLibrary(profileUrl, name);
    return NextResponse.json(library, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Could not load the bookshelf right now.", ...emptyLibrary(profileUrl), configured: true },
      { status: 502 },
    );
  }
}
