import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { CraftView } from "@/components/craft/CraftView";
import { loadContent } from "@/content/store";
import { EMPTY_CRAFT, isPublished, sectionEnabled, toPublicContent } from "@/content/types";
import { buildPageMetadata } from "@/lib/seo";

/** Saved drafts must leave /craft on the next request. */
export const dynamic = "force-dynamic";

/**
 * Builds craft page metadata from CMS craft fields.
 * @example generateMetadata() // Metadata
 */
export async function generateMetadata(): Promise<Metadata> {
  const content = await loadContent();
  if (!sectionEnabled(content.site.sections, "craft")) notFound();
  if (content.craft && !isPublished(content.craft.status)) notFound();
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
  const full = await loadContent();
  if (!sectionEnabled(full.site.sections, "craft")) notFound();
  if (full.craft && !isPublished(full.craft.status)) notFound();
  const content = toPublicContent(full);
  const craft = content.craft ?? EMPTY_CRAFT;

  return (
    <PageShell content={content}>
      <CraftView
        craft={craft}
        showAboutLink={sectionEnabled(content.site.sections, "about")}
        showContactLink={sectionEnabled(content.site.sections, "contact")}
      />
    </PageShell>
  );
}
