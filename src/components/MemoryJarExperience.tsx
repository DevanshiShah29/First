"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useReducedMotion } from "motion/react";
import type { ContentData, MemoryItem } from "@/content/types";

// Fallback memories in case content has not been seeded yet
const DEFAULT_MEMORIES: MemoryItem[] = [
  {
    id: "mem-1",
    title: "First Shipped Feature",
    note: "Staying up until 2:30 AM watching the very first real user click through a flow I spent weeks designing. Seeing them find exactly what they needed without hesitation felt like pure magic.",
    date: "Summer 2023",
    category: "Milestone",
    icon: "🚀",
    color: "#7C3AED",
  },
  {
    id: "mem-2",
    title: "Late Night Piano Chords",
    note: "Learning Ludovico Einaudi’s 'Nuvole Bianche' measure by measure on a quiet rainy evening. The moment muscle memory took over and the music flowed on its own.",
    date: "October 2023",
    category: "Craft",
    icon: "🎹",
    color: "#6366F1",
  },
  {
    id: "mem-3",
    title: "The Sketchbook on the Train",
    note: "Filling 14 pages of rough wireframes and margin doodles on the morning commute. The most elegant product architecture often starts on wrinkled paper with a ballpoint pen.",
    date: "Spring 2024",
    category: "Discovery",
    icon: "✨",
    color: "#A78BFA",
  },
  {
    id: "mem-4",
    title: "Warm Chai & Bookmarks",
    note: "Finishing 'The Design of Everyday Things' over hot ginger chai on a chilly Sunday. Looking at Norman doors and tea kettles with entirely new eyes forever after.",
    date: "Winter 2024",
    category: "Tiny Joy",
    icon: "☕",
    color: "#F59E0B",
  },
  {
    id: "mem-5",
    title: "Team Breakthrough Moment",
    note: "When our team was stuck on a thorny scope dispute for three days, and we drew the simple 'who is this NOT for' matrix on a whiteboard. The collective sigh of relief in that room was unforgettable.",
    date: "Autumn 2024",
    category: "Milestone",
    icon: "💡",
    color: "#10B981",
  },
  {
    id: "mem-6",
    title: "Stargazing After a Tough Launch",
    note: "Sitting on the rooftop terrace after a high-stakes release week, watching the night sky. Remembering how vast the universe is, and how sweet every tiny finished craft really is.",
    date: "Recent",
    category: "Life",
    icon: "⭐",
    color: "#EC4899",
  },
];

// Ambient sound synthesizer using Web Audio API
class JarAudio {
  private ctx: AudioContext | null = null;
  public enabled = true;

