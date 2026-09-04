"use client";

import { useCallback, useEffect, useId, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useReducedMotion } from "@/lib/reduced-motion";
import type { ContentData, MemoryItem } from "@/content/types";
import {
  JAR_ASSETS,
  JAR_STAR_BOUNDS,
  PAPER_THEMES,
  resolveStarColor,
  type StarColor,
} from "@/lib/memory-jar";

const DEFAULT_MEMORIES: MemoryItem[] = [
  {
    id: "mem-1",
    title: "First Shipped Feature",
    note: "Staying up until 2:30 AM watching the very first real user click through a flow I spent weeks designing. Seeing them find exactly what they needed without hesitation felt like pure magic.",
    date: "Summer 2023",
    category: "Milestone",
    color: "lavender",
  },
  {
    id: "mem-2",
    title: "Late Night Piano Chords",
    note: "Learning Ludovico Einaudi's 'Nuvole Bianche' measure by measure on a quiet rainy evening. The moment muscle memory took over and the music flowed on its own.",
    date: "October 2023",
    category: "Craft",
    color: "sky",
  },
  {
    id: "mem-3",
    title: "The Sketchbook on the Train",
    note: "Filling 14 pages of rough wireframes and margin doodles on the morning commute. The most elegant product architecture often starts on wrinkled paper with a ballpoint pen.",
    date: "Spring 2024",
    category: "Discovery",
    color: "yellow",
  },
  {
    id: "mem-4",
    title: "Warm Chai & Bookmarks",
    note: "Finishing 'The Design of Everyday Things' over hot ginger chai on a chilly Sunday. Looking at Norman doors and tea kettles with entirely new eyes forever after.",
    date: "Winter 2024",
    category: "Tiny Joy",
    color: "peach",
  },
  {
    id: "mem-5",
    title: "Team Breakthrough Moment",
    note: "When our team was stuck on a thorny scope dispute for three days, and we drew the simple 'who is this NOT for' matrix on a whiteboard. The collective sigh of relief in that room was unforgettable.",
    date: "Autumn 2024",
    category: "Milestone",
    color: "mint",
  },
  {
    id: "mem-6",
    title: "Stargazing After a Tough Launch",
    note: "Sitting on the rooftop terrace after a high-stakes release week, watching the night sky. Remembering how vast the universe is, and how sweet every tiny finished craft really is.",
    date: "Recent",
    category: "Life",
    color: "pink",
  },
];

class JarAudio {
  private ctx: AudioContext | null = null;
  public enabled = true;

  private init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") void this.ctx.resume();
  }

  playChime(noteIndex = 0) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
      const freq = notes[noteIndex % notes.length];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, this.ctx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 1.25);
    } catch {
      // Audio may be blocked before a gesture
    }
  }

  playPop() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(820, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch {
      // Ignore
    }
  }
}

const audio = new JarAudio();

function PaperStar({
  color,
  size = 32,
  className = "",
  style,
}: {
  color: StarColor;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={JAR_ASSETS.star(color)}
      alt=""
      width={size}
      height={Math.round(size * 0.67)}
      className={`paper-star ${className}`}
      style={style}
      draggable={false}
    />
  );
}

function useJarSize(base = 440) {
  const [size, setSize] = useState(base);

  useEffect(() => {
    function measure() {
      const width = window.visualViewport?.width ?? window.innerWidth;
      const height = window.visualViewport?.height ?? window.innerHeight;
      if (width >= 640) {
        setSize(base);
        return;
      }
      const capped = (height - 80) / 1.3;
      setSize(Math.max(320, Math.floor(Math.min(base, capped))));
    }
    measure();
    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
    };
  }, [base]);

  return size;
}

