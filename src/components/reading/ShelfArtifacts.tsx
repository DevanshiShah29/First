import type { CSSProperties } from "react";
import type { ShelfArtifactItem } from "@/content/types";

/**
 * Absolutely positioned shelf ornament on the bookshelf room.
 * @example <ShelfArtifact artifact={item} />
 */
export function ShelfArtifact({ artifact }: { artifact: ShelfArtifactItem }) {
  const style = {
    "--artifact-w": `${artifact.widthRem}rem`,
    "--artifact-h": `${artifact.heightRem}rem`,
    "--artifact-x": `${artifact.xPercent ?? 0}%`,
    "--artifact-y": `${artifact.yPercent ?? 0}%`,
  } as CSSProperties;

  return (
    <div className="bookshelf-artifact" style={style} aria-hidden>
      {/* Decorative CMS or seeded asset. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={artifact.imageUrl}
        alt=""
        className="bookshelf-artifact-img"
        draggable={false}
      />
    </div>
  );
}
