"use client";

import { useEffect, useRef, type PointerEvent } from "react";
import { createVisibilityGate } from "@/hooks/active-loop";

export function useStudioTilt(reduce: boolean) {
  const stage = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const interacting = useRef(false);
  const drag = useRef({ x: 0, y: 0, moved: false });
  const idleT = useRef(0);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    if (reduce) {
      el.style.transform = "";
      el.classList.remove("is-tilting");
      return;
    }
    let raf = 0;
    let active = true;
    let last = "";
    /**
     * Cancels the studio tilt RAF loop.
     * @example stop() // idle stage
     */
    const stop = () => {
      if (raf) window.cancelAnimationFrame(raf);
      raf = 0;
      el.classList.remove("is-tilting");
    };
    /**
     * Advances idle/pointer tilt interpolation.
     * @example tick(now) // updated transform
     */
    const tick = (now: number) => {
      if (!active) {
        raf = 0;
        return;
      }
      if (!interacting.current) {
        idleT.current = now;
        const t = now * 0.00028;
        target.current = { x: Math.sin(t) * 1.05, y: Math.cos(t * 0.82) * 1.35 };
      }
      current.current.x += (target.current.x - current.current.x) * 0.1;
      current.current.y += (target.current.y - current.current.y) * 0.1;
      const x = current.current.x;
      const y = current.current.y;
      const next = `perspective(1600px) rotateX(${x.toFixed(2)}deg) rotateY(${y.toFixed(2)}deg) translate3d(${(y * 1.4).toFixed(1)}px, ${(x * -1.2).toFixed(1)}px, 12px)`;
      if (next !== last) {
        last = next;
        el.style.transform = next;
      }
      raf = window.requestAnimationFrame(tick);
    };
    /**
     * Starts the studio tilt RAF loop.
     * @example start() // is-tilting
     */
    const start = () => {
      if (raf || !active) return;
      el.classList.add("is-tilting");
      raf = window.requestAnimationFrame(tick);
    };
    const release = createVisibilityGate(el, (visible) => {
      active = visible;
      if (visible) start();
      else stop();
    });
    return () => {
      active = false;
      stop();
      release();
    };
  }, [reduce]);

  /**
   * Maps pointer position to studio tilt targets.
   * @example tiltFromEvent(pointerEvent) // target rotation
   */
  function tiltFromEvent(e: PointerEvent<HTMLDivElement>) {
    if (reduce) return;
    const box = stage.current?.getBoundingClientRect();
    if (!box) return;
    const nx = (e.clientX - box.left) / box.width - 0.5;
    const ny = (e.clientY - box.top) / box.height - 0.5;
    const amp = e.pointerType === "touch" ? 5.6 : 4.8;
    target.current = { x: ny * -amp, y: nx * (amp + 2) };
    interacting.current = true;
  }

  /**
   * Records drag start and begins touch tilt.
   * @example onPointerDown(event) // drag.current
   */
  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    drag.current = { x: e.clientX, y: e.clientY, moved: false };
    if (e.pointerType === "touch") {
      interacting.current = true;
      tiltFromEvent(e);
    }
  }

  /**
   * Updates tilt while dragging/moving.
   * @example onPointerMove(event) // tiltFromEvent
   */
  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "touch") {
      const dx = e.clientX - drag.current.x;
      const dy = e.clientY - drag.current.y;
      if (Math.hypot(dx, dy) > 10) drag.current.moved = true;
    }
    if (e.pointerType === "touch" && !interacting.current) return;
    tiltFromEvent(e);
  }

  /**
   * Ends touch interaction and resets tilt target.
   * @example onPointerUp(event) // idle
   */
  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "touch") {
      interacting.current = false;
      target.current = { x: 0, y: 0 };
    }
  }

  /**
   * Ends mouse interaction when leaving the stage.
   * @example onPointerLeave(event) // idle
   */
  function onPointerLeave(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse") {
      interacting.current = false;
      target.current = { x: 0, y: 0 };
    }
  }

  return { stage, drag, onPointerDown, onPointerMove, onPointerUp, onPointerLeave };
}
