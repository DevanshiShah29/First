"use client";

// External dependencies
import { useEffect, useState } from "react";

/**
 * Dynamically size the jar container based on viewport dimensions.
 */
export function useJarSize(base = 440) {
  const [size, setSize] = useState(base);

  useEffect(() => {
    function measure() {
      const width = window.visualViewport?.width ?? window.innerWidth;
      const height = window.visualViewport?.height ?? window.innerHeight;
      if (width >= 640) {
        setSize(base);
        return;
      }
      const capped = (height - 80) / 1.3;
      setSize(Math.max(320, Math.floor(Math.min(base, capped))));
    }
    measure();
    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
    };
  }, [base]);

  return size;
}
