"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { useReducedMotion } from "motion/react";
import type { SiteContent } from "@/content/types";
import { goodreadsUserId } from "@/lib/goodreads";
import { youtubeVideoId } from "@/lib/media-url";

type SpotId = "frames" | "jar" | "books" | "piano" | "laptop" | "cook" | "plants" | "yoga";

type Spot = { id: SpotId; label: string; left: string; top: string; w: string; h: string };

const desktopSpots: Spot[] = [
  { id: "frames", label: "Photo wall", left: "2%", top: "2%", w: "22%", h: "36%" },
  { id: "plants", label: "Plants", left: "24%", top: "0%", w: "24%", h: "18%" },
  { id: "plants", label: "Plants", left: "54%", top: "0%", w: "44%", h: "22%" },
  { id: "plants", label: "Plants", left: "76%", top: "68%", w: "16%", h: "26%" },
  { id: "piano", label: "Piano", left: "28%", top: "20%", w: "20%", h: "30%" },
  { id: "jar", label: "Memory jar", left: "9%", top: "42%", w: "12%", h: "28%" },
  { id: "books", label: "Reading", left: "20%", top: "36%", w: "13%", h: "24%" },
  { id: "laptop", label: "Coding", left: "32%", top: "28%", w: "30%", h: "56%" },
  { id: "cook", label: "Baking", left: "58%", top: "28%", w: "32%", h: "38%" },
  { id: "yoga", label: "Yoga", left: "62%", top: "64%", w: "36%", h: "34%" },
];

const mobileSpots: Spot[] = [
  { id: "frames", label: "Photo wall", left: "2%", top: "1%", w: "52%", h: "30%" },
  { id: "plants", label: "Plants", left: "52%", top: "1%", w: "46%", h: "28%" },
  { id: "plants", label: "Plants", left: "0%", top: "34%", w: "18%", h: "16%" },
  { id: "piano", label: "Piano", left: "0%", top: "38%", w: "26%", h: "28%" },
  { id: "laptop", label: "Coding", left: "26%", top: "28%", w: "48%", h: "38%" },
  { id: "cook", label: "Baking", left: "62%", top: "42%", w: "36%", h: "28%" },
  { id: "books", label: "Reading", left: "0%", top: "62%", w: "20%", h: "20%" },
  { id: "jar", label: "Memory jar", left: "18%", top: "66%", w: "24%", h: "26%" },
  { id: "yoga", label: "Yoga", left: "50%", top: "76%", w: "48%", h: "22%" },
];

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

function Notes({ looping }: { looping?: boolean }) {
  return (
    <div className={`world-fx${looping ? " is-loop" : ""}`} aria-hidden>
      {["♪", "♫", "♩"].map((n, i) => (
        <span key={n} className="world-note" style={{ left: `${18 + i * 14}%`, animationDelay: `${i * 0.18}s` }}>
          {n}
        </span>
      ))}
    </div>
  );
}

function MiniUi() {
  return (
    <div className="world-ui studio-ui" aria-hidden>
      <span />
      <span />
      <span />
    </div>
  );
}

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

function SpotFx({ id, playing }: { id: SpotId; playing?: boolean }) {
  if (id === "piano") return playing ? <Notes looping /> : null;
  if (id === "laptop") return <MiniUi />;
  if (id === "cook") return <Steam />;
  if (id === "jar") return <PaperStars />;
  if (id === "yoga") return <Breath />;
  if (id === "frames") return <FrameSparks />;
  if (id === "plants") return <LeafSway />;
  return null;
}

