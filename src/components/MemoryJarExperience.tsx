"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DEFAULT_MEMORIES } from "@/content/memories-default";
import type { MemoryItem, PublicContentData } from "@/content/types";
import { jarAudio } from "@/lib/memory-jar-audio";
import { resolveStarColor, type StarColor } from "@/lib/memory-jar";
import { useReducedMotion } from "@/lib/reduced-motion";
import { useJarSize } from "@/lib/use-jar-size";
import { MasonJar } from "./memory-jar/MasonJar";
import { RevealCard } from "./memory-jar/RevealCard";

export function MemoryJarExperience({ content }: { content: PublicContentData }) {
  const memories = useMemo(() => {
    if (content.memories && content.memories.length > 0) return content.memories;
    return DEFAULT_MEMORIES;
  }, [content.memories]);

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

  function toggleSound() {
    jarAudio.enabled = !soundOn;
    setSoundOn(!soundOn);
  }

  function pickMemory(excludeId?: string | null) {
    const pool = excludeId ? memories.filter((m) => m.id !== excludeId) : memories;
    const list = pool.length > 0 ? pool : memories;
    return list[Math.floor(Math.random() * list.length)];
  }

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

  function onUnfoldAnother() {
    if (memories.length === 0) return;
    const next = pickMemory(activeMemory?.id);
    jarAudio.playPop();
    setHiddenId(next.id);
    setActiveMemory(next);
    setRevealNonce((n) => n + 1);
  }

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
        <div className="relative z-20 flex items-start justify-between gap-2 px-3 pb-1 pt-3 sm:items-center sm:px-6 sm:pt-4">
          <Link href="/" className="jar-chip">
            <span aria-hidden>←</span>
            <span>studio</span>
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              className="jar-chip"
              onClick={toggleSound}
              aria-pressed={soundOn}
              aria-label={soundOn ? "Mute sound" : "Unmute sound"}
            >
              <span aria-hidden>{soundOn ? "♪" : "✕"}</span>
              <span>{soundOn ? "sound on" : "muted"}</span>
            </button>
          </div>
        </div>

        <section className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-1 pb-1 pt-0 text-center sm:justify-start sm:px-6 sm:pb-8 sm:pt-3">
          <div className="jar-title-block absolute top-2 left-0 right-0 z-10 px-1 sm:static sm:top-auto sm:z-auto">
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
