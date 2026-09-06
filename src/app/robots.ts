import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/site-url";

/**
 * Builds robots.txt rules allowing public pages and blocking /admin and /api.
 * @example robots() // MetadataRoute.Robots
 */
export default function robots(): MetadataRoute.Robots {
  const origin = siteOrigin();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/", "/api"],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
  };
}
