"use client";

// External dependencies
import { useEffect, useRef, useState } from "react";

// Application services & types
import { siteHasPiano } from "@/content/types";
import type { PublicSiteContent, SiteContent } from "@/content/types";
import { goodreadsUserId } from "@/lib/goodreads";

/**
 * Piano iframe playback and rest-tip state for interactive heroes.
 * @example usePianoPlayback(site) // { audioHost, onPianoToggle, … }
 */
export function usePianoPlayback(site: PublicSiteContent | SiteContent) {
  const audioHost = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const restTimer = useRef<number | undefined>(undefined);
  const [pianoPlaying, setPianoPlaying] = useState(false);
  const [pianoRest, setPianoRest] = useState(false);
  const [bookRest, setBookRest] = useState(false);

  const hasPiano = siteHasPiano(site);
  const goodreadsId = goodreadsUserId(site.goodreadsUrl ?? "");

  /**
   * Removes the piano iframe from the audio host.
   * @example stopMusic() // void
   */
  function stopMusic() {
    iframeRef.current?.remove();
    iframeRef.current = null;
    audioHost.current?.replaceChildren();
  }

  /**
   * Mounts a fresh piano media iframe.
   * @example startMusic() // void
   */
  function startMusic() {
    const host = audioHost.current;
    if (!host) return;
    stopMusic();
    const iframe = document.createElement("iframe");
    iframe.className = "world-audio";
    iframe.title = "Piano music";
    iframe.allow = "autoplay; encrypted-media";
    iframe.setAttribute("aria-hidden", "true");
    iframe.tabIndex = -1;
    iframe.src = `/api/media/piano?t=${Date.now()}`;
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

  /**
   * Toggles piano playback or shows the rest tip.
   * @example onPianoToggle() // void
   */
  function onPianoToggle() {
    window.clearTimeout(restTimer.current);
    if (!hasPiano) {
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
    startMusic();
    setPianoPlaying(true);
  }

  /**
   * Shows the books rest tip when Goodreads is missing.
   * @example onBooksClick() // void
   */
  function onBooksClick() {
    if (goodreadsId) return;
    window.clearTimeout(restTimer.current);
    setBookRest(true);
    restTimer.current = window.setTimeout(() => setBookRest(false), 2400);
  }

  /**
   * Whether the piano hotspot should look active.
   * @example pianoOn("piano") // true
   */
  function pianoOn(activeId: string | null) {
    return activeId === "piano" || pianoPlaying || pianoRest;
  }

  /**
   * Whether the book hotspot should look active.
   * @example bookOn(null) // false
   */
  function bookOn(activeId: string | null, bookSpotId = "book") {
    return activeId === bookSpotId || bookRest;
  }

  const pianoTip = pianoPlaying
    ? null
    : !hasPiano
      ? "The piano is taking a break 🎹"
      : "Play something 🎵";

  const bookTip = !goodreadsId ? "The books are taking a break 📚" : "Open my books";

  return {
    audioHost,
    pianoPlaying,
    pianoRest,
    bookRest,
    hasPiano,
    goodreadsId,
    onPianoToggle,
    onBooksClick,
    stopMusic,
    pianoOn,
    bookOn,
    pianoTip,
    bookTip,
  };
}
