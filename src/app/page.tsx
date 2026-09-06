import type { Metadata } from "next";
import { Site } from "@/components/Site";
import { loadContent } from "@/content/store";
import { toPublicContent } from "@/content/types";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const content = await loadContent();
  return buildPageMetadata({
    title: content.site.title,
    description: content.site.description,
    path: "/",
    siteName: content.site.name,
  });
}

export default async function Home() {
  const content = toPublicContent(await loadContent());
  return <Site content={content} />;
}
