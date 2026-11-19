"use client";

// External dependencies
import { getImageProps } from "next/image";

// Application services & types
import type { HeroMedia } from "@/content/types";
import { useReducedMotion } from "@/hooks/reduced-motion";
import { parsePlayableMedia } from "@/lib/media-url";
import { CURATED_HERO_ARTWORKS } from "./hero-overlay";

// UI components
import { MediaImage } from "@/components/MediaImage";

interface HeroMediaViewProps {
  media: HeroMedia;
  className?: string;
  alt: string;
  decorative?: boolean;
}

/**
 * True when hero media has a usable URL.
 * @example hasMedia({ kind: "image", url: "/a.jpg" }) // true
 */
export function hasMedia(media: HeroMedia): boolean {
  return media.kind !== "none" && media.url.trim().length > 0;
}

/**
 * Renders hero image, video, or iframe media.
 * @example <HeroMediaView media={media} alt="Portrait" />
 */
export function HeroMediaView({
  media,
  className,
  alt,
  decorative,
}: HeroMediaViewProps) {
  const reduce = useReducedMotion();
  const playable = parsePlayableMedia(media.url, media.kind === "image" ? "image" : "video");

  if (playable.type === "iframe") {
    const src = reduce
      ? playable.src.replace(/autoplay=1/g, "autoplay=0").replace(/controls=0/g, "controls=1")
      : playable.src;
    return (
      <iframe
        src={src}
        className={`${className ?? ""} border-0`}
        title={alt || "Hero video"}
        allow={`${reduce ? "" : "autoplay; "}encrypted-media; picture-in-picture`}
        allowFullScreen
      />
    );
  }

  if (playable.type === "file" && playable.kind === "video") {
    return (
      <video
        className={className}
        src={playable.src}
        autoPlay={!reduce}
        muted
        loop
        playsInline
        controls
        title={alt || "Hero video"}
      />
    );
  }

  if (playable.type === "file") {
    const artwork = CURATED_HERO_ARTWORKS.find(
      (a) =>
        playable.src === a.desktopSrc ||
        playable.src.includes(a.desktopSrc) ||
        playable.src.endsWith(a.desktopSrc) ||
        (a.id === "editorial-3d" && playable.src.includes("hero-desktop.jpg")),
    );
    if (artwork) {
      const isBg = media.place === "background";
      const common = {
        alt: decorative ? "" : alt,
        sizes: isBg ? "100vw" : "(max-width: 768px) 100vw, 50vw",
        priority: true,
        quality: 92,
      };

      const {
        props: { srcSet: desktopSrcSet, ...desktopRest },
      } = getImageProps({
        ...common,
        src: artwork.desktopSrc,
        width: artwork.width,
        height: artwork.height,
      });

      const {
        props: { srcSet: mobileSrcSet },
      } = getImageProps({
        ...common,
        src: artwork.mobileSrc,
        width: artwork.mobileWidth,
        height: artwork.mobileHeight,
      });

      return (
        <picture className="block h-full w-full">
          <source media="(max-width: 768px)" srcSet={mobileSrcSet} sizes={common.sizes} />
          <source media="(min-width: 769px)" srcSet={desktopSrcSet} sizes={common.sizes} />
          <img
            {...desktopRest}
            className={className}
            alt={decorative ? "" : alt}
            loading="eager"
            decoding="async"
          />
        </picture>
      );
    }

    return (
      <MediaImage
        src={playable.src}
        alt={decorative ? "" : alt}
        className={className}
        width={1200}
        height={900}
        sizes={media.place === "background" ? "100vw" : "(max-width: 768px) 100vw, 50vw"}
        priority={media.place === "background"}
      />
    );
  }

  return <div className={className} />;
}