function MasonJar({
  memories,
  jiggling,
  floating,
  onTap,
  size,
  hiddenMemoryId,
  risingColor,
  showRising,
}: {
  memories: MemoryItem[];
  jiggling: boolean;
  floating: boolean;
  onTap: () => void;
  size: number;
  hiddenMemoryId?: string | null;
  risingColor?: StarColor;
  showRising?: boolean;
}) {
  const reduce = useReducedMotion();
  const visible = memories.slice(-Math.min(memories.length, 24)).filter((m) => m.id !== hiddenMemoryId);
  const width = size;
  const height = size * 1.3;
  const areaW = ((JAR_STAR_BOUNDS.right - JAR_STAR_BOUNDS.left) / 100) * width;
  const areaH = ((JAR_STAR_BOUNDS.bottom - JAR_STAR_BOUNDS.top) / 100) * height;
  const riseSize = Math.max(40, Math.round(size * 0.108));

  const stars = visible.map((mem) => {
    const color = resolveStarColor(mem.color, mem.id);
    const t = mem.id.charCodeAt(0) + mem.id.charCodeAt(mem.id.length - 1);
    const starSize = Math.round(size * 0.082) + (t % Math.round(size * 0.038));
    const pad = starSize * 0.55 + 12;
    const maxX = Math.max(pad, areaW - pad);
    const maxY = Math.max(pad, areaH - pad);
    const leftPct = ((pad + ((t * 37) % 997) / 997 * (maxX - pad)) / areaW) * 100;
    const topPct = ((pad + ((t * 53) % 991) / 991 * (maxY - pad)) / areaH) * 100;
    const delay = (t % 40) / 10;
    const dur = 4.5 + (t % 20) / 10;
    const drift = ["animate-paper-drift-a", "animate-paper-drift-b", "animate-paper-drift-c"][t % 3];
    return { id: mem.id, leftPct, topPct, size: starSize, delay, dur, drift, color };
  });

  const motionClass = jiggling && !reduce
    ? "animate-jar-stir"
    : floating && !reduce
      ? "animate-float-gentle"
      : "";

  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={memories.length > 0 ? "tap the jar to open" : "your jar"}
      className={`relative z-[1] inline-block btn-bare jar-btn ${motionClass}`}
      style={{ width, height }}
      disabled={memories.length === 0 || jiggling}
    >
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={JAR_ASSETS.masonJar}
          alt=""
          width={1024}
          height={1024}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          draggable={false}
          className="jar-photo jar-photo--light relative h-full w-full select-none object-contain object-[center_10%]"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={JAR_ASSETS.masonJarDark}
          alt=""
          width={1024}
          height={1024}
          loading="eager"
          decoding="async"
          draggable={false}
          className="jar-photo jar-photo--dark absolute inset-0 h-full w-full select-none object-contain object-[center_10%]"
        />
        {/* Dark interior wash below the lid; stars sit above it */}
        <div
          aria-hidden
          className="jar-interior-shade absolute pointer-events-none"
          style={{
            left: `${JAR_STAR_BOUNDS.left}%`,
            right: `${100 - JAR_STAR_BOUNDS.right}%`,
            top: `${JAR_STAR_BOUNDS.top}%`,
            bottom: `${100 - JAR_STAR_BOUNDS.bottom}%`,
          }}
        />
        <div
          aria-hidden
          className="jar-inner-stars absolute pointer-events-none"
          style={{
            left: `${JAR_STAR_BOUNDS.left}%`,
            right: `${100 - JAR_STAR_BOUNDS.right}%`,
            top: `${JAR_STAR_BOUNDS.top}%`,
            bottom: `${100 - JAR_STAR_BOUNDS.bottom}%`,
          }}
        >
          {stars.map((star) => (
            <span
              key={star.id}
              className="absolute"
              style={{
                left: `${star.leftPct}%`,
                top: `${star.topPct}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <span
                className={reduce ? undefined : star.drift}
                style={{ display: "inline-block", animationDelay: `${star.delay}s` }}
              >
                <PaperStar
                  size={star.size}
                  color={star.color}
                  style={{
                    animationDelay: `${star.delay}s`,
                    animationDuration: `${star.dur}s`,
                  }}
                />
              </span>
            </span>
          ))}
        </div>
      </div>

      {showRising && risingColor ? (
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[22%] z-10 animate-orb-rise"
          style={{ marginLeft: -riseSize / 2, marginTop: -riseSize / 2 }}
        >
          <PaperStar size={riseSize} color={risingColor} />
        </span>
      ) : null}

      <span aria-hidden className="absolute top-8 -left-1 text-lg text-lavender/70 animate-twinkle-slow">
        ✦
      </span>
      <span
        aria-hidden
        className="absolute top-20 -right-2 text-xs text-lavender/60 animate-twinkle-slow"
        style={{ animationDelay: "1.2s" }}
      >
        ✦
      </span>
      <span
        aria-hidden
        className="absolute bottom-14 -left-3 text-sm text-lavender/50 animate-twinkle-slow"
        style={{ animationDelay: "2.4s" }}
      >
        ✦
      </span>
    </button>
  );
}

function RevealCard({
  memory,
  nonce = 0,
  onClose,
  onPullAnother,
}: {
  memory: MemoryItem;
  nonce?: number;
  onClose: () => void;
  onPullAnother: () => void;
}) {
  const reduce = useReducedMotion();
  const color = resolveStarColor(memory.color, memory.id);
  const theme = PAPER_THEMES[color];
  const titleId = useId();

  const handleClose = useCallback(() => {
    audio.playPop();
    onClose();
  }, [onClose]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        handleClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  const backdropStars = useMemo(() => {
    let seed = 0;
    for (let i = 0; i < memory.id.length; i++) seed = (seed * 31 + memory.id.charCodeAt(i)) >>> 0;
    const rand = (n: number) => {
      const t = Math.sin(n + seed) * 10000;
      return t - Math.floor(t);
    };
    return Array.from({ length: 56 }, (_, i) => {
      const size = 12 + rand(i * 7.3) * 34;
      return {
        id: i,
        top: rand(i * 3.1) * 100,
        left: rand(i * 5.7) * 100,
        size,
        delay: rand(i * 11.9) * 6,
        dur: 7 + rand(i * 2.5) * 8,
        drift: ["animate-paper-drift-a", "animate-paper-drift-b", "animate-paper-drift-c"][i % 3],
        depth: 0.32 + rand(i * 8.2) * 0.68,
      };
    });
  }, [memory.id]);

  const hasPhoto = Boolean(memory.photoUrl);
  const cleanNote = memory.note.replace(/^["“'‘]([\s\S]*)["”'’]$/, "$1").trim();

  return (
    <div
      className={`jar-reveal-backdrop jar-reveal-backdrop--${color} fixed inset-0 z-50 flex items-center justify-center p-4 animate-reveal-backdrop ${
        hasPhoto ? "overflow-y-auto" : "overflow-hidden"
      }`}
      style={{
        background: `var(--reveal-bg, ${theme.background})`,
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {backdropStars.map((star) => (
          <span
            key={star.id}
            className={`absolute ${reduce ? "" : star.drift}`}
            style={{
              top: `${star.top}%`,
              left: `${star.left}%`,
              opacity: star.depth,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.dur}s`,
            }}
          >
            <PaperStar size={star.size} color={color} />
          </span>
        ))}
      </div>

      {!reduce ? (
        <span
          key={`star-${memory.id}-${nonce}`}
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 z-20 animate-paper-unfold-star"
        >
          <PaperStar size={72} color={color} />
        </span>
      ) : null}

      <div
        key={`card-${memory.id}-${nonce}`}
        className={`relative z-10 w-full ${reduce ? "" : "animate-paper-unfold"} ${
          hasPhoto ? "max-w-lg" : "max-w-md"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div
          className={`star-paper-sheet${hasPhoto ? " star-paper-sheet--with-photo" : ""}`}
          style={
            {
              "--parchment-mask": `url(${JAR_ASSETS.parchment})`,
              "--paper-line": theme.line,
            } as CSSProperties
          }
        >
          <div
            aria-hidden
            className="star-paper-sheet__fill"
            style={{
              background: `linear-gradient(152deg, ${theme.paperLight} 0%, ${theme.paper} 48%, ${theme.paperDeep} 100%)`,
            }}
          />
          <div
            aria-hidden
            className="star-paper-sheet__craft"
            style={{ backgroundImage: `url(${JAR_ASSETS.paper(color)})` }}
          />
          <div aria-hidden className="star-paper-sheet__fiber" />
          <div aria-hidden className="star-paper-sheet__grain" />
          <div aria-hidden className="star-paper-sheet__lines" />
          <div aria-hidden className="star-paper-sheet__tape" />

          <div
            className={`star-paper-sheet__content star-paper-sheet__content--reveal${
              hasPhoto ? " star-paper-sheet__content--with-photo" : ""
            }`}
            style={{ color: theme.ink }}
          >
            <button
              type="button"
              onClick={handleClose}
              className="btn-bare star-paper-sheet__close group"
              style={{ color: theme.ink }}
              aria-label="Tuck memory back into jar"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full transition-all duration-150 group-hover:scale-110 group-hover:bg-black/5 dark:group-hover:bg-white/10 group-active:scale-95">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
                  <path
                    d="M18 6 6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </button>

            <h2 id={titleId} className="sr-only">
              {memory.title || "Memory"}
            </h2>

            {memory.photoUrl ? (
              <div className="mt-2 flex justify-center">
                <div
                  className="overflow-hidden p-1.5 shadow-md"
                  style={{
                    backgroundColor: theme.photoBorder,
                    border: `1px solid color-mix(in srgb, ${theme.ink} 15%, transparent)`,
                    borderRadius: "4px 10px 6px 8px",
                    transform: "rotate(-1.4deg)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={memory.photoUrl}
                    alt={memory.title || "Memory photo"}
                    className="max-h-48 w-full object-cover select-none"
                    draggable={false}
                  />
                </div>
              </div>
            ) : null}

            <p
              className="mt-5 whitespace-pre-wrap break-words text-center font-serif-italic text-2xl sm:text-3xl leading-snug sm:leading-relaxed"
              style={{ color: theme.ink }}
            >
              “{cleanNote}”
            </p>

            <div
              className="mt-4 flex flex-wrap items-center justify-center gap-2 font-mono-body text-xs tracking-wider uppercase opacity-75"
              style={{ color: theme.inkMuted }}
            >
              {memory.category ? (
                <span className="inline-flex items-center gap-1">
                  <span aria-hidden className="text-[10px] opacity-60">✦</span>
                  <span>{memory.category}</span>
                </span>
              ) : null}
              {memory.category && memory.date ? <span aria-hidden>·</span> : null}
              {memory.date ? <span>{memory.date}</span> : null}
            </div>

            <div className="star-paper-sheet__footer mt-7 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="jar-action-btn jar-action-btn--tuck group"
                style={
                  {
                    "--btn-ink": theme.ink,
                  } as CSSProperties
                }
              >
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform duration-200 group-hover:-translate-x-0.5"
                  aria-hidden
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span>tuck it back</span>
              </button>

              <button
                type="button"
                onClick={onPullAnother}
                className="jar-action-btn jar-action-btn--unfold group"
                style={
                  {
                    "--btn-ink": theme.ink,
                    "--btn-accent": theme.paperDeep,
                  } as CSSProperties
                }
              >
                <span
                  aria-hidden
                  className="text-xs transition-transform duration-300 group-hover:rotate-45 select-none"
                >
                  ✦
                </span>
                <span>unfold another</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MemoryJarExperience({ content }: { content: ContentData }) {
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
    audio.enabled = !soundOn;
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
      audio.playChime();
      setActiveMemory(chosen);
      return;
    }

    setIsStirring(true);
    audio.playPop();
    window.setTimeout(() => {
      setIsStirring(false);
      setHiddenId(chosen.id);
      setRisingColor(color);
      setRising(true);
      window.setTimeout(() => {
        audio.playChime();
        setActiveMemory(chosen);
        setRising(false);
      }, 550);
    }, 400);
  }

  function onUnfoldAnother() {
    if (memories.length === 0) return;
    const next = pickMemory(activeMemory?.id);
    audio.playPop();
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
