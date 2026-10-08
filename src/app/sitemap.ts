import type { MetadataRoute } from "next";
import { loadContent } from "@/content/store";
import { sectionEnabled, toPublicContent } from "@/content/types";
import { siteOrigin } from "@/lib/site-url";

/** A drafted /craft page must drop out of the sitemap on the next request. */
export const dynamic = "force-dynamic";

/**
 * Builds the public sitemap including craft when published.
 * @example sitemap() // MetadataRoute.Sitemap
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin();
  const now = new Date();
  const content = toPublicContent(await loadContent());
  const craft = content.craft;
  const craftPublished = Boolean(
    craft?.title?.trim() || craft?.intro?.trim() || (craft?.groups?.length ?? 0) > 0,
  );

  const entries: MetadataRoute.Sitemap = [
    {
      url: origin,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  if (sectionEnabled(content.site.sections, "reading")) {
    entries.push({
      url: `${origin}/reading`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  if (sectionEnabled(content.site.sections, "memories")) {
    entries.push({
      url: `${origin}/memories`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  if (craftPublished && sectionEnabled(content.site.sections, "craft")) {
    entries.push({
      url: `${origin}/craft`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  return entries;
}
