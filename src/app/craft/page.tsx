import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { CraftView } from "@/components/craft/CraftView";
import { loadContent } from "@/content/store";
import { EMPTY_CRAFT, toPublicContent } from "@/content/types";
import { buildPageMetadata } from "@/lib/seo";

/**
 * Builds craft page metadata from CMS craft fields.
 * @example generateMetadata() // Metadata
 */
export async function generateMetadata(): Promise<Metadata> {
  const content = await loadContent();
  const craft = content.craft ?? EMPTY_CRAFT;
  const title = craft.title.trim() || "Craft";
  const description =
    craft.intro.trim() ||
    craft.footnote.trim() ||
    `Engineering notes from ${content.site.name}.`;
  return buildPageMetadata({
    title: `${title} | ${content.site.name}`,
    description,
    path: "/craft",
    siteName: content.site.name,
  });
}

/**
 * Renders the craft notes page.
 * @example <CraftPage /> default export for /craft
 */
export default async function CraftPage() {
  const content = toPublicContent(await loadContent());
  const craft = content.craft ?? EMPTY_CRAFT;

  return (
    <PageShell content={content}>
      <CraftView craft={craft} />
    </PageShell>
  );
}
