"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useReducedMotion } from "motion/react";
import type { SiteContent } from "@/content/types";
import { goodreadsUserId } from "@/lib/goodreads";
import { youtubeVideoId } from "@/lib/media-url";

type SpotId = "piano" | "headphones" | "camera" | "laptop" | "book" | "cook" | "travel";

const spots: { id: SpotId; label: string; left: string; top: string; w: string; h: string }[] = [
  { id: "headphones", label: "Music", left: "4%", top: "16%", w: "16%", h: "24%" },
  { id: "piano", label: "Piano", left: "6%", top: "38%", w: "26%", h: "42%" },
  { id: "camera", label: "Photos", left: "16%", top: "2%", w: "16%", h: "16%" },
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

function Equalizer() {
  return (
    <div className="world-eq" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ animationDelay: `${i * 0.08}s` }} />
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
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
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
    const box = stage.current?.getBoundingClientRect();
    if (!box) return;
    const nx = (e.clientX - box.left) / box.width - 0.5;
    const ny = (e.clientY - box.top) / box.height - 0.5;
    setTilt({ x: ny * -7, y: nx * 9 });
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

  return (
    <section id="top" className={`world-hero${pianoPlaying ? " is-playing" : ""}`}>
      <h1 className="sr-only">{site.greeting}</h1>
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/hero-world.jpg" alt="" className="world-art" />
        <div className="world-watermark-mask" />
        <div ref={audioHost} className="world-audio-host" aria-hidden />

        {spots.map((spot) => {
          const isPiano = spot.id === "piano";
          const isBook = spot.id === "book";
          const on = isPiano ? pianoOn : isBook ? bookOn : active === spot.id;
          const bookHref = isBook && goodreadsId ? "/reading" : undefined;
          const Spot = bookHref ? "a" : "button";
          return (
            <Spot
              key={spot.id}
              href={bookHref}
              type={bookHref ? undefined : "button"}
              data-spot={spot.id}
              className={`world-spot${on ? " is-on" : ""}${isPiano && pianoPlaying ? " is-playing" : ""}`}
              style={{ left: spot.left, top: spot.top, width: spot.w, height: spot.h }}
              aria-label={
                isPiano
                  ? pianoPlaying
                    ? "Pause piano music"
                    : "Play piano music"
                  : isBook
                    ? "Open reading list"
                    : spot.label
              }
              aria-pressed={isPiano ? pianoPlaying : undefined}
              onPointerEnter={() => onSpot(spot.id, true)}
              onPointerLeave={() => onSpot(spot.id, false)}
              onFocus={() => onSpot(spot.id, true)}
              onBlur={() => onSpot(spot.id, false)}
              onClick={isPiano ? onPianoToggle : isBook ? onBooksClick : undefined}
            >
              {on ? (
                <>
                  {spot.id === "piano" ? (
                    <>
                      {pianoPlaying ? <Notes looping /> : null}
                      {pianoTip ? <span className="world-tip">{pianoTip}</span> : null}
                    </>
                  ) : null}
                  {spot.id === "headphones" ? <Equalizer /> : null}
                  {spot.id === "laptop" ? <MiniUi /> : null}
                  {spot.id === "cook" ? <Ingredients /> : null}
                  {spot.id === "travel" ? <span className="world-plane" aria-hidden /> : null}
                  {spot.id === "book" && bookTip ? <span className="world-tip">{bookTip}</span> : null}
                  {spot.id !== "book" && spot.id !== "piano" ? (
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
