"use client";

// External dependencies
import { useEffect, useState } from "react";
import { motion, useMotionValue, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";

import { DEFAULT_CURSOR, type CursorStyle } from "@/content/cursor";
import { CursorFollower, CursorMark } from "./cursor-trails";

const hoverSel = "a, button, [role='button'], summary, .card-surface, .btn-primary";
const textSel = "input, textarea, select, [contenteditable='true']";

/**
 * Renders the brand pointer and the CMS-selected follower.
 * @example <Cursor style="dots" />
 */
export function Cursor({ style = DEFAULT_CURSOR.style }: { style?: CursorStyle }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [hover, setHover] = useState(false);
  const [text, setText] = useState(false);
  const [down, setDown] = useState(false);
  const isJarPage = pathname?.startsWith("/memories") || pathname === "/memory-jar";
  const x = useMotionValue(-80);
  const y = useMotionValue(-80);
  const follower = style === "none" || style === "glow" ? null : style;

  useEffect(() => {
    if (reduce || isJarPage) {
      document.documentElement.classList.remove("has-custom-cursor", "cursor-text-field");
      return;
    }
    const mq = window.matchMedia("(pointer: fine) and (hover: hover)");
    /**
     * Enables the custom cursor class on <html>.
     * @example enable() // has-custom-cursor
     */
    const enable = () => document.documentElement.classList.add("has-custom-cursor");
    /**
     * Removes custom cursor classes from <html>.
     * @example disable() // default cursor
     */
    const disable = () => {
      document.documentElement.classList.remove("has-custom-cursor", "cursor-text-field");
    };
    if (mq.matches) enable();
    /**
     * Toggles cursor enablement when pointer media query changes.
     * @example onMq() // enable|disable
     */
    const onMq = () => (mq.matches ? enable() : disable());

    /**
     * Tracks pointer position for the custom cursor.
     * @example move(mouseEvent) // x/y set
     */
    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    /**
     * Updates hover/text cursor modes from the event target.
     * @example over(mouseEvent) // hover state
     */
    const over = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      const onText = Boolean(el?.closest(textSel));
      setText(onText);
      setHover(!onText && Boolean(el?.closest(hoverSel)));
      document.documentElement.classList.toggle("cursor-text-field", onText);
    };
    /**
     * Marks the pointer as pressed.
     * @example downH() // down true
     */
    const downH = () => setDown(true);
    /**
     * Marks the pointer as released.
     * @example upH() // down false
     */
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
      {follower ? (
        <CursorFollower style={follower} x={x} y={y} hidden={text} hover={hover} />
      ) : null}
      <motion.div
        aria-hidden
        className={`cursor-pointer${hover ? " is-hover" : ""}${style === "glow" ? " is-glow" : ""}`}
        style={{ x, y, opacity: text ? 0 : 1 }}
        animate={{ scale: down ? 0.82 : hover ? 1.12 : 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 26 }}
      >
        <CursorMark />
      </motion.div>
    </>
  );
}
