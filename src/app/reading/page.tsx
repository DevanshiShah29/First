import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { ReadingLibrary } from "@/components/ReadingLibrary";
import { loadContent } from "@/content/store";
import { toPublicContent } from "@/content/types";
import { emptyLibrary, loadGoodreadsLibrary } from "@/lib/goodreads";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const content = await loadContent();
  return {
    title: `Reading | ${content.site.name}`,
    description: `Books ${content.site.name} is reading, has read, and wants to read — with notes from Goodreads.`,
  };
}

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
      <ReadingLibrary library={library} />
    </PageShell>
  );
}
