"use client";

import { motion, useSpring, type MotionValue } from "motion/react";
import type { CursorStyle } from "@/content/cursor";

const shadowSpring = { stiffness: 180, damping: 22, mass: 0.4 };
const nearSpring = { stiffness: 420, damping: 32, mass: 0.25 };
const midSpring = { stiffness: 260, damping: 28, mass: 0.35 };
const farSpring = { stiffness: 160, damping: 24, mass: 0.45 };

type PointProps = {
  x: MotionValue<number>;
  y: MotionValue<number>;
  hidden: boolean;
  hover: boolean;
};

/**
 * Brand arrow used for the pointer and the lagging echo.
 * @example <CursorMark />
 */
export function CursorMark({ gradientId = "cursor-fill" }: { gradientId?: string }) {
  return (
    <svg viewBox="0 0 32 32" width="22" height="22" fill="none">
      <defs>
        <linearGradient id={gradientId} x1="6" y1="2" x2="24" y2="28">
          <stop offset="0%" stopColor="var(--brand-from, #7c3aed)" />
          <stop offset="100%" stopColor="var(--brand-to, #6366f1)" />
        </linearGradient>
      </defs>
      <path
        d="M5 3.2 27.2 15.1c.9.5.8 1.8-.2 2.1l-8.2 2.5-2.5 8.2c-.3 1-1.6 1.1-2.1.2L5 3.2Z"
        fill={`url(#${gradientId})`}
        stroke="var(--background)"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Soft blurred disc that lags behind the pointer.
 * @example <ShadowTrail x={x} y={y} hidden={false} hover={false} />
 */
function ShadowTrail({ x, y, hidden, hover }: PointProps) {
  const trailX = useSpring(x, shadowSpring);
  const trailY = useSpring(y, shadowSpring);
  return (
    <motion.div
      aria-hidden
      className="cursor-trail is-shadow"
      style={{ x: trailX, y: trailY, opacity: hidden ? 0 : hover ? 0.55 : 0.28 }}
    />
  );
}

/**
 * Thin circle that lags behind the pointer and grows on hover.
 * @example <RingTrail x={x} y={y} hidden={false} hover />
 */
function RingTrail({ x, y, hidden, hover }: PointProps) {
  const trailX = useSpring(x, shadowSpring);
  const trailY = useSpring(y, shadowSpring);
  return (
    <motion.div
      aria-hidden
      className="cursor-trail is-ring"
      style={{ x: trailX, y: trailY, opacity: hidden ? 0 : hover ? 1 : 0.72 }}
      animate={{ scale: hover ? 1.18 : 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
    />
  );
}

/**
 * Three brand dots that follow at different speeds.
 * @example <DotTrail x={x} y={y} hidden={false} hover={false} />
 */
function DotTrail({ x, y, hidden }: PointProps) {
  const nearX = useSpring(x, nearSpring);
  const nearY = useSpring(y, nearSpring);
  const midX = useSpring(x, midSpring);
  const midY = useSpring(y, midSpring);
  const farX = useSpring(x, farSpring);
  const farY = useSpring(y, farSpring);
  const dots = [
    { x: nearX, y: nearY, className: "cursor-trail", opacity: 0.95 },
    { x: midX, y: midY, className: "cursor-trail is-mid", opacity: 0.8 },
    { x: farX, y: farY, className: "cursor-trail is-far", opacity: 0.62 },
  ];
  return (
    <>
      {dots.map((dot) => (
        <motion.div
          key={dot.className}
          aria-hidden
          className={dot.className}
          style={{ x: dot.x, y: dot.y, opacity: hidden ? 0 : dot.opacity }}
        />
      ))}
    </>
  );
}

/**
 * Fainter arrow that lags behind the real pointer.
 * @example <EchoTrail x={x} y={y} hidden={false} hover={false} />
 */
function EchoTrail({
  x,
  y,
  hidden,
  ornament,
}: PointProps & { ornament?: string | null }) {
  const trailX = useSpring(x, shadowSpring);
  const trailY = useSpring(y, shadowSpring);
  return (
    <motion.div
      aria-hidden
      className={`cursor-pointer is-echo${ornament ? " is-ornament" : ""}`}
      style={{ x: trailX, y: trailY, opacity: hidden ? 0 : 0.35 }}
    >
      {ornament ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ornament} alt="" decoding="async" />
      ) : (
        <CursorMark gradientId="cursor-echo-fill" />
      )}
    </motion.div>
  );
}

type FollowerStyle = Exclude<CursorStyle, "none" | "glow">;

/**
 * Renders the follower for the active cursor style.
 * @example <CursorFollower style="dots" x={x} y={y} hidden={false} hover={false} />
 */
export function CursorFollower({
  style,
  ornament,
  ...point
}: PointProps & { style: FollowerStyle; ornament?: string | null }) {
  if (style === "shadow") return <ShadowTrail {...point} />;
  if (style === "ring") return <RingTrail {...point} />;
  if (style === "dots") return <DotTrail {...point} />;
  return <EchoTrail {...point} ornament={ornament} />;
}
