"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type Ref,
} from "react";
import { getImageProps } from "next/image";
import { createVisibilityGate } from "@/hooks/active-loop";
import { usePianoPlayback } from "@/hooks/use-piano-playback";
import { useReducedMotion } from "@/hooks/reduced-motion";
import type { PublicSiteContent, SiteContent } from "@/content/types";
import { MiniUi, Notes } from "./fx";

type SpotId = "frames" | "jar" | "books" | "piano" | "laptop" | "cook" | "plants" | "yoga";

type Spot = { id: SpotId; label: string; left: string; top: string; w: string; h: string };

/** Percentages are relative to the studio art's visible object-fit cover box. */
const desktopSpots: Spot[] = [
  { id: "frames", label: "Photo wall", left: "1%", top: "8%", w: "15%", h: "38%" },
  { id: "plants", label: "Plants", left: "22%", top: "0%", w: "20%", h: "14%" },
  { id: "plants", label: "Plants", left: "72%", top: "0%", w: "26%", h: "16%" },
  { id: "plants", label: "Plants", left: "88%", top: "48%", w: "11%", h: "28%" },
  { id: "piano", label: "Piano", left: "13%", top: "15%", w: "20%", h: "34%" },
  { id: "books", label: "Reading", left: "12%", top: "52%", w: "13%", h: "18%" },
  { id: "jar", label: "Memory jar", left: "32%", top: "50%", w: "10%", h: "22%" },
  { id: "laptop", label: "Coding", left: "38%", top: "22%", w: "20%", h: "46%" },
  { id: "cook", label: "Baking", left: "64%", top: "38%", w: "15%", h: "24%" },
  { id: "yoga", label: "Yoga", left: "58%", top: "76%", w: "30%", h: "22%" },
];

const mobileSpots: Spot[] = [
  { id: "frames", label: "Photo wall", left: "2%", top: "2%", w: "40%", h: "26%" },
  { id: "plants", label: "Plants", left: "58%", top: "1%", w: "40%", h: "18%" },
  { id: "plants", label: "Plants", left: "0%", top: "30%", w: "14%", h: "12%" },
  { id: "piano", label: "Piano", left: "0%", top: "40%", w: "26%", h: "24%" },
  { id: "laptop", label: "Coding", left: "32%", top: "32%", w: "36%", h: "32%" },
  { id: "cook", label: "Baking", left: "66%", top: "44%", w: "32%", h: "22%" },
  { id: "books", label: "Reading", left: "2%", top: "60%", w: "22%", h: "16%" },
  { id: "jar", label: "Memory jar", left: "26%", top: "66%", w: "24%", h: "20%" },
  { id: "yoga", label: "Yoga", left: "48%", top: "82%", w: "48%", h: "16%" },
];

type Hitmap = { left: number; top: number; width: number; height: number };

/** Map hotspot layer onto the visible object-fit:cover content box. */
function coverHitmap(
  naturalW: number,
  naturalH: number,
  boxW: number,
  boxH: number,
  posX: number,
  posY: number,
): Hitmap {
  const scale = Math.max(boxW / naturalW, boxH / naturalH);
  const width = naturalW * scale;
  const height = naturalH * scale;
  return {
    left: (boxW - width) * posX,
    top: (boxH - height) * posY,
    width,
    height,
  };
}

const paperStars = [
  { l: "22%", t: "42%", d: "0s", c: "#fde68a", r: -14 },
  { l: "48%", t: "56%", d: "0.1s", c: "#e9d5ff", r: 16 },
  { l: "64%", t: "38%", d: "0.22s", c: "#fbcfe8", r: -8 },
  { l: "34%", t: "68%", d: "0.08s", c: "#fcd34d", r: 10 },
  { l: "56%", t: "72%", d: "0.3s", c: "#ddd6fe", r: -18 },
  { l: "40%", t: "36%", d: "0.16s", c: "#fef3c7", r: 6 },
  { l: "70%", t: "60%", d: "0.38s", c: "#c4b5fd", r: 12 },
  { l: "28%", t: "78%", d: "0.26s", c: "#f9a8d4", r: -6 },
];

