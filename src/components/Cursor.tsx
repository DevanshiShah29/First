"use client";

// External dependencies
import { useEffect, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { usePathname } from "next/navigation";

const hoverSel = "a, button, [role='button'], summary, .card-surface, .btn-primary";
const textSel = "input, textarea, select, [contenteditable='true']";

export function Cursor() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [hover, setHover] = useState(false);
  const [text, setText] = useState(false);
  const [down, setDown] = useState(false);
  const isJarPage = pathname?.startsWith("/memories") || pathname === "/memory-jar";
  const x = useMotionValue(-80);
  const y = useMotionValue(-80);
  const trailX = useSpring(x, { stiffness: 180, damping: 22, mass: 0.4 });
  const trailY = useSpring(y, { stiffness: 180, damping: 22, mass: 0.4 });

  useEffect(() => {
    if (reduce || isJarPage) {
      document.documentElement.classList.remove("has-custom-cursor", "cursor-text-field");
      return;
    }
    const mq = window.matchMedia("(pointer: fine) and (hover: hover)");
    const enable = () => document.documentElement.classList.add("has-custom-cursor");
    const disable = () => {
      document.documentElement.classList.remove("has-custom-cursor", "cursor-text-field");
    };
    if (mq.matches) enable();
    const onMq = () => (mq.matches ? enable() : disable());

    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    const over = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      const onText = Boolean(el?.closest(textSel));
      setText(onText);
      setHover(!onText && Boolean(el?.closest(hoverSel)));
      document.documentElement.classList.toggle("cursor-text-field", onText);
    };
    const downH = () => setDown(true);
    const upH = () => setDown(false);

    mq.addEventListener("change", onMq);
    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mouseover", over);
    window.addEventListener("mousedown", downH);
    window.addEventListener("mouseup", upH);
    return () => {
      disable();
      mq.removeEventListener("change", onMq);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      window.removeEventListener("mousedown", downH);
      window.removeEventListener("mouseup", upH);
    };
  }, [reduce, isJarPage, x, y]);

  // Memory jar uses its own cream star cursor via CSS.
  if (reduce || isJarPage) return null;

  return (
    <>
      <motion.div
        aria-hidden
        className="cursor-trail"
        style={{ x: trailX, y: trailY, opacity: text ? 0 : hover ? 0.55 : 0.28 }}
      />
      <motion.div
        aria-hidden
        className={`cursor-pointer${hover ? " is-hover" : ""}`}
        style={{ x, y, opacity: text ? 0 : 1 }}
        animate={{ scale: down ? 0.82 : hover ? 1.12 : 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 26 }}
      >
        <svg viewBox="0 0 32 32" width="22" height="22" fill="none">
          <defs>
            <linearGradient id="cursor-fill" x1="6" y1="2" x2="24" y2="28">
              <stop offset="0%" stopColor="var(--brand-from, #7c3aed)" />
              <stop offset="100%" stopColor="var(--brand-to, #6366f1)" />
            </linearGradient>
          </defs>
          <path
            d="M5 3.2 27.2 15.1c.9.5.8 1.8-.2 2.1l-8.2 2.5-2.5 8.2c-.3 1-1.6 1.1-2.1.2L5 3.2Z"
            fill="url(#cursor-fill)"
            stroke="var(--background)"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
    </>
  );
}
