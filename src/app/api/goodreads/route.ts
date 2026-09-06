import { NextResponse } from "next/server";
import { loadContent } from "@/content/store";
import { emptyLibrary, loadGoodreadsLibrary } from "@/lib/goodreads";

export const runtime = "nodejs";

/**
 * Handles GET /api/goodreads.
 * @example GET // Goodreads library JSON
 */
export async function GET() {
  const { site } = await loadContent();
  const profileUrl = site.goodreadsUrl.trim();
  const name = site.name.split(" ")[0] || site.name;
  if (!profileUrl) {
    return NextResponse.json(emptyLibrary(), { headers: { "Cache-Control": "no-store" } });
  }
  try {
    const library = await loadGoodreadsLibrary(profileUrl, name);
    return NextResponse.json(library, {
      headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400" },
    });
  } catch {
    return NextResponse.json(
      { error: "Could not load Goodreads right now.", ...emptyLibrary(profileUrl), configured: true },
      { status: 502 },
    );
  }
}
