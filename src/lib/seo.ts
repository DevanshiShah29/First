import type { Metadata } from "next";
import { siteOrigin } from "@/lib/site-url";

export function absoluteUrl(path = "/"): string {
  const origin = siteOrigin();
  if (!path || path === "/") return origin;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Shared public-page metadata: canonical, Open Graph, Twitter. */
export function buildPageMetadata(input: {
  title: string;
  description: string;
  path?: string;
  siteName?: string;
}): Metadata {
  const path = input.path || "/";
  const url = absoluteUrl(path);
  const siteName = input.siteName?.trim() || input.title;
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      title: input.title,
      description: input.description,
      siteName,
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
    },
  };
}
