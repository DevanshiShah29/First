"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useReducedMotion } from "motion/react";
import type { SiteContent } from "@/content/types";
import { goodreadsUserId } from "@/lib/goodreads";
import { youtubeVideoId } from "@/lib/media-url";

type SpotId =
  | "piano"
  | "jar"
  | "books"
  | "cook"
  | "yoga"
  | "journal"
  | "laptop"
  | "frames"
  | "plants"
  | "paint";

type Spot = { id: SpotId; label: string; left: string; top: string; w: string; h: string };

const desktopSpots: Spot[] = [
  { id: "frames", label: "Photos", left: "2%", top: "2%", w: "18%", h: "20%" },
  { id: "plants", label: "Plants", left: "58%", top: "1%", w: "28%", h: "20%" },
  { id: "piano", label: "Piano", left: "22%", top: "28%", w: "20%", h: "28%" },
  { id: "yoga", label: "Yoga", left: "0%", top: "48%", w: "12%", h: "42%" },
  { id: "jar", label: "Memory jar", left: "28%", top: "42%", w: "17%", h: "32%" },
  { id: "laptop", label: "Coding", left: "48%", top: "46%", w: "18%", h: "20%" },
  { id: "journal", label: "Journal", left: "48%", top: "68%", w: "16%", h: "16%" },
  { id: "paint", label: "Paint & craft", left: "72%", top: "28%", w: "26%", h: "64%" },
  { id: "cook", label: "Cooking", left: "70%", top: "38%", w: "12%", h: "16%" },
  { id: "books", label: "Reading", left: "12%", top: "48%", w: "16%", h: "36%" },
];

const mobileSpots: Spot[] = [
  { id: "frames", label: "Photos", left: "2%", top: "1%", w: "28%", h: "16%" },
  { id: "plants", label: "Plants", left: "62%", top: "0%", w: "36%", h: "12%" },
  { id: "laptop", label: "Coding", left: "42%", top: "36%", w: "22%", h: "14%" },
  { id: "paint", label: "Paint & craft", left: "58%", top: "38%", w: "38%", h: "26%" },
  { id: "cook", label: "Cooking", left: "60%", top: "12%", w: "36%", h: "16%" },
  { id: "books", label: "Reading", left: "16%", top: "44%", w: "30%", h: "18%" },
  { id: "piano", label: "Piano", left: "1%", top: "66%", w: "32%", h: "26%" },
  { id: "jar", label: "Memory jar", left: "24%", top: "72%", w: "24%", h: "22%" },
  { id: "yoga", label: "Yoga", left: "52%", top: "68%", w: "40%", h: "28%" },
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
    <div className="world-ui" aria-hidden>
      <span />
      <span />
      <span />
    </div>
  );
}

function Ingredients() {
  return (
    <div className="world-bits" aria-hidden>
      <i style={{ left: "10%", animationDelay: "0s" }} />
      <i style={{ left: "40%", animationDelay: "0.2s" }} />
      <i style={{ left: "68%", animationDelay: "0.35s" }} />
    </div>
  );
}

function JarNotes() {
  return (
    <div className="world-fx is-loop" aria-hidden>
      {["✦", "♡", "✿"].map((n, i) => (
        <span key={n} className="world-note" style={{ left: `${16 + i * 22}%`, animationDelay: `${i * 0.2}s` }}>
          {n}
        </span>
      ))}
    </div>
  );
}

function PaintDots() {
  return (
    <div className="world-bits" aria-hidden>
      <i style={{ left: "18%", background: "#7c3aed", animationDelay: "0s" }} />
      <i style={{ left: "46%", background: "#f59e0b", animationDelay: "0.15s" }} />
      <i style={{ left: "72%", background: "#10b981", animationDelay: "0.3s" }} />
    </div>
  );
}

function SpotFx({ id, playing }: { id: SpotId; playing?: boolean }) {
  if (id === "piano") return playing ? <Notes looping /> : null;
  if (id === "laptop") return <MiniUi />;
  if (id === "cook") return <Ingredients />;
  if (id === "jar") return <JarNotes />;
  if (id === "paint") {
    return (
      <>
        <PaintDots />
        <Ingredients />
      </>
    );
  }
  return null;
}