function PaperStars() {
  return (
    <div className="studio-jar-vessel" aria-hidden>
      {paperStars.map((star, i) => (
        <span
          key={i}
          className="studio-paper-star"
          style={{
            left: star.l,
            top: star.t,
            animationDelay: star.d,
            ["--star"]: star.c,
            transform: `rotate(${star.r}deg)`,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}

function Steam() {
  return (
    <div className="studio-steam" aria-hidden>
      <i style={{ left: "28%", animationDelay: "0s" }} />
      <i style={{ left: "48%", animationDelay: "0.25s" }} />
      <i style={{ left: "66%", animationDelay: "0.45s" }} />
    </div>
  );
}

function Breath() {
  return <span className="studio-breath" aria-hidden />;
}

function FrameSparks() {
  return (
    <div className="studio-sparks" aria-hidden>
      <i style={{ left: "12%", top: "18%" }} />
      <i style={{ left: "48%", top: "8%" }} />
      <i style={{ left: "78%", top: "22%" }} />
      <i style={{ left: "30%", top: "58%" }} />
    </div>
  );
}

function LeafSway() {
  return (
    <div className="studio-leaves" aria-hidden>
      <i style={{ left: "22%", top: "40%" }} />
      <i style={{ left: "54%", top: "28%" }} />
      <i style={{ left: "78%", top: "52%" }} />
    </div>
  );
}

function StudioHeroArt({
  artRef,
  onLoad,
}: {
  artRef: Ref<HTMLImageElement>;
  onLoad: () => void;
}) {
  const alt =
    "Cozy 3D miniature studio centered on a woman looking at a MacBook, with a photo wall, piano, memory jar of paper stars, books, baking, plants, and a yoga corner.";
  const common = {
    alt,
    width: 1280,
    height: 720,
    priority: true,
    sizes: "(max-width: 720px) 100vw, 1280px",
  } as const;
  const { props: desktop } = getImageProps({ ...common, src: "/images/hero-studio.jpg" });
  const { props: mobile } = getImageProps({ ...common, src: "/images/hero-studio-portrait.jpg" });
  return (
    <picture>
      <source media="(max-width: 720px)" srcSet={mobile.srcSet} sizes={mobile.sizes} />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- alt comes from getImageProps */}
      <img {...desktop} ref={artRef} className="world-art" onLoad={onLoad} />
    </picture>
  );
}

function SpotFx({ id, playing }: { id: SpotId; playing?: boolean }) {
  if (id === "piano") return playing ? <Notes looping /> : null;
  if (id === "laptop") return <MiniUi className="world-ui studio-ui" />;
  if (id === "cook") return <Steam />;
  if (id === "jar") return <PaperStars />;
  if (id === "yoga") return <Breath />;
  if (id === "frames") return <FrameSparks />;
  if (id === "plants") return <LeafSway />;
  return null;
}

export function StudioHero({ site }: { site: PublicSiteContent | SiteContent }) {
  const reduce = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  const artRef = useRef<HTMLImageElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const interacting = useRef(false);
  const drag = useRef({ x: 0, y: 0, moved: false });
  const idleT = useRef(0);
  const [active, setActive] = useState<SpotId | null>(null);
  const [flash, setFlash] = useState(false);
  const [hitmap, setHitmap] = useState<Hitmap | null>(null);
  const {
    audioHost,
    pianoPlaying,
    hasPiano,
    goodreadsId,
    onPianoToggle,
    onBooksClick,
    pianoOn,
    bookOn,
    pianoTip,
    bookTip,
  } = usePianoPlayback(site);

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
    const stop = () => {
      if (raf) window.cancelAnimationFrame(raf);
      raf = 0;
      el.classList.remove("is-tilting");
    };
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

  useEffect(() => {
    syncHitmap();
    const host = stage.current;
    const img = artRef.current;
    if (!host) return;
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => syncHitmap()) : null;
    ro?.observe(host);
    const onResize = () => syncHitmap();
    window.addEventListener("resize", onResize);
    img?.addEventListener("load", syncHitmap);
    const mq = window.matchMedia("(max-width: 720px)");
    const onMq = () => syncHitmap();
    mq.addEventListener("change", onMq);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", onResize);
      img?.removeEventListener("load", syncHitmap);
      mq.removeEventListener("change", onMq);
    };
  }, []);

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

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    drag.current = { x: e.clientX, y: e.clientY, moved: false };
    if (e.pointerType === "touch") {
      interacting.current = true;
      tiltFromEvent(e);
    }
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "touch") {
      const dx = e.clientX - drag.current.x;
      const dy = e.clientY - drag.current.y;
      if (Math.hypot(dx, dy) > 10) drag.current.moved = true;
    }
    if (e.pointerType === "touch" && !interacting.current) return;
    tiltFromEvent(e);
  }

  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "touch") {
      interacting.current = false;
      target.current = { x: 0, y: 0 };
    }
  }

  function onPointerLeave(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse") {
      interacting.current = false;
      target.current = { x: 0, y: 0 };
    }
  }

  function onFramesClick() {
    setFlash(true);
    window.setTimeout(() => setFlash(false), 280);
  }

  const pianoActive = pianoOn(active);
  const bookActive = bookOn(active, "books");
  const deskTip = site.roles[0] ? `Building · ${site.roles[0]}` : "This is my desk";

  function renderSpots(layout: "desktop" | "mobile") {
    const spots = layout === "mobile" ? mobileSpots : desktopSpots;
    return (
      <div className={`studio-spots studio-spots-${layout}`}>
        {spots.map((spot, i) => {
          const isPiano = spot.id === "piano";
          const isBook = spot.id === "books";
          const isJar = spot.id === "jar";
          const isFrames = spot.id === "frames";
          const isLaptop = spot.id === "laptop";
          const on = isPiano ? pianoActive : isBook ? bookActive : active === spot.id;
          const href = isBook && goodreadsId ? "/reading" : isJar ? "/memories" : undefined;
          const Spot = href ? "a" : "button";
          const tip = isPiano
            ? pianoTip
            : isBook
              ? bookTip
              : isJar && on
                ? "Open memory jar ✨"
                : isLaptop && on
                  ? deskTip
                  : isFrames && on
                    ? "Photo wall"
                    : on
                      ? spot.label
                      : null;
          const label = isPiano
            ? pianoPlaying
              ? "Pause piano music"
              : hasPiano
                ? "Play piano music"
                : "The piano is taking a break"
            : isBook
              ? goodreadsId
                ? "Open reading list"
                : "The books are taking a break"
              : isJar
                ? "Open memory jar"
                : isLaptop
                  ? "Coding setup"
                  : isFrames
                    ? "Photo wall"
                    : spot.label;
          return (
            <Spot
              key={`${layout}-${spot.id}-${spot.left}-${i}`}
              href={href}
              type={href ? undefined : "button"}
              data-spot={spot.id}
              className={`world-spot${on ? " is-on" : ""}${isPiano && pianoPlaying ? " is-playing" : ""}`}
              style={{ left: spot.left, top: spot.top, width: spot.w, height: spot.h }}
              aria-label={label}
              aria-pressed={href ? undefined : isPiano ? pianoPlaying : on}
              onPointerEnter={(e) => {
                if (e.pointerType === "mouse") setActive(spot.id);
              }}
              onPointerLeave={(e) => {
                if (e.pointerType === "mouse") setActive((cur) => (cur === spot.id ? null : cur));
              }}
              onPointerDown={(e) => {
                if (e.pointerType !== "mouse") setActive(spot.id);
              }}
              onFocus={() => setActive(spot.id)}
              onBlur={() => setActive((cur) => (cur === spot.id ? null : cur))}
              onClick={(e) => {
                if (drag.current.moved) {
                  e.preventDefault();
                  return;
                }
                if (isPiano) {
                  e.preventDefault();
                  onPianoToggle();
                  return;
                }
                if (isBook) {
                  onBooksClick();
                  return;
                }
                if (isJar) return;
                if (isFrames) {
                  onFramesClick();
                  setActive((cur) => (cur === spot.id ? null : spot.id));
                  return;
                }
                setActive((cur) => (cur === spot.id ? null : spot.id));
              }}
            >
              {on ? (
                <>
                  <SpotFx id={spot.id} playing={pianoPlaying} />
                  {tip ? (
                    <span className={isPiano || isBook || isJar || isLaptop ? "world-tip" : "world-tag"}>{tip}</span>
                  ) : null}
                </>
              ) : null}
            </Spot>
          );
        })}
      </div>
    );
  }

  return (
    <section
      id="top"
      className={`world-hero is-studio${pianoPlaying ? " is-playing" : ""}`}
      aria-labelledby="hero-heading"
    >
      <h1 id="hero-heading" className="sr-only">
        {site.greeting}
      </h1>
      <p className="sr-only">
        Interactive miniature of a creative studio. The person at the laptop is in the center. Hover, tap, or move
        the pointer to look around. The piano plays music, the books open the reading list, and the memory jar opens
        memories. None of this is required to use the rest of the site.
      </p>
      <div
        ref={stage}
        className="world-stage"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerLeave}
      >
        <StudioHeroArt artRef={artRef} onLoad={syncHitmap} />
        <div className="world-watermark-mask" />
        <div ref={audioHost} className="world-audio-host" aria-hidden />
        <p role="status" aria-live="polite" className="sr-only">
          {pianoPlaying ? "Piano music is playing." : ""}
        </p>

        <div
          className={`studio-hitmap${hitmap ? " is-ready" : ""}`}
          style={
            hitmap
              ? { left: hitmap.left, top: hitmap.top, width: hitmap.width, height: hitmap.height }
              : undefined
          }
        >
          {renderSpots("desktop")}
          {renderSpots("mobile")}
        </div>

        {pianoPlaying ? (
          <button type="button" className="world-playing" onClick={onPianoToggle} aria-label="Stop piano music">
            ♪ Playing
          </button>
        ) : null}

        {flash ? <div className="world-flash" /> : null}
      </div>
    </section>
  );
}
