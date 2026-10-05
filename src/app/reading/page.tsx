import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { ReadingLibrary } from "@/components/ReadingLibrary";
import { loadContent } from "@/content/store";
import { EMPTY_SHELF_LAYOUT, toPublicContent } from "@/content/types";
import { emptyLibrary, loadGoodreadsLibrary } from "@/lib/goodreads";
import { buildPageMetadata } from "@/lib/seo";

/** Align with Goodreads fetch revalidate (~30m). CMS saves also revalidate this path. */
export const revalidate = 1800;

/**
 * Builds reading page metadata from CMS.
 * @example generateMetadata() // Metadata
 */
export async function generateMetadata(): Promise<Metadata> {
  const content = await loadContent();
  return buildPageMetadata({
    title: `Book Nook | ${content.site.name}`,
    description: `Books ${content.site.name} is reading, has read, and wants to read — with notes from Goodreads.`,
    path: "/reading",
    siteName: content.site.name,
  });
}

/**
 * Renders the Goodreads reading library page.
 * @example <ReadingPage /> for /reading
 */
export default async function ReadingPage() {
  const full = await loadContent();
  const content = toPublicContent(full);
  const name = full.site.name.split(" ")[0] || full.site.name;
  let library = emptyLibrary(full.site.goodreadsUrl);
  try {
    library = await loadGoodreadsLibrary(full.site.goodreadsUrl, name);
  } catch {
    library = { ...emptyLibrary(full.site.goodreadsUrl), configured: true, name };
  }
  return (
    <PageShell content={content}>
      <ReadingLibrary
        library={library}
        artifacts={full.shelfArtifacts ?? []}
        shelfLayout={full.shelfLayout ?? EMPTY_SHELF_LAYOUT}
      />
    </PageShell>
  );
}
