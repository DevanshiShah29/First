"use client";

// Application services & types
import { getHeroOverlayStyles, resolveHeroOverlay } from "@/components/hero/hero-overlay";
import type { HeroMedia } from "@/content/types";

/**
 * Admin-safe hero overlay. The public overlay uses Tailwind, which the CMS stylesheet does not load.
 * @example <CmsOverlay media={media} themeBg="#080808" viewport="desktop" />
 */
export function CmsOverlay({
  media,
  themeBg,
  viewport = "desktop",
}: {
  media: HeroMedia;
  themeBg?: string;
  viewport?: "desktop" | "mobile";
}) {
  const resolved = resolveHeroOverlay(media);
  if (resolved.style === "none") return null;
  const painted = getHeroOverlayStyles(media, themeBg, viewport);
  const blur = resolved.blur === "none" ? "" : ` is-blur-${resolved.blur}`;
  return <div className={`wp-media-overlay${blur}`} style={painted.style} aria-hidden />;
}
