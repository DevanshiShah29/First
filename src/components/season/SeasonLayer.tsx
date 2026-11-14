"use client";

import { usePathname } from "next/navigation";
import { useState, type CSSProperties } from "react";
import { motifFor, ornamentSpots, spotStyle, type OrnamentSpot } from "@/content/season-layout";
import { seasonOrnamentImageUrl } from "@/content/seasons";

/**
 * Ornament images for the active season, placed on that festival's edge.
 * Clicks pass through. The admin shell skips them; the preview iframe opts in.
 * @example <SeasonLayer season="diwali" images={["/uploads/artifacts/diya.png"]} placement="preview" />
 */
export function SeasonLayer({
  season,
  images = [],
  placement = "site",
}: {
  season: string;
  images?: string[];
  placement?: "site" | "preview";
}) {
  const pathname = usePathname();
  if (placement === "site" && pathname.startsWith("/admin")) return null;
  const photos = images
    .map((src) => seasonOrnamentImageUrl(src))
    .filter((src): src is string => Boolean(src));
  if (!photos.length) return null;
  const motif = motifFor(season);
  const spots = ornamentSpots(season, photos.length);
  return (
    <div className={`season-layer season-layer--motif-${motif}`} data-motif={motif} aria-hidden="true">
      {photos.map((src, index) => (
        <Photo key={`${src}-${index}`} src={src} spot={spots[index]} />
      ))}
    </div>
  );
}

/**
 * One uploaded ornament. A broken address is removed from the layer.
 * @example <Photo src="/uploads/artifacts/bat.png" spot={spot} />
 */
function Photo({ src, spot }: { src: string; spot: OrnamentSpot | undefined }) {
  const [hidden, setHidden] = useState(false);
  if (hidden || !spot) return null;
  return (
    <span
      className={`season-ornament season-ornament--photo season-ornament--${spot.size} season-ornament--${spot.motion}${spot.quiet ? " is-quiet" : ""}`}
      style={spotStyle(spot) as CSSProperties}
    >
      {/* Addresses may be any https host the editor accepted. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" decoding="async" onError={() => setHidden(true)} />
    </span>
  );
}
