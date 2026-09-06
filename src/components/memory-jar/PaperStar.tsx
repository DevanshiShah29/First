import type { CSSProperties } from "react";
import Image from "next/image";
import { JAR_ASSETS, type StarColor } from "@/lib/memory-jar";

interface PaperStarProps {
  color: StarColor;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

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
  return (
    <Image
      src={JAR_ASSETS.star(color)}
      alt=""
      width={size}
      height={Math.round(size * 0.67)}
      className={`paper-star ${className}`}
      style={style}
      draggable={false}
    />
  );
}
