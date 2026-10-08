"use client";

// External dependencies
import { useState } from "react";
import Image from "next/image";

// Application services & types
import type { PublicSiteContent, SiteContent } from "@/content/types";
import { useReducedMotion } from "@/hooks/reduced-motion";
import { useHeroTilt } from "@/hooks/use-hero-tilt";
import { usePianoPlayback } from "@/hooks/use-piano-playback";

// UI components
import { Ingredients, MiniUi, Notes } from "./fx";

type SpotId = "piano" | "jar" | "camera" | "laptop" | "book" | "cook" | "travel";

const spots: { id: SpotId; label: string; left: string; top: string; w: string; h: string }[] = [
  { id: "jar", label: "Memories", left: "9%", top: "16%", w: "10%", h: "18%" },
  { id: "piano", label: "Piano", left: "6%", top: "38%", w: "26%", h: "42%" },
  { id: "camera", label: "Photos", left: "18%", top: "1%", w: "14%", h: "14%" },
  { id: "laptop", label: "Building", left: "42%", top: "40%", w: "22%", h: "24%" },
  { id: "book", label: "Book Nook", left: "46%", top: "68%", w: "18%", h: "20%" },
  { id: "cook", label: "Cooking", left: "68%", top: "16%", w: "24%", h: "32%" },
  { id: "travel", label: "Travel", left: "70%", top: "52%", w: "28%", h: "42%" },
];

const jarStars = [
  { g: "✦", l: "22%", t: "48%", d: "0s", s: "0.28rem", c: "#fde68a" },
  { g: "★", l: "48%", t: "58%", d: "0.12s", s: "0.22rem", c: "#e9d5ff" },
  { g: "✧", l: "64%", t: "42%", d: "0.24s", s: "0.2rem", c: "#f5f0e0" },
  { g: "✦", l: "34%", t: "68%", d: "0.08s", s: "0.24rem", c: "#fcd34d" },
  { g: "★", l: "56%", t: "72%", d: "0.32s", s: "0.18rem", c: "#ddd6fe" },
  { g: "✧", l: "40%", t: "40%", d: "0.18s", s: "0.2rem", c: "#fef3c7" },
  { g: "✦", l: "70%", t: "62%", d: "0.4s", s: "0.16rem", c: "#c4b5fd" },
  { g: "★", l: "28%", t: "78%", d: "0.28s", s: "0.2rem", c: "#fde68a" },
];

/**
 * Renders decorative stars inside the world jar hotspot.
 * @example <JarStars />
 */
function JarStars() {
  return (
    <div className="world-jar-vessel" aria-hidden>
      {jarStars.map((star, i) => (
        <span
          key={i}
          className="world-jar-star"
          style={{
            left: star.l,
            top: star.t,
            animationDelay: star.d,
            fontSize: star.s,
            color: star.c,
          }}
        >
          {star.g}
        </span>
      ))}
    </div>
  );
}

/**
 * Renders the interactive world-desk hero.
 * @example <WorldHero site={site} />
 */
export function WorldHero({ site }: { site: PublicSiteContent | SiteContent }) {
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
  const [flash, setFlash] = useState(false);

  /**
   * Activates a hotspot and flashes the camera.
   * @example onSpot("camera", true) // flash
   */
  function onSpot(id: SpotId, on: boolean) {
    setActive(on ? id : null);
    if (on && id === "camera") {
      setFlash(true);
      window.setTimeout(() => setFlash(false), 280);
    }
  }

  const pianoActive = pianoOn(active);
  const bookActive = bookOn(active);

  return (
    <section id="top" className={`world-hero${pianoPlaying ? " is-playing" : ""}`} aria-labelledby="hero-heading">
      <h1 id="hero-heading" className="sr-only">
        {site.greeting}
      </h1>
      <p className="sr-only">
        Interactive illustration of a desk. Activate a hotspot to hear about a hobby. The piano plays music,
        the books open the reading list, and the jar of stars opens memories. None of this is required to use
        the rest of the site.
      </p>
      <div ref={stage} className="world-stage" onPointerMove={onMove} onPointerLeave={onLeave}>
        <Image
          src="/images/hero-world.jpg"
          alt="Illustrated desk with a piano, a jar of stars, camera, laptop, books, cooking, and travel souvenirs."
          className="world-art"
          width={3840}
          height={2160}
          quality={92}
          priority
          sizes="100vw"
        />
        <div className="world-watermark-mask" />
        <div ref={audioHost} className="world-audio-host" aria-hidden />
        <p role="status" aria-live="polite" className="sr-only">
          {pianoPlaying ? "Piano music is playing." : ""}
        </p>

        {spots.map((spot) => {
          const isPiano = spot.id === "piano";
          const isBook = spot.id === "book";
          const isJar = spot.id === "jar";
          const on = isPiano ? pianoActive : isBook ? bookActive : active === spot.id;
          const bookHref = isBook && goodreadsId ? "/reading" : undefined;
          const href = bookHref ?? (isJar ? "/memories" : undefined);
          const Spot = href ? "a" : "button";
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
                ? "Open jar of stars"
                : spot.label;
          return (
            <Spot
              key={spot.id}
              href={href}
              type={href ? undefined : "button"}
              data-spot={spot.id}
              className={`world-spot${on ? " is-on" : ""}${isPiano && pianoPlaying ? " is-playing" : ""}`}
              style={{ left: spot.left, top: spot.top, width: spot.w, height: spot.h }}
              aria-label={label}
              aria-pressed={href ? undefined : isPiano ? pianoPlaying : on}
              onPointerEnter={(e) => {
                if (e.pointerType === "mouse") onSpot(spot.id, true);
              }}
              onPointerLeave={(e) => {
                if (e.pointerType === "mouse") onSpot(spot.id, false);
              }}
              onFocus={() => onSpot(spot.id, true)}
              onBlur={() => onSpot(spot.id, false)}
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
                  {spot.id === "piano" ? (
                    <>
                      {pianoPlaying ? <Notes looping /> : null}
                      {pianoTip ? <span className="world-tip">{pianoTip}</span> : null}
                    </>
                  ) : null}
                  {spot.id === "jar" ? (
                    <>
                      {reduce ? null : <JarStars />}
                      <span className="world-tip">Open jar of stars ✨</span>
                    </>
                  ) : null}
                  {spot.id === "laptop" ? <MiniUi /> : null}
                  {spot.id === "cook" ? <Ingredients /> : null}
                  {spot.id === "travel" ? <span className="world-plane" aria-hidden /> : null}
                  {spot.id === "book" && bookTip ? <span className="world-tip">{bookTip}</span> : null}
                  {spot.id !== "book" && spot.id !== "piano" && spot.id !== "jar" ? (
                    <span className="world-tag">{spot.label}</span>
                  ) : null}
                </>
              ) : null}
            </Spot>
          );
        })}

        {pianoPlaying ? (
          <button type="button" className="world-playing" onClick={onPianoToggle} aria-label="Playing — Stop piano music">
            ♪ Playing
          </button>
        ) : null}

        {flash ? <div className="world-flash" /> : null}
      </div>
    </section>
  );
}
