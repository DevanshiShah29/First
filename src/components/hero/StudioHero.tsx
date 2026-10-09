"use client";

import { useRef, useState } from "react";
import { type PublicSiteContent, type SiteContent } from "@/content/types";
import { useReducedMotion } from "@/hooks/reduced-motion";
import { usePianoPlayback } from "@/hooks/use-piano-playback";
import { StudioHeroArt } from "./StudioHeroArt";
import { StudioSpotLayer } from "./StudioSpotLayer";
import { useStudioHitmap } from "./useStudioHitmap";
import { useStudioTilt } from "./useStudioTilt";
import type { SpotId } from "./studio-spots";

/**
 * Renders the interactive miniature-studio hero.
 * @example <StudioHero site={site} />
 */
export function StudioHero({ site }: { site: PublicSiteContent | SiteContent }) {
  const reduce = useReducedMotion();
  const artRef = useRef<HTMLImageElement>(null);
  const [active, setActive] = useState<SpotId | null>(null);
  const [flash, setFlash] = useState(false);
  const { stage, drag, onPointerDown, onPointerMove, onPointerUp, onPointerLeave } = useStudioTilt(reduce);
  const { hitmap, syncHitmap } = useStudioHitmap(stage, artRef);
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

  /**
   * Triggers a brief camera flash on the photo wall.
   * @example onFramesClick() // flash
   */
  function onFramesClick() {
    setFlash(true);
    window.setTimeout(() => setFlash(false), 280);
  }

  const pianoActive = pianoOn(active);
  const bookActive = bookOn(active, "books");
  const deskTip = site.roles[0] ? `Building · ${site.roles[0]}` : "This is my desk";
  const spots = {
    site,
    active,
    setActive,
    drag,
    pianoPlaying,
    hasPiano,
    goodreadsId,
    onPianoToggle,
    onBooksClick,
    onFramesClick,
    pianoActive,
    bookActive,
    deskTip,
    pianoTip,
    bookTip,
  };

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
          <StudioSpotLayer layout="desktop" {...spots} />
          <StudioSpotLayer layout="mobile" {...spots} />
        </div>

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
