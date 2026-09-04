"use client";

import { motion, useReducedMotion, type Transition } from "motion/react";
import type { ReactNode } from "react";

export type FadeProps = {
  children: ReactNode;
  className?: string;
  y?: number;
  x?: number;
  delay?: number;
  duration?: number;
  ease?: Transition["ease"];
  amount?: number | "some" | "all";
  margin?: string;
  once?: boolean;
  scale?: number;
};

const dosFeEase: Transition["ease"] = [0.4, 0, 0.2, 1];

export function Fade({
  children,
  className,
  y = 28,
  x = 0,
  delay = 0,
  duration = 0.5,
  ease = dosFeEase,
  // "some" = any pixel visible. A fractional amount fails on tall
  // sections (e.g. the Reading "Read" shelf) when N% of height exceeds the viewport.
  amount = "some",
  margin = "0px 0px -24px 0px",
  once = true,
  scale,
}: FadeProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  const initialProps: Record<string, number> = {
    opacity: 0,
    y,
    x,
  };

  const inViewProps: Record<string, number> = {
    opacity: 1,
    y: 0,
    x: 0,
  };

  if (typeof scale === "number") {
    initialProps.scale = scale;
    inViewProps.scale = 1;
  }

  return (
    <motion.div
      className={className}
      initial={initialProps}
      whileInView={inViewProps}
      viewport={{ once, amount, margin }}
      transition={{
        duration,
        delay,
        ease,
      }}
    >
      {children}
    </motion.div>
  );
}
