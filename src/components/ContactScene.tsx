"use client";

import { useEffect, useRef, type PointerEvent } from "react";
import { createVisibilityGate } from "@/lib/active-loop";
import { useReducedMotion } from "@/lib/reduced-motion";

export function ContactScene() {
  const reduce = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  const rig = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const interacting = useRef(false);

  useEffect(() => {
    const el = rig.current;
    const host = stage.current;
    if (!el || !host) return;
    if (reduce) {
      el.style.transform = "rotateX(10deg) rotateY(-22deg)";
      host.classList.remove("is-live");
      return;
    }
    let raf = 0;
    let active = false;
    let last = "";

    const stop = () => {
      if (raf) window.cancelAnimationFrame(raf);
      raf = 0;
      el.classList.remove("is-tilting");
      host.classList.remove("is-live");
    };

    const tick = (now: number) => {
      if (!active) {
        raf = 0;
        return;
      }
      if (!interacting.current) {
        const t = now * 0.00038;
        target.current = { x: Math.sin(t) * 5.4, y: Math.cos(t * 0.82) * 7.2 };
      }
      current.current.x += (target.current.x - current.current.x) * 0.08;
      current.current.y += (target.current.y - current.current.y) * 0.08;
      const next = `rotateX(${(10 + current.current.x).toFixed(2)}deg) rotateY(${(-22 + current.current.y).toFixed(2)}deg)`;
      if (next !== last) {
        last = next;
        el.style.transform = next;
      }
      raf = window.requestAnimationFrame(tick);
    };

    const start = () => {
      if (raf || !active) return;
      host.classList.add("is-live");
      el.classList.add("is-tilting");
      raf = window.requestAnimationFrame(tick);
    };

    const release = createVisibilityGate(host, (visible) => {
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

  function tiltFromEvent(e: PointerEvent<HTMLDivElement>) {
    if (reduce) return;
    const box = stage.current?.getBoundingClientRect();
    if (!box) return;
    const nx = (e.clientX - box.left) / box.width - 0.5;
    const ny = (e.clientY - box.top) / box.height - 0.5;
    const amp = e.pointerType === "touch" ? 10 : 14;
    target.current = { x: ny * -amp, y: nx * (amp + 4) };
    interacting.current = true;
  }

  return (
    <div
      ref={stage}
      className="contact-scene"
      aria-hidden="true"
      onPointerMove={tiltFromEvent}
      onPointerLeave={() => {
        interacting.current = false;
      }}
    >
      <div className="contact-scene-glow" />
      <div className="contact-scene-glow is-alt" />
      <div ref={rig} className="contact-scene-rig">
        <div className="contact-ring contact-ring-a" />
        <div className="contact-ring contact-ring-b" />
        <div className="contact-sheet contact-sheet-back" />
        <div className="contact-sheet contact-sheet-mid" />
        <div className="contact-sheet contact-sheet-front">
          <span className="contact-sheet-brand" />
          <span className="contact-sheet-chip"></span>
          <span className="contact-sheet-line" />
          <span className="contact-sheet-line is-short" />
          <span className="contact-sheet-line" />
          <span className="contact-sheet-line is-mid" />
          <span className="contact-sheet-line is-short" />
        </div>
        <span className="contact-node contact-node-a" />
        <span className="contact-node contact-node-b" />
        <span className="contact-node contact-node-c" />
      </div>
    </div>
  );
}