export function StudioHero({ site }: { site: SiteContent }) {
  const reduce = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  const audioHost = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const restTimer = useRef<number | NodeJS.Timeout | undefined>(undefined);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const interacting = useRef(false);
  const drag = useRef({ x: 0, y: 0, moved: false });
  const idleT = useRef(0);
  const [active, setActive] = useState<SpotId | null>(null);
  const [pianoPlaying, setPianoPlaying] = useState(false);
  const [pianoRest, setPianoRest] = useState(false);
  const [bookRest, setBookRest] = useState(false);
  const [flash, setFlash] = useState(false);
  const videoId = youtubeVideoId(site.pianoYoutubeUrl ?? "");
  const goodreadsId = goodreadsUserId(site.goodreadsUrl ?? "");

  function stopMusic() {
    iframeRef.current?.remove();
    iframeRef.current = null;
    audioHost.current?.replaceChildren();
  }

  function startMusic(id: string) {
    const host = audioHost.current;
    if (!host) return;
    stopMusic();
    const iframe = document.createElement("iframe");
    iframe.className = "world-audio";
    iframe.title = "Piano music";
    iframe.allow = "autoplay; encrypted-media";
    iframe.setAttribute("aria-hidden", "true");
    iframe.tabIndex = -1;
    const origin = encodeURIComponent(window.location.origin);
    iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&enablejsapi=1&playsinline=1&rel=0&modestbranding=1&controls=0&disablekb=1&fs=0&origin=${origin}`;
    host.appendChild(iframe);
    iframeRef.current = iframe;
  }

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    if (reduce) {
      el.style.transform = "";
      return;
    }
    let raf = 0;
    const tick = (now: number) => {
      if (!interacting.current) {
        idleT.current = now;
        const t = now * 0.00028;
        target.current = { x: Math.sin(t) * 1.05, y: Math.cos(t * 0.82) * 1.35 };
      }
      current.current.x += (target.current.x - current.current.x) * 0.1;
      current.current.y += (target.current.y - current.current.y) * 0.1;
      const x = current.current.x;
      const y = current.current.y;
      el.style.transform = `perspective(1600px) rotateX(${x.toFixed(3)}deg) rotateY(${y.toFixed(3)}deg) translate3d(${(y * 1.4).toFixed(2)}px, ${(x * -1.2).toFixed(2)}px, 12px)`;
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [reduce]);

  useEffect(() => {
    return () => {
      if (restTimer.current) window.clearTimeout(restTimer.current);
      iframeRef.current?.remove();
      iframeRef.current = null;
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

  function onPianoToggle() {
    window.clearTimeout(restTimer.current);
    if (!videoId) {
      setPianoPlaying(false);
      setPianoRest(true);
      stopMusic();
      restTimer.current = window.setTimeout(() => setPianoRest(false), 2400);
      return;
    }
    setPianoRest(false);
    if (pianoPlaying) {
      stopMusic();
      setPianoPlaying(false);
      return;
    }
    startMusic(videoId);
    setPianoPlaying(true);
  }

  function onBooksClick() {
    if (goodreadsId) return;
    window.clearTimeout(restTimer.current);
    setBookRest(true);
    restTimer.current = window.setTimeout(() => setBookRest(false), 2400);
  }

  function onFramesClick() {
    setFlash(true);
    window.setTimeout(() => setFlash(false), 280);
  }

  const pianoOn = active === "piano" || pianoPlaying || pianoRest;
  const pianoTip = pianoPlaying ? null : !videoId ? "The piano is taking a break 🎹" : "Play something 🎵";
  const bookOn = active === "books" || bookRest;
  const bookTip = !goodreadsId ? "The books are taking a break 📚" : "Open my books";
  const pianoHref = videoId ? `https://www.youtube.com/watch?v=${videoId}` : undefined;
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
          const on = isPiano ? pianoOn : isBook ? bookOn : active === spot.id;
          const href = isBook && goodreadsId ? "/reading" : isJar ? "/memories" : isPiano ? pianoHref : undefined;
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
              : videoId
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
              target={isPiano && href ? "_blank" : undefined}
              rel={isPiano && href ? "noopener noreferrer" : undefined}
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
                  if (videoId) e.preventDefault();
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
        <picture>
          <source media="(max-width: 720px)" srcSet="/images/hero-studio-portrait.jpg?v=studio1" />
          <img
            src="/images/hero-studio.jpg?v=studio1"
            alt="Cozy 3D miniature studio centered on a woman looking at a MacBook, with a photo wall, piano, memory jar of paper stars, books, baking, plants, and a yoga corner."
            className="world-art"
          />
        </picture>
        <div className="world-watermark-mask" />
        <div ref={audioHost} className="world-audio-host" aria-hidden />
        <p role="status" aria-live="polite" className="sr-only">
          {pianoPlaying ? "Piano music is playing." : ""}
        </p>

        {renderSpots("desktop")}
        {renderSpots("mobile")}

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
