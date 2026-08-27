import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { ReadingLibrary } from "@/components/ReadingLibrary";
import { loadContent } from "@/content/store";
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
  const content = await loadContent();
  const name = content.site.name.split(" ")[0] || content.site.name;
  let library = emptyLibrary(content.site.goodreadsUrl);
  try {
    library = await loadGoodreadsLibrary(content.site.goodreadsUrl, name);
  } catch {
    library = { ...emptyLibrary(content.site.goodreadsUrl), configured: true, name };
  }
  return (
    <PageShell content={content}>
      <ReadingLibrary library={library} />
    </PageShell>
  );
}
