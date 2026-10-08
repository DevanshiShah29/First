import type { Metadata, Viewport } from "next";
import { MemoryJarExperience } from "@/components/MemoryJarExperience";
import { PageShell } from "@/components/PageShell";
import { loadContent } from "@/content/store";
import { toPublicContent } from "@/content/types";
import { buildPageMetadata } from "@/lib/seo";

/** Saved drafts must leave the memory jar on the next request. */
export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  themeColor: "#FBF4EA",
};

/**
 * Builds memories page metadata.
 * @example generateMetadata() // Metadata
 */
export async function generateMetadata(): Promise<Metadata> {
  const content = await loadContent();
  return buildPageMetadata({
    title: `Memories | ${content.site.name}`,
    description:
      "Tuck away tiny happy memories as they happen. On low days, open your jar for a random one — a small, private ritual of self-comfort.",
    path: "/memories",
    siteName: content.site.name,
  });
}

/**
 * Renders the memory jar experience page.
 * @example <MemoriesPage /> for /memories
 */
export default async function MemoriesPage() {
  const content = toPublicContent(await loadContent());
  return (
    <PageShell content={content}>
      <MemoryJarExperience content={content} />
    </PageShell>
  );
}
