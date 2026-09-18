import type { CSSProperties } from "react";
import Image from "next/image";
import { JAR_ASSETS, type StarColor } from "@/lib/memory-jar";

interface PaperStarProps {
  color: StarColor;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

/** Intrinsic star PNG ratio (512×341). */
const STAR_ASPECT = 341 / 512;

/**
 * Renders a colored paper-star image.
 * @example <PaperStar color="yellow" size={32} />
 */
export function PaperStar({
  color,
  size = 32,
  className = "",
  style,
}: PaperStarProps) {
  const height = Math.round(size * STAR_ASPECT);
  return (
    <Image
      src={JAR_ASSETS.star(color)}
      alt=""
      width={size}
      height={height}
      className={`paper-star ${className}`}
      style={{ width: size, height, ...style }}
      draggable={false}
    />
  );
}
