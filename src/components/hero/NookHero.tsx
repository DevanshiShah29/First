"use client";

// External dependencies
import { useState } from "react";
import { getImageProps } from "next/image";

// Application services & types
import type { PublicSiteContent, SiteContent } from "@/content/types";
import { useReducedMotion } from "@/hooks/reduced-motion";
import { useHeroTilt } from "@/hooks/use-hero-tilt";
import { usePianoPlayback } from "@/hooks/use-piano-playback";

// UI components
import { Ingredients, MiniUi, Notes } from "./fx";

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
  { id: "jar", label: "Memories", left: "28%", top: "42%", w: "17%", h: "32%" },
  { id: "laptop", label: "Coding", left: "48%", top: "46%", w: "18%", h: "20%" },
  { id: "journal", label: "Journal", left: "48%", top: "68%", w: "16%", h: "16%" },
  { id: "paint", label: "Paint & craft", left: "72%", top: "28%", w: "26%", h: "64%" },
  { id: "cook", label: "Cooking", left: "70%", top: "38%", w: "12%", h: "16%" },
  { id: "books", label: "Book Nook", left: "12%", top: "48%", w: "16%", h: "36%" },
];

const mobileSpots: Spot[] = [
  { id: "frames", label: "Photos", left: "2%", top: "1%", w: "28%", h: "16%" },
  { id: "plants", label: "Plants", left: "62%", top: "0%", w: "36%", h: "12%" },
  { id: "laptop", label: "Coding", left: "42%", top: "36%", w: "22%", h: "14%" },
  { id: "paint", label: "Paint & craft", left: "58%", top: "38%", w: "38%", h: "26%" },
  { id: "cook", label: "Cooking", left: "60%", top: "12%", w: "36%", h: "16%" },
  { id: "books", label: "Book Nook", left: "16%", top: "44%", w: "30%", h: "18%" },
  { id: "piano", label: "Piano", left: "1%", top: "66%", w: "32%", h: "26%" },
  { id: "jar", label: "Memories", left: "24%", top: "72%", w: "24%", h: "22%" },
  { id: "yoga", label: "Yoga", left: "52%", top: "68%", w: "40%", h: "28%" },
];

/**
 * Renders responsive nook hero art via picture/source.
 * @example <NookHeroArt />
 */
function NookHeroArt() {
  const alt =
    "Illustrated cozy nook with a piano, books, a memory jar, plants, a laptop, and art supplies.";
  const common = {
    alt,
    width: 3840,
    height: 2160,
    quality: 92,
    priority: true,
    sizes: "100vw",
  } as const;
  const { props: desktop } = getImageProps({ ...common, src: "/images/hero-nook.jpg" });
  const { props: mobile } = getImageProps({
    ...common,
    src: "/images/hero-nook-portrait.jpg",
    width: 2160,
    height: 3840,
  });
  return (
    <picture>
      <source media="(max-width: 720px)" srcSet={mobile.srcSet} sizes={mobile.sizes} />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- alt comes from getImageProps */}
      <img {...desktop} className="world-art" />
    </picture>
  );
}

/**
 * Renders floating jar symbols FX.
 * @example <JarNotes />
 */
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

/**
 * Renders colorful paint-dot particles.
 * @example <PaintDots />
 */
function PaintDots() {
  return (
    <div className="world-bits" aria-hidden>
      <i style={{ left: "18%", background: "var(--brand-from)", animationDelay: "0s" }} />
      <i style={{ left: "46%", background: "#f59e0b", animationDelay: "0.15s" }} />
      <i style={{ left: "72%", background: "#10b981", animationDelay: "0.3s" }} />
    </div>
  );
}

/**
 * Renders hotspot FX for a nook spot id.
 * @example <SpotFx id="piano" playing />
 */
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

/**
 * Renders the interactive cozy-nook hero.
 * @example <NookHero site={site} />
 */
export function NookHero({ site }: { site: PublicSiteContent | SiteContent }) {
  const reduce = useReducedMotion();
  const { stage, onMove, onLeave } = useHeroTilt(reduce);
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
  const [active, setActive] = useState<SpotId | null>(null);
  const pianoActive = pianoOn(active);
  const bookActive = bookOn(active, "books");

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
      <div ref={stage} className="world-stage" onPointerMove={onMove} onPointerLeave={onLeave}>
        <NookHeroArt />
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
              const on = isPiano ? pianoActive : isBook ? bookActive : active === spot.id;
              const href =
                isBook && goodreadsId ? "/reading" : isJar ? "/memories" : undefined;
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
                  : hasPiano
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
                      e.preventDefault();
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
