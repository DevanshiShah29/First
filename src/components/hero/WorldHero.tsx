"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useReducedMotion } from "@/lib/reduced-motion";
import type { SiteContent } from "@/content/types";
import { goodreadsUserId } from "@/lib/goodreads";
import { youtubeVideoId } from "@/lib/media-url";

type SpotId = "piano" | "jar" | "camera" | "laptop" | "book" | "cook" | "travel";

const spots: { id: SpotId; label: string; left: string; top: string; w: string; h: string }[] = [
  { id: "jar", label: "Jar of stars", left: "9%", top: "16%", w: "10%", h: "18%" },
  { id: "piano", label: "Piano", left: "6%", top: "38%", w: "26%", h: "42%" },
  { id: "camera", label: "Photos", left: "18%", top: "1%", w: "14%", h: "14%" },
  { id: "laptop", label: "Building", left: "42%", top: "40%", w: "22%", h: "24%" },
  { id: "book", label: "Reading", left: "46%", top: "68%", w: "18%", h: "20%" },
  { id: "cook", label: "Cooking", left: "68%", top: "16%", w: "24%", h: "32%" },
  { id: "travel", label: "Travel", left: "70%", top: "52%", w: "28%", h: "42%" },
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

export function WorldHero({ site }: { site: SiteContent }) {
  const reduce = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  const audioHost = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const restTimer = useRef<number | NodeJS.Timeout | undefined>(undefined);
  const [active, setActive] = useState<SpotId | null>(null);
  const [flash, setFlash] = useState(false);
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
    const el = stage.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const nx = (e.clientX - box.left) / box.width - 0.5;
    const ny = (e.clientY - box.top) / box.height - 0.5;
    el.style.transform = `perspective(1400px) rotateX(${(ny * -7).toFixed(2)}deg) rotateY(${(nx * 9).toFixed(2)}deg)`;
  }

  function onSpot(id: SpotId, on: boolean) {
    setActive(on ? id : null);
    if (on && id === "camera") {
      setFlash(true);
      window.setTimeout(() => setFlash(false), 280);
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

  const pianoOn = active === "piano" || pianoPlaying || pianoRest;
  const pianoTip = pianoPlaying
    ? null
    : !videoId
      ? "The piano is taking a break 🎹"
      : "Play something 🎵";
  const bookOn = active === "book" || bookRest;
  const bookTip = !goodreadsId ? "The books are taking a break 📚" : "Open my books";

  const pianoHref = videoId ? `https://www.youtube.com/watch?v=${videoId}` : undefined;

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
      <div
        ref={stage}
        className="world-stage"
        onPointerMove={onMove}
        onPointerLeave={() => {
          if (stage.current) stage.current.style.transform = "";
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hero-world.jpg?v=paper2"
          alt="Illustrated desk with a piano, a jar of stars, camera, laptop, books, cooking, and travel souvenirs."
          className="world-art"
          width={1280}
          height={720}
          decoding="async"
          fetchPriority="high"
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
          const on = isPiano ? pianoOn : isBook ? bookOn : active === spot.id;
          const bookHref = isBook && goodreadsId ? "/reading" : undefined;
          const href = bookHref ?? (isJar ? "/memories" : isPiano ? pianoHref : undefined);
          const Spot = href ? "a" : "button";
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
                ? "Open jar of stars"
                : spot.label;
          return (
            <Spot
              key={spot.id}
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
                if (e.pointerType === "mouse") onSpot(spot.id, true);
              }}
              onPointerLeave={(e) => {
                if (e.pointerType === "mouse") onSpot(spot.id, false);
              }}
              onFocus={() => onSpot(spot.id, true)}
              onBlur={() => onSpot(spot.id, false)}
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
          <button
            type="button"
            className="world-playing"
            onClick={onPianoToggle}
            aria-label="Stop piano music"
          >
            ♪ Playing
          </button>
        ) : null}

        {flash ? <div className="world-flash" /> : null}
      </div>
    </section>
  );
}