  private init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
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
      // Audio context might be restricted before interaction
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

const STAR_PALETTE = [
  { name: "lavender", base: "#A78BFA", light: "#DDD6FE", deep: "#7C3AED", ink: "#342E38" },
  { name: "yellow", base: "#FBBF24", light: "#FEF08A", deep: "#D97706", ink: "#3A3428" },
  { name: "pink", base: "#F472B6", light: "#FBCFE8", deep: "#DB2777", ink: "#3A322C" },
  { name: "mint", base: "#34D399", light: "#A7F3D0", deep: "#059669", ink: "#2A3430" },
  { name: "sky", base: "#60A5FA", light: "#BFDBFE", deep: "#2563EB", ink: "#2C3238" },
  { name: "coral", base: "#FB7185", light: "#FECDD3", deep: "#E11D48", ink: "#3A3028" },
  { name: "peach", base: "#FDBA74", light: "#FED7AA", deep: "#EA580C", ink: "#3A3228" },
];

/**
 * 3D Origami Folded Lucky Star SVG Group (Renderable inside SVG viewBox)
 */
function OrigamiStarGroup({
  cx,
  cy,
  size = 32,
  color,
  rotation = 0,
}: {
  cx: number;
  cy: number;
  size?: number;
  color?: string;
  rotation?: number;
}) {
  const palette = STAR_PALETTE.find((p) => p.name === color || p.base === color) || STAR_PALETTE[0];
  const starColor = color?.startsWith("#") ? color : palette.base;
  const scale = size / 100;

  return (
    <g transform={`translate(${cx}, ${cy}) rotate(${rotation}) scale(${scale}) translate(-50, -50)`}>
      {/* 10 Facets of Origami Star (Center: 50,50) */}
      <polygon points="50,50 50,8 63,38" fill={starColor} fillOpacity="0.95" />
      <polygon points="50,50 63,38 92,38" fill={starColor} fillOpacity="0.65" />
      <polygon points="50,50 92,38 67,58" fill={starColor} fillOpacity="0.88" />
      <polygon points="50,50 67,58 76,90" fill={starColor} fillOpacity="0.55" />
      <polygon points="50,50 76,90 50,71" fill={starColor} fillOpacity="0.82" />
      <polygon points="50,50 50,71 24,90" fill={starColor} fillOpacity="0.6" />
      <polygon points="50,50 24,90 33,58" fill={starColor} fillOpacity="0.85" />
      <polygon points="50,50 33,58 8,38" fill={starColor} fillOpacity="0.68" />
      <polygon points="50,50 8,38 37,38" fill={starColor} fillOpacity="0.92" />
      <polygon points="50,50 37,38 50,8" fill={starColor} fillOpacity="0.75" />

      {/* Crease line strokes for paper fold look */}
      <line x1="50" y1="50" x2="50" y2="8" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" />
      <line x1="50" y1="50" x2="92" y2="38" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" />
      <line x1="50" y1="50" x2="76" y2="90" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" />
      <line x1="50" y1="50" x2="24" y2="90" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" />
      <line x1="50" y1="50" x2="8" y2="38" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" />

      {/* Center vertex highlight */}
      <circle cx="50" cy="50" r="1.8" fill="#ffffff" fillOpacity="0.9" />
    </g>
  );
}

/**
 * Standalone 3D Origami Folded Paper Star SVG
 */
function OrigamiStar({
  size = 32,
  color,
  className = "",
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`drop-shadow-sm transition-transform ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      <OrigamiStarGroup cx={50} cy={50} size={100} color={color} />
    </svg>
  );
}

export function MemoryJarExperience({ content }: { content: ContentData }) {
  const memories = useMemo(() => {
    if (content.memories && content.memories.length > 0) {
      return content.memories;
    }
    return DEFAULT_MEMORIES;
  }, [content.memories]);

  const reduce = useReducedMotion();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [activeMemory, setActiveMemory] = useState<MemoryItem | null>(null);
  const [isStirring, setIsStirring] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  // Background floating drifting stars in modal backdrop like alittlejarofstars
  const backdropStars = useMemo(() => {
    return Array.from({ length: 32 }).map((_, i) => {
      const seed = (i * 23) % 100;
      return {
        id: i,
        top: 6 + ((i * 17 + seed) % 86),
        left: 4 + ((i * 29 + (seed % 34)) % 92),
        size: 16 + (i % 4) * 8,
        delay: (i * 0.3) % 4,
        dur: 4.5 + (i % 3) * 0.7,
        color: STAR_PALETTE[i % STAR_PALETTE.length].base,
        drift: ["animate-paper-drift-a", "animate-paper-drift-b", "animate-paper-drift-c"][i % 3],
        depth: 0.3 + ((i % 5) * 0.14),
      };
    });
  }, []);

  function toggleSound() {
    audio.enabled = !soundOn;
    setSoundOn(!soundOn);
  }

  function openMemory(item: MemoryItem, noteIndex = 0) {
    audio.playChime(noteIndex);
    setActiveMemory(item);
  }

  function onJarTap() {
    if (isStirring || memories.length === 0) return;
    const chosenIndex = Math.floor(Math.random() * memories.length);
    const chosen = memories[chosenIndex];
    if (reduce) {
      openMemory(chosen, chosenIndex);
      return;
    }
    setIsStirring(true);
    audio.playPop();
    window.setTimeout(() => {
      setIsStirring(false);
      openMemory(chosen, chosenIndex);
    }, 280);
  }

  // Unfold another memory from within the modal
  function onUnfoldAnother() {
    if (memories.length === 0) return;
    const currentId = activeMemory?.id;
    const remaining = memories.filter((m) => m.id !== currentId);
    const nextMem = remaining.length > 0
      ? remaining[Math.floor(Math.random() * remaining.length)]
      : memories[0];

    audio.playPop();
    if (reduce) {
      setActiveMemory(nextMem);
      return;
    }
    setActiveMemory(null);
    window.setTimeout(() => {
      setActiveMemory(nextMem);
    }, 160);
  }

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (activeMemory) {
      if (!el.open) el.showModal();
    } else if (el.open) {
      el.close();
    }
  }, [activeMemory]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    function onClose() {
      setActiveMemory(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setActiveMemory(null);
    }
    el.addEventListener("close", onClose);
    el.addEventListener("keydown", onKey);
    return () => {
      el.removeEventListener("close", onClose);
      el.removeEventListener("keydown", onKey);
    };
  }, []);

  const totalStars = memories.length;
  const jarStatusText =
    totalStars === 0
      ? "your jar is quiet — add your first memory in /admin."
      : totalStars === 1
        ? "one paper star waits inside."
        : `${totalStars} stars captured inside.`;

  return (
    <div className="w-full min-h-[calc(100vh-12rem)] flex flex-col justify-between items-center mx-auto px-4 py-6 sm:py-10">
      <div className="section-shell mx-auto flex w-full max-w-4xl items-center justify-between">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 rounded-full border border-line bg-card/60 px-4 py-2 text-xs text-muted backdrop-blur-md transition hover:border-accent-hover hover:text-foreground sm:text-sm"
        >
          <span aria-hidden="true" className="transition-transform group-hover:-translate-x-1">
            ←
          </span>
          <span>Studio</span>
        </Link>

        <button
          type="button"
          onClick={toggleSound}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card/60 px-3.5 py-1.5 text-xs text-muted backdrop-blur-md transition hover:text-foreground"
          aria-pressed={soundOn}
          aria-label={soundOn ? "Mute sound" : "Unmute sound"}
        >
          <span aria-hidden="true">{soundOn ? "🔔" : "🔕"}</span>
          <span>{soundOn ? "Sound on" : "Muted"}</span>
        </button>
      </div>

      {/* Center Stage: Title + Mason Jar + Status */}
      <section className="w-full max-w-xl flex flex-col items-center justify-center text-center mx-auto my-auto py-8">
        {/* Title area */}
        <div className="mb-4 text-center mx-auto">
          <h1 className="text-3xl sm:text-5xl font-serif tracking-tight text-foreground text-center">
            {totalStars === 0 ? "your jar" : "tap the jar"}
          </h1>
          <p className="mt-2 text-center font-mono text-xs text-muted sm:text-sm" aria-live="polite">
            {isStirring ? (
              <span className="italic text-accent-text">A star is coming out of the jar.</span>
            ) : (
              jarStatusText
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={onJarTap}
          className="jar-tap"
          aria-haspopup="dialog"
          aria-expanded={Boolean(activeMemory)}
          aria-controls="memory-dialog"
          disabled={totalStars === 0 || isStirring}
          aria-label={totalStars === 0 ? "Memory jar is empty" : "Open a memory from the jar"}
        >
         <svg
          className={`h-80 w-60 sm:h-96 sm:w-72 ${
            isStirring && !reduce ? "animate-jar-stir" : reduce ? "" : "animate-float-gentle"
          }`}
          aria-hidden="true"
          focusable="false"
            viewBox="0 0 240 320"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="jarGlassFlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(255, 255, 255, 0.45)" />
                <stop offset="35%" stopColor="rgba(255, 255, 255, 0.08)" />
                <stop offset="70%" stopColor="rgba(167, 139, 250, 0.14)" />
                <stop offset="100%" stopColor="rgba(255, 255, 255, 0.3)" />
              </linearGradient>

              <linearGradient id="corkStopperFlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#966B44" />
                <stop offset="50%" stopColor="#D4A373" />
                <stop offset="100%" stopColor="#7E542F" />
              </linearGradient>

              <radialGradient id="nebulaCoreFlow" cx="50%" cy="65%" r="55%">
                <stop offset="0%" stopColor="var(--brand-from, #7C3AED)" stopOpacity="0.45" />
                <stop offset="60%" stopColor="var(--brand-to, #6366F1)" stopOpacity="0.18" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </radialGradient>

              <linearGradient id="specularGlazeFlow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(255, 255, 255, 0.75)" />
                <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
              </linearGradient>
            </defs>

            {/* Pedestal Mat underneath the jar */}
            <ellipse cx="120" cy="306" rx="90" ry="10" fill="var(--brand-from, #7C3AED)" fillOpacity="0.15" />

            {/* Cork Lid */}
            <g className="transition-transform duration-300 group-hover:-translate-y-1">
              <path
                d="M80 34 H160 V52 C160 55 156 58 150 58 H90 C84 58 80 55 80 52 Z"
                fill="url(#corkStopperFlow)"
                stroke="#5C3B1E"
                strokeWidth="1.5"
              />
              <ellipse cx="120" cy="34" rx="44" ry="8" fill="#D4A373" stroke="#7E542F" strokeWidth="1.5" />
            </g>

            {/* Glass Jar Neck Lip */}
            <ellipse
              cx="120"
              cy="56"
              rx="48"
              ry="9"
              fill="url(#jarGlassFlow)"
              stroke="rgba(255, 255, 255, 0.55)"
              strokeWidth="2.5"
            />

            {/* Jar Body Shape */}
            <path
              d="M72 58 C55 64 35 90 35 130 C35 190 38 270 50 290 C58 302 78 308 120 308 C162 308 182 302 190 290 C202 270 205 190 205 130 C205 90 185 64 168 58 Z"
              fill="url(#jarGlassFlow)"
              stroke="rgba(255, 255, 255, 0.45)"
              strokeWidth="2"
            />

            {/* Inner Nebula Glow fill */}
            <path
              d="M72 65 C55 70 42 95 42 135 C42 190 44 265 55 282 C62 292 80 298 120 298 C160 298 178 292 185 282 C196 265 198 190 198 135 C198 95 185 70 168 65 Z"
              fill="url(#nebulaCoreFlow)"
            />

            {/* 3D Folded Origami Stars rendered directly inside jar coordinates */}
            {memories.map((mem, idx) => {
              const color = mem.color || STAR_PALETTE[idx % STAR_PALETTE.length].base;
              const seed = (idx * 47) % 100;
              const cx = 75 + ((idx * 33 + seed) % 95);
              const cy = 120 + ((idx * 28 + (seed % 40)) % 145);
              const size = 30 + (idx % 3) * 4;
              const rot = (idx * 42) % 360;

              return (
                <OrigamiStarGroup
                  key={mem.id}
                  cx={cx}
                  cy={cy}
                  size={size}
                  color={color}
                  rotation={rot}
                />
              );
            })}

            {/* Curved Specular Glass Highlights */}
            <path
              d="M52 105 C48 130 48 180 52 245 C54 265 57 275 62 280 C60 270 56 250 56 230 C53 180 54 130 58 105 Z"
              fill="url(#specularGlazeFlow)"
              opacity="0.85"
            />
            <path
              d="M188 120 C191 145 191 195 187 250 C185 260 183 268 180 272 C183 265 185 250 185 235 C187 195 187 145 184 120 Z"
              fill="url(#specularGlazeFlow)"
              opacity="0.45"
            />

            {/* Jar Base Ring */}
            <ellipse
              cx="120"
              cy="295"
              rx="68"
              ry="9"
              fill="none"
              stroke="rgba(255, 255, 255, 0.35)"
              strokeWidth="1.5"
            />

            {/* Ambient Sparkles */}
            <text x="18" y="48" fill="var(--brand-from, #A78BFA)" fontSize="18" fillOpacity="0.85">✦</text>
            <text x="215" y="110" fill="var(--brand-from, #A78BFA)" fontSize="14" fillOpacity="0.75">✦</text>
            <text x="15" y="270" fill="var(--brand-from, #A78BFA)" fontSize="16" fillOpacity="0.65">✦</text>
          </svg>
        </button>

        {memories.length > 0 ? (
          <details className="mt-8 w-full max-w-lg text-left">
            <summary className="cursor-pointer rounded-md py-2 text-sm text-muted">
              Browse all memories
            </summary>
            <ol className="mt-4 space-y-6">
              {memories.map((mem) => (
                <li key={mem.id}>
                  <article>
                    <h2 className="text-lg font-semibold text-foreground">{mem.title || "Memory"}</h2>
                    {mem.date || mem.category ? (
                      <p className="mt-1 font-mono text-xs text-muted">
                        {[mem.category, mem.date].filter(Boolean).join(" · ")}
                      </p>
                    ) : null}
                    <p className="mt-2 text-sm leading-6 text-muted">{mem.note}</p>
                    {mem.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={mem.photoUrl}
                        alt=""
                        className="mt-3 max-h-48 w-full rounded-lg object-cover"
                      />
                    ) : null}
                  </article>
                </li>
              ))}
            </ol>
          </details>
        ) : null}
      </section>

      <p className="py-2 text-center font-mono text-xs text-muted-soft">
        <span aria-hidden="true">✦ </span>Every star holds a tiny story
      </p>

      <dialog
        id="memory-dialog"
        ref={dialogRef}
        className="memory-dialog"
        aria-labelledby={titleId}
        onClick={(e) => {
          if (e.target === e.currentTarget) setActiveMemory(null);
        }}
      >
        {activeMemory ? (
          <>
            <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
              {backdropStars.map((s) => (
                <span
                  key={s.id}
                  className={`fixed ${reduce ? "" : s.drift}`}
                  style={{
                    top: `${s.top}%`,
                    left: `${s.left}%`,
                    opacity: s.depth,
                    animationDelay: `${s.delay}s`,
                    animationDuration: `${s.dur}s`,
                  }}
                >
                  <OrigamiStar size={s.size} color={s.color} />
                </span>
              ))}
            </div>

            <div
              className={`relative z-10 my-auto w-full max-w-md sm:max-w-lg ${reduce ? "" : "animate-paper-unfold"}`}
            >
              <div
                className="rounded-[22px_26px_20px_24px/24px_20px_26px_22px] border border-line bg-card p-6 shadow-2xl sm:p-9"
                style={{
                  boxShadow: "0 20px 45px rgba(0, 0, 0, 0.4), 2px 4px 14px rgba(60, 40, 20, 0.15)",
                  backgroundImage:
                    "repeating-linear-gradient(to bottom, transparent, transparent 27px, color-mix(in srgb, var(--brand-from, #7C3AED) 8%, transparent) 27px, color-mix(in srgb, var(--brand-from, #7C3AED) 8%, transparent) 28px)",
                }}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <h2 id={titleId} className="text-xl font-semibold text-foreground">
                    {activeMemory.title || "Memory"}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveMemory(null)}
                    className="icon-btn rounded-full p-2 text-muted transition-colors hover:bg-chip/80 hover:text-foreground"
                    aria-label="Close memory"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mb-4 flex justify-center">
                  <OrigamiStar size={46} color={activeMemory.color || STAR_PALETTE[0].base} />
                </div>

                {activeMemory.photoUrl ? (
                  <div className="my-4 overflow-hidden rounded-xl border-6 border-white bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeMemory.photoUrl}
                      alt={activeMemory.title ? `Photo for ${activeMemory.title}` : ""}
                      className="max-h-50 w-full rounded-lg object-cover"
                    />
                  </div>
                ) : null}

                <p className="my-5 whitespace-pre-wrap break-words px-2 text-center font-serif text-lg italic leading-relaxed text-foreground">
                  “{activeMemory.note}”
                </p>

                <div className="mt-4 flex items-center justify-center gap-2 font-mono text-xs text-muted">
                  {activeMemory.category ? (
                    <span className="rounded-full bg-chip px-3 py-1 font-medium text-accent-text">
                      {activeMemory.category}
                    </span>
                  ) : null}
                  {activeMemory.date ? <span className="text-muted-soft">{activeMemory.date}</span> : null}
                </div>

                <div className="mt-8 flex items-center justify-center gap-3.5 border-t border-line/60 pt-6">
                  <button type="button" onClick={() => setActiveMemory(null)}>
                    tuck it back
                  </button>
                  <button type="button" onClick={onUnfoldAnother}>
                    unfold another
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </dialog>
    </div>
  );
}
