"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { seasonOrnamentImageUrl } from "@/content/seasons";

/**
 * Corner ornament images for the active season. Clicks pass through.
 * The admin shell skips them; the preview iframe opts in.
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
  return (
    <div className={`season-layer season-layer--${season}`} aria-hidden="true">
      {photos.map((src, index) => (
        <Photo key={`${src}-${index}`} src={src} index={index} />
      ))}
    </div>
  );
}

/**
 * One uploaded corner image. A broken address is removed from the layer.
 * @example <Photo src="/uploads/artifacts/bat.png" index={0} />
 */
function Photo({ src, index }: { src: string; index: number }) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  const slot = index % 8;
  return (
    <span className={`season-ornament season-ornament--photo season-ornament--p${slot}`}>
      {/* Addresses may be any https host the editor accepted. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" decoding="async" onError={() => setHidden(true)} />
    </span>
  );
}
