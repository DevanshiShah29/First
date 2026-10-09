import type { Metadata } from "next";
import { Site } from "@/components/Site";
import { loadContent } from "@/content/store";
import { toPublicContent } from "@/content/types";
import { buildPageMetadata } from "@/lib/seo";

/** Saved drafts must leave the public homepage on the next request. */
export const dynamic = "force-dynamic";

/**
 * Builds home page metadata from CMS.
 * @example generateMetadata() // Metadata
 */
export async function generateMetadata(): Promise<Metadata> {
  const content = await loadContent();
  return buildPageMetadata({
    title: content.site.title,
    description: content.site.description,
    path: "/",
    siteName: content.site.name,
  });
}

/**
 * Renders the home portfolio page.
 * @example <Home /> default export for /
 */
export default async function Home() {
  const content = toPublicContent(await loadContent());
  return <Site content={content} />;
}
