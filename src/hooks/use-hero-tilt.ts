"use client";

import { useRef, type PointerEvent } from "react";

/**
 * Perspective tilt for interactive hero stages. No-ops when reduced motion is on.
 */
export function useHeroTilt(reduce: boolean | null) {
  const stage = useRef<HTMLDivElement>(null);

  function onMove(e: PointerEvent<HTMLDivElement>) {
    if (reduce) return;
    const el = stage.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const nx = (e.clientX - box.left) / box.width - 0.5;
    const ny = (e.clientY - box.top) / box.height - 0.5;
    el.style.transform = `perspective(1400px) rotateX(${(ny * -7).toFixed(2)}deg) rotateY(${(nx * 9).toFixed(2)}deg)`;
  }

  function onLeave() {
    if (stage.current) stage.current.style.transform = "";
  }

  return { stage, onMove, onLeave };
}
