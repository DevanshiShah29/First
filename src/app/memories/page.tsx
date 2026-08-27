import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { MemoryJarExperience } from "@/components/MemoryJarExperience";
import { loadContent } from "@/content/store";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const content = await loadContent();
  return {
    title: `Memory Jar | ${content.site.name}`,
    description: `A magical collection of personal memories, tiny joys, and milestones from ${content.site.name}.`,
  };
}

export default async function MemoriesPage() {
  const content = await loadContent();
  return (
    <PageShell content={content}>
      <MemoryJarExperience content={content} />
    </PageShell>
  );
}
