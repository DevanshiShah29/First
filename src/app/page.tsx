import type { Metadata } from "next";
import { Site } from "@/components/Site";
import { loadContent } from "@/content/store";
import { toPublicContent } from "@/content/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const content = await loadContent();
  return {
    title: content.site.title,
    description: content.site.description,
  };
}

export default async function Home() {
  const content = toPublicContent(await loadContent());
  return <Site content={content} />;
}
