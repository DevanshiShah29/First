import type { CSSProperties } from "react";
import { JAR_ASSETS, type StarColor } from "@/lib/memory-jar";

interface PaperStarProps {
  color: StarColor;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export function PaperStar({
  color,
  size = 32,
  className = "",
  style,
}: PaperStarProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
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
