"use client";

import Image from "next/image";
import type { MemoryItem } from "@/content/types";
import {
  JAR_ASSETS,
  JAR_STAR_BOUNDS,
  resolveStarColor,
  type StarColor,
} from "@/lib/memory-jar";
import { useReducedMotion } from "@/hooks/reduced-motion";
import { PaperStar } from "./PaperStar";

interface MasonJarProps {
  memories: MemoryItem[];
  jiggling: boolean;
  floating: boolean;
  onTap: () => void;
  size: number;
  hiddenMemoryId?: string | null;
  risingColor?: StarColor;
  showRising?: boolean;
}

export function MasonJar({
  memories,
  jiggling,
  floating,
  onTap,
  size,
  hiddenMemoryId,
  risingColor,
  showRising,
}: MasonJarProps) {
  const reduce = useReducedMotion();
  const visible = memories.slice(-Math.min(memories.length, 24)).filter((m) => m.id !== hiddenMemoryId);
  const width = size;
  const height = size * 1.3;
  const areaW = ((JAR_STAR_BOUNDS.right - JAR_STAR_BOUNDS.left) / 100) * width;
  const areaH = ((JAR_STAR_BOUNDS.bottom - JAR_STAR_BOUNDS.top) / 100) * height;
  const riseSize = Math.max(40, Math.round(size * 0.108));

  const stars = visible.map((mem) => {
    const color = resolveStarColor(mem.color, mem.id);
    const t = mem.id.charCodeAt(0) + mem.id.charCodeAt(mem.id.length - 1);
    const starSize = Math.round(size * 0.082) + (t % Math.round(size * 0.038));
    const pad = starSize * 0.55 + 12;
    const maxX = Math.max(pad, areaW - pad);
    const maxY = Math.max(pad, areaH - pad);
    const leftPct = ((pad + ((t * 37) % 997) / 997 * (maxX - pad)) / areaW) * 100;
    const topPct = ((pad + ((t * 53) % 991) / 991 * (maxY - pad)) / areaH) * 100;
    const delay = (t % 40) / 10;
    const dur = 4.5 + (t % 20) / 10;
    const drift = ["animate-paper-drift-a", "animate-paper-drift-b", "animate-paper-drift-c"][t % 3];
    return { id: mem.id, leftPct, topPct, size: starSize, delay, dur, drift, color };
  });

  const motionClass = jiggling && !reduce
    ? "animate-jar-stir"
    : floating && !reduce
      ? "animate-float-gentle"
      : "";

  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={memories.length > 0 ? "tap the jar to open" : "your jar"}
      className={`relative inline-block btn-bare jar-btn ${motionClass}`}
      style={{ width, height }}
      disabled={memories.length === 0 || jiggling}
    >
      <div className="absolute inset-0">
        <Image
          src={JAR_ASSETS.masonJar}
          alt=""
          width={1024}
          height={1024}
          priority
          draggable={false}
          className="jar-photo jar-photo--light relative h-full w-full select-none object-contain"
        />
        <Image
          src={JAR_ASSETS.masonJarDark}
          alt=""
          width={1024}
          height={1024}
          priority
          draggable={false}
          className="jar-photo jar-photo--dark absolute inset-0 h-full w-full select-none object-contain"
        />
        {/* Dark interior wash below the lid; stars sit above it */}
        <div
          aria-hidden
          className="jar-interior-shade absolute pointer-events-none"
          style={{
            left: `${JAR_STAR_BOUNDS.left}%`,
            right: `${100 - JAR_STAR_BOUNDS.right}%`,
            top: `${JAR_STAR_BOUNDS.top}%`,
            bottom: `${100 - JAR_STAR_BOUNDS.bottom}%`,
          }}
        />
        <div
          aria-hidden
          className="jar-inner-stars absolute pointer-events-none"
          style={{
            left: `${JAR_STAR_BOUNDS.left}%`,
            right: `${100 - JAR_STAR_BOUNDS.right}%`,
            top: `${JAR_STAR_BOUNDS.top}%`,
            bottom: `${100 - JAR_STAR_BOUNDS.bottom}%`,
          }}
        >
          {stars.map((star) => (
            <span
              key={star.id}
              className="absolute"
              style={{
                left: `${star.leftPct}%`,
                top: `${star.topPct}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <span
                className={reduce ? undefined : star.drift}
                style={{ display: "inline-block", animationDelay: `${star.delay}s` }}
              >
                <PaperStar
                  size={star.size}
                  color={star.color}
                  style={{
                    animationDelay: `${star.delay}s`,
                    animationDuration: `${star.dur}s`,
                  }}
                />
              </span>
            </span>
          ))}
        </div>
      </div>

      {showRising && risingColor ? (
        <span
          aria-hidden
          className="jar-orb animate-orb-rise"
          style={{ marginLeft: -riseSize / 2, marginTop: -riseSize / 2 }}
        >
          <PaperStar size={riseSize} color={risingColor} />
        </span>
      ) : null}

      <span aria-hidden className="absolute top-8 -left-1 text-lg text-lavender/70 animate-twinkle-slow">
        ✦
      </span>
      <span
        aria-hidden
        className="absolute top-20 -right-2 text-xs text-lavender/60 animate-twinkle-slow"
        style={{ animationDelay: "1.2s" }}
      >
        ✦
      </span>
      <span
        aria-hidden
        className="absolute bottom-14 -left-3 text-sm text-lavender/50 animate-twinkle-slow"
        style={{ animationDelay: "2.4s" }}
      >
        ✦
      </span>
    </button>
  );
}
