"use client";

// External dependencies
import { useEffect, useRef, useState } from "react";

// Application services & types
import { siteHasPiano } from "@/content/types";
import type { PublicSiteContent, SiteContent } from "@/content/types";
import { goodreadsUserId } from "@/lib/goodreads";

/**
 * Shared piano iframe playback + “taking a break” rest tips for interactive heroes.
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

  function stopMusic() {
    iframeRef.current?.remove();
    iframeRef.current = null;
    audioHost.current?.replaceChildren();
  }

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

  function onBooksClick() {
    if (goodreadsId) return;
    window.clearTimeout(restTimer.current);
    setBookRest(true);
    restTimer.current = window.setTimeout(() => setBookRest(false), 2400);
  }

  function pianoOn(activeId: string | null) {
    return activeId === "piano" || pianoPlaying || pianoRest;
  }

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
