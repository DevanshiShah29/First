import type { Metadata } from "next";
import { MemoryJarExperience } from "@/components/MemoryJarExperience";
import { PageShell } from "@/components/PageShell";
import { loadContent } from "@/content/store";
import { toPublicContent } from "@/content/types";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const content = await loadContent();
  return {
    ...buildPageMetadata({
      title: `a little jar of stars | ${content.site.name}`,
      description:
        "Tuck away tiny happy memories as they happen. On low days, open your jar for a random one — a small, private ritual of self-comfort.",
      path: "/memories",
      siteName: content.site.name,
    }),
    themeColor: "#FBF4EA",
  };
}

export default async function MemoriesPage() {
  const content = toPublicContent(await loadContent());
  return (
    <PageShell content={content}>
      <MemoryJarExperience content={content} />
    </PageShell>
  );
}
