"use client";

// External dependencies
import { useEffect, useState } from "react";
import Link from "next/link";

// Application services & types
import type { MemoryItem, PublicContentData } from "@/content/types";
import { useReducedMotion } from "@/hooks/reduced-motion";
import { useJarSize } from "@/hooks/use-jar-size";
import { resolveStarColor, type StarColor } from "@/lib/memory-jar";
import { jarAudio } from "@/lib/memory-jar-audio";

// UI components
import { MasonJar } from "./memory-jar/MasonJar";
import { RevealCard } from "./memory-jar/RevealCard";

/**
 * Renders the interactive memory jar page.
 * @example <MemoryJarExperience content={data} />
 */
export function MemoryJarExperience({ content }: { content: PublicContentData }) {
  const memories = content.memories ?? [];

  const reduce = useReducedMotion();
  const jarSize = useJarSize(440);
  const [activeMemory, setActiveMemory] = useState<MemoryItem | null>(null);
  const [isStirring, setIsStirring] = useState(false);
  const [rising, setRising] = useState(false);
  const [hiddenId, setHiddenId] = useState<string | null>(null);
  const [risingColor, setRisingColor] = useState<StarColor>("yellow");
  const [soundOn, setSoundOn] = useState(true);
  const [revealNonce, setRevealNonce] = useState(0);

  const totalStars = memories.length;
  const jarStatusText =
    totalStars === 0
      ? "your jar is dark — fold your first star."
      : totalStars === 1
        ? "one paper star waits inside."
        : `${totalStars} stars captured inside.`;

  /**
   * Toggles jar sound effects on/off.
   * @example toggleSound() // muted or unmuted
   */
  function toggleSound() {
    jarAudio.enabled = !soundOn;
    setSoundOn(!soundOn);
  }

  /**
   * Picks a random memory, optionally excluding one id.
   * @example pickMemory(activeId) // MemoryItem
   */
  function pickMemory(excludeId?: string | null) {
    const pool = excludeId ? memories.filter((m) => m.id !== excludeId) : memories;
    const list = pool.length > 0 ? pool : memories;
    return list[Math.floor(Math.random() * list.length)];
  }

  /**
   * Starts stir/rise animation then opens a reveal card.
   * @example onJarTap() // RevealCard
   */
  function onJarTap() {
    if (isStirring || memories.length === 0) return;
    const chosen = pickMemory();
    const color = resolveStarColor(chosen.color, chosen.id);
    setRevealNonce((n) => n + 1);

    if (reduce) {
      jarAudio.playChime();
      setActiveMemory(chosen);
      return;
    }

    setIsStirring(true);
    jarAudio.playPop();
    window.setTimeout(() => {
      setIsStirring(false);
      setHiddenId(chosen.id);
      setRisingColor(color);
      setRising(true);
      window.setTimeout(() => {
        jarAudio.playChime();
        setActiveMemory(chosen);
        setRising(false);
      }, 550);
    }, 400);
  }

  /**
   * Reveals another random memory from the jar.
   * @example onUnfoldAnother() // next MemoryItem
   */
  function onUnfoldAnother() {
    if (memories.length === 0) return;
    const next = pickMemory(activeMemory?.id);
    jarAudio.playPop();
    setHiddenId(next.id);
    setActiveMemory(next);
    setRevealNonce((n) => n + 1);
  }

  /**
   * Closes the reveal card and restores the hidden star.
   * @example onCloseReveal() // jar idle
   */
  function onCloseReveal() {
    setActiveMemory(null);
    setHiddenId(null);
  }

  useEffect(() => {
    document.documentElement.classList.add("jar-stars-active");
    return () => document.documentElement.classList.remove("jar-stars-active");
  }, []);

  return (
    <div className="jar-of-stars">
      <div className="flex min-h-screen flex-col overflow-x-hidden pb-12 sm:pb-16">
        <div className="section-shell relative z-20 flex flex-wrap items-center justify-between gap-2 pb-1 pt-3 sm:pt-4">
          <Link href="/" className="jar-site-btn">
            <span aria-hidden>←</span>
            <span>studio</span>
          </Link>
          <button
            type="button"
            className="jar-site-btn"
            onClick={toggleSound}
            aria-pressed={soundOn}
            aria-label={soundOn ? "Mute sound" : "Unmute sound"}
          >
            <span aria-hidden>{soundOn ? "♪" : "✕"}</span>
            <span>{soundOn ? "sound on" : "muted"}</span>
          </button>
        </div>

        <section className="relative flex min-h-0 flex-1 flex-col items-center justify-center pb-1 pt-0 text-center sm:justify-start sm:pb-8 sm:pt-3">
          <div className="jar-title-block absolute top-2 left-0 right-0 z-10 sm:static sm:top-auto sm:z-auto">
            <h1 className="shrink-0 text-2xl leading-none sm:text-5xl">
              {totalStars === 0 ? (
                <>
                  <span className="font-cormorant text-brand-blue">your </span>
                  <span className="font-cormorant text-brand-yellow">jar</span>
                </>
              ) : (
                <span className="font-cormorant text-brand-blue text-2xl sm:text-3xl">tap the jar</span>
              )}
            </h1>
            <p
              className="mx-auto mt-0.5 max-w-xs shrink-0 font-mono-body text-xs text-brand-black sm:mt-3 sm:text-sm"
              aria-live="polite"
            >
              {jarStatusText}
            </p>
          </div>

          <div
            className={`jar-scene relative mt-28 shrink-0 sm:mt-4 ${
              isStirring && !reduce ? "animate-jar-stir" : !reduce ? "animate-float-gentle" : ""
            }`}
          >
            <div aria-hidden className="jar-parchment-mat" />
            <MasonJar
              memories={memories}
              jiggling={false}
              floating={false}
              onTap={onJarTap}
              size={jarSize}
              hiddenMemoryId={hiddenId}
              risingColor={risingColor}
              showRising={rising && !reduce}
            />
          </div>

          {totalStars > 0 && isStirring ? (
            <p className="mt-2 shrink-0 font-mono-body text-xs italic text-brand-black/75 sm:mt-4 sm:text-sm">
              shhh… a star is drifting up
            </p>
          ) : null}
        </section>
      </div>

      {activeMemory ? (
        <RevealCard
          memory={activeMemory}
          nonce={revealNonce}
          onClose={onCloseReveal}
          onPullAnother={onUnfoldAnother}
        />
      ) : null}
    </div>
  );
}
