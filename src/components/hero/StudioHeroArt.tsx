"use client";

import type { Ref } from "react";
import { getImageProps } from "next/image";

/**
 * Renders responsive studio hero art.
 * @example <StudioHeroArt artRef={ref} onLoad={syncHitmap} />
 */
export function StudioHeroArt({
  artRef,
  onLoad,
}: {
  artRef: Ref<HTMLImageElement>;
  onLoad: () => void;
}) {
  const alt =
    "Cozy 3D miniature studio centered on a woman looking at a MacBook, with a photo wall, piano, memory jar of paper stars, books, baking, plants, and a yoga corner.";
  const common = {
    alt,
    width: 3840,
    height: 2160,
    quality: 92,
    priority: true,
    sizes: "100vw",
  } as const;
  const { props: desktop } = getImageProps({ ...common, src: "/images/hero-studio.jpg" });
  const { props: mobile } = getImageProps({
    ...common,
    src: "/images/hero-studio-portrait.jpg",
    width: 2160,
    height: 3840,
  });
  return (
    <picture>
      <source media="(max-width: 720px)" srcSet={mobile.srcSet} sizes={mobile.sizes} />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- alt comes from getImageProps */}
      <img {...desktop} ref={artRef} className="world-art" onLoad={onLoad} />
    </picture>
  );
}
