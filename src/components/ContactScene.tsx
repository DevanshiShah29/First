"use client";

// External dependencies
import { useEffect, useRef, useState, type PointerEvent } from "react";

// Application services & types
import type { ContactMedia } from "@/content/types";
import { createVisibilityGate } from "@/hooks/active-loop";
import { useReducedMotion } from "@/hooks/reduced-motion";
import { parsePlayableMedia } from "@/lib/media-url";

// UI components
import { MediaImage } from "@/components/MediaImage";

/**
 * Renders the decorative tilting contact card scene.
 * @example <ContactScene />
 */
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

    /**
     * Cancels the tilt RAF loop and clears live classes.
     * @example stop() // idle scene
     */
    const stop = () => {
      if (raf) window.cancelAnimationFrame(raf);
      raf = 0;
      el.classList.remove("is-tilting");
      host.classList.remove("is-live");
    };

    /**
     * Advances idle/pointer tilt interpolation each frame.
     * @example tick(now) // updated transform
     */
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

    /**
     * Starts the tilt RAF loop when the scene is visible.
     * @example start() // is-tilting
     */
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

  /**
   * Maps pointer position to tilt targets.
   * @example tiltFromEvent(pointerEvent) // target rotation
   */
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
      }}>
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

/**
 * Renders CMS image or video in the contact card media slot.
 * @example <ContactMediaFrame media={site.contactMedia} />
 */
export function ContactMediaFrame({ media }: { media: ContactMedia }) {
  const reduce = useReducedMotion();
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const playable = parsePlayableMedia(
    media.url,
    media.kind === "image" ? "image" : "video",
  );
  const alt = media.alt.trim();
  const failed = failedUrl === media.url;

  if (failed || playable.type === "unsupported") return <ContactScene />;

  if (playable.type === "iframe") {
    const src = reduce
      ? playable.src
          .replace(/autoplay=1/g, "autoplay=0")
          .replace(/controls=0/g, "controls=1")
      : playable.src;
    return (
      <div className="contact-media">
        <iframe
          src={src}
          className="contact-media-frame"
          title={alt || "Contact video"}
          allow={`${reduce ? "" : "autoplay; "}encrypted-media; picture-in-picture`}
          allowFullScreen
        />
      </div>
    );
  }

  if (playable.type === "file" && playable.kind === "video") {
    return (
      <div className="contact-media">
        <video
          className="contact-media-frame"
          src={playable.src}
          onError={() => setFailedUrl(media.url)}
          autoPlay={!reduce}
          muted
          loop
          playsInline
          controls={reduce}
          title={alt || "Contact video"}
        />
      </div>
    );
  }

  if (playable.type === "file") {
    return (
      <div className="contact-media">
        <MediaImage
          src={playable.src}
          alt={alt}
          width={1600}
          height={1000}
          unoptimized
          className="contact-media-frame"
          sizes="(max-width: 768px) 100vw, 40vw"
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
          onError={() => setFailedUrl(media.url)}
        />
      </div>
    );
  }

  return <ContactScene />;
}
