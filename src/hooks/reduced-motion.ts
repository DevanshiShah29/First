"use client";

// External dependencies
import { useEffect, useState } from "react";

/**
 * Tracks prefers-reduced-motion without pulling in Motion.
 * @example useReducedMotion() // false
 */
export function useReducedMotion() {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    /**
     * Copies the media-query match into state.
     * @example sync() // void
     */
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return reduce;
}
