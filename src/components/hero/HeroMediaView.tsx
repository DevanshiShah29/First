"use client";

import type { HeroMedia } from "@/content/types";
import { parsePlayableMedia } from "@/lib/media-url";
import { useReducedMotion } from "@/lib/reduced-motion";

interface HeroMediaViewProps {
  media: HeroMedia;
  className?: string;
  alt: string;
  decorative?: boolean;
}

export function hasMedia(media: HeroMedia): boolean {
  return media.kind !== "none" && media.url.trim().length > 0;
}

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
    return (
      // Hero media can be a local upload or an external URL.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={playable.src} alt={decorative ? "" : alt} className={className} />
    );
  }

  return <div className={className} />;
}
