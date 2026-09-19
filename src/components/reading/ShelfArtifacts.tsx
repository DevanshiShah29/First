import type { CSSProperties } from "react";

type ShelfArtifactView = {
  imageUrl: string;
  widthRem: number;
  heightRem: number;
  name?: string;
  /** CSS length for `left` (prefer rem so X matches rem-sized stacks). */
  leftCss?: string;
  xPercent?: number;
  yPercent?: number;
};

/**
 * Shelf ornament — free-placed when left/y are set.
 * @example <ShelfArtifact artifact={item} />
 */
export function ShelfArtifact({ artifact }: { artifact: ShelfArtifactView }) {
  const leftCss =
    artifact.leftCss ??
    (artifact.xPercent != null && Number.isFinite(artifact.xPercent)
      ? `${artifact.xPercent}%`
      : null);
  const free =
    leftCss != null &&
    artifact.yPercent != null &&
    Number.isFinite(artifact.yPercent);

  const style = {
    "--artifact-w": `${artifact.widthRem}rem`,
    "--artifact-h": `${artifact.heightRem}rem`,
    ...(free
      ? {
          "--artifact-x": leftCss,
          "--artifact-y": `${artifact.yPercent}%`,
        }
      : {}),
  } as CSSProperties;

  return (
    <div
      className={`bookshelf-artifact${free ? " is-free" : " is-inline"}`}
      style={style}
      title={artifact.name}
      aria-hidden
    >
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
