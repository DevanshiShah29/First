"use client";

import { useEffect, useState, type RefObject } from "react";
import { coverHitmap, type Hitmap } from "./studio-spots";

export function useStudioHitmap(
  stage: RefObject<HTMLDivElement | null>,
  artRef: RefObject<HTMLImageElement | null>,
) {
  const [hitmap, setHitmap] = useState<Hitmap | null>(null);

  /**
   * Recalculates hotspot hitmap from art natural size.
   * @example syncHitmap() // setHitmap(...)
   */
  function syncHitmap() {
    const img = artRef.current;
    const host = stage.current;
    if (!img || !host || !img.naturalWidth || !img.naturalHeight) return;
    const box = host.getBoundingClientRect();
    const mobile = window.matchMedia("(max-width: 720px)").matches;
    // Matches .world-hero.is-studio .world-art object-position
    const posY = mobile ? 0.42 : 0.48;
    setHitmap(coverHitmap(img.naturalWidth, img.naturalHeight, box.width, box.height, 0.5, posY));
  }

  useEffect(() => {
    syncHitmap();
    const host = stage.current;
    const img = artRef.current;
    if (!host) return;
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => syncHitmap()) : null;
    ro?.observe(host);
    /**
     * Resyncs hitmap on window resize.
     * @example onResize() // syncHitmap()
     */
    const onResize = () => syncHitmap();
    window.addEventListener("resize", onResize);
    img?.addEventListener("load", syncHitmap);
    const mq = window.matchMedia("(max-width: 720px)");
    /**
     * Resyncs hitmap when crossing the mobile breakpoint.
     * @example onMq() // syncHitmap()
     */
    const onMq = () => syncHitmap();
    mq.addEventListener("change", onMq);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", onResize);
      img?.removeEventListener("load", syncHitmap);
      mq.removeEventListener("change", onMq);
    };
  }, []);

  return { hitmap, syncHitmap };
}