export function NookHero({ site }: { site: SiteContent }) {
  const reduce = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  const audioHost = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const restTimer = useRef<number | NodeJS.Timeout | undefined>(undefined);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState<SpotId | null>(null);
  const [pianoPlaying, setPianoPlaying] = useState(false);
  const [pianoRest, setPianoRest] = useState(false);
  const [bookRest, setBookRest] = useState(false);
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
    return () => {
      if (restTimer.current) window.clearTimeout(restTimer.current);
      iframeRef.current?.remove();
      iframeRef.current = null;
    };
  }, []);

  function onMove(e: PointerEvent<HTMLDivElement>) {
    if (reduce) return;
    const box = stage.current?.getBoundingClientRect();
    if (!box) return;
    const nx = (e.clientX - box.left) / box.width - 0.5;
    const ny = (e.clientY - box.top) / box.height - 0.5;
    setTilt({ x: ny * -6, y: nx * 8 });
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

  const pianoOn = active === "piano" || pianoPlaying || pianoRest;
  const pianoTip = pianoPlaying
    ? null
    : !videoId
      ? "The piano is taking a break 🎹"
      : "Play something 🎵";
  const bookOn = active === "books" || bookRest;
  const bookTip = !goodreadsId ? "The books are taking a break 📚" : "Open my books";
  const pianoHref = videoId ? `https://www.youtube.com/watch?v=${videoId}` : undefined;

  return (
    <section id="top" className={`world-hero is-nook${pianoPlaying ? " is-playing" : ""}`} aria-labelledby="hero-heading">
      <h1 id="hero-heading" className="sr-only">
        {site.greeting}
      </h1>
      <p className="sr-only">
        Interactive illustration of a cozy nook. Activate a hotspot to hear about a hobby. The piano plays music,
        the books open the reading list, and the jar opens memories. None of this is required to use the rest of
        the site.
      </p>
      <div
        ref={stage}
        className="world-stage"
        onPointerMove={onMove}
        onPointerLeave={() => setTilt({ x: 0, y: 0 })}
        style={{
          transform: reduce
            ? undefined
            : `perspective(1400px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        }}
      >
        <picture>
          <source media="(max-width: 720px)" srcSet="/images/hero-nook-portrait.jpg" />
          <img
            src="/images/hero-nook.jpg"
            alt="Illustrated cozy nook with a piano, books, a memory jar, plants, a laptop, and art supplies."
            className="world-art"
          />
        </picture>
        <div className="world-watermark-mask" />
        <div ref={audioHost} className="world-audio-host" aria-hidden />
        <p role="status" aria-live="polite" className="sr-only">
          {pianoPlaying ? "Piano music is playing." : ""}
        </p>

        {(["desktop", "mobile"] as const).map((layout) => (
          <div key={layout} className={`nook-spots nook-spots-${layout}`}>
            {(layout === "mobile" ? mobileSpots : desktopSpots).map((spot) => {
              const isPiano = spot.id === "piano";
              const isBook = spot.id === "books";
              const isJar = spot.id === "jar";
              const on = isPiano ? pianoOn : isBook ? bookOn : active === spot.id;
              const href =
                isBook && goodreadsId
                  ? "/reading"
                  : isJar
                    ? "/memories"
                    : isPiano
                      ? pianoHref
                      : undefined;
              const Spot = href ? "a" : "button";
              const tip =
                isPiano && pianoTip
                  ? pianoTip
                  : isBook && bookTip
                    ? bookTip
                    : isJar && on
                      ? "Open memory jar ✨"
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
                    : spot.label;
              return (
                <Spot
                  key={`${layout}-${spot.id}`}
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
                  onFocus={() => setActive(spot.id)}
                  onBlur={() => setActive((cur) => (cur === spot.id ? null : cur))}
                  onClick={(e) => {
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
                    setActive((cur) => (cur === spot.id ? null : spot.id));
                  }}
                >
                  {on ? (
                    <>
                      <SpotFx id={spot.id} playing={pianoPlaying} />
                      {tip ? (
                        <span className={isPiano || isBook || isJar ? "world-tip" : "world-tag"}>{tip}</span>
                      ) : null}
                    </>
                  ) : null}
                </Spot>
              );
            })}
          </div>
        ))}

        {pianoPlaying ? (
          <button
            type="button"
            className="world-playing"
            onClick={onPianoToggle}
            aria-label="Stop piano music"
          >
            ♪ Playing
          </button>
        ) : null}
      </div>
    </section>
  );
}
