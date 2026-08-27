"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ContentData, MemoryItem } from "@/content/types";

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
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98]; // C5, E5, G5, C6, E6, G6
      const freq = notes[noteIndex % notes.length];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, this.ctx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 1.25);
    } catch {
      // AudioContext might be blocked until user interaction
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
      osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.1);
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

const STAR_COLORS = ["#A78BFA", "#FBBF24", "#F472B6", "#34D399", "#60A5FA", "#F87171", "#C084FC"];

export function MemoryJarExperience({ content }: { content: ContentData }) {
  const reduce = useReducedMotion();
  const memories = useMemo(
    () => (content.memories && content.memories.length > 0 ? content.memories : []),
    [content.memories]
  );

  // Unlocked memory IDs
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  // Currently active memory card
  const [activeMemory, setActiveMemory] = useState<MemoryItem | null>(null);
  // Opening animation states
  const [isOpening, setIsOpening] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [jarHovered, setJarHovered] = useState(false);
  const [showAllTray, setShowAllTray] = useState(true);
  const unopenedMemories = useMemo(
    () => memories.filter((m) => !unlockedIds.includes(m.id)),
    [memories, unlockedIds]
  );
  const openedMemories = useMemo(
    () => memories.filter((m) => unlockedIds.includes(m.id)),
    [memories, unlockedIds]
  );

  const isAllUnlocked = memories.length > 0 && unopenedMemories.length === 0;

  // Toggle sound
  function toggleSound() {
    audio.enabled = !soundOn;
    setSoundOn(!soundOn);
  }

  // Open next memory from jar
  function openNextMemory() {
    if (isOpening) return;
    if (unopenedMemories.length === 0) {
      if (memories.length > 0) {
        const randomMem = memories[Math.floor(Math.random() * memories.length)];
        audio.playChime(0);
        setActiveMemory(randomMem);
      }
      return;
    }

    setIsOpening(true);
    audio.playPop();

    const nextMem = unopenedMemories[0];
    const newUnlocked = [...unlockedIds, nextMem.id];

    setTimeout(() => {
      audio.playChime(newUnlocked.length);
      setUnlockedIds(newUnlocked);
      setActiveMemory(nextMem);
      setIsOpening(false);
    }, 650);
  }

  // Refill jar (reset progress)
  function refillJar() {
    audio.playPop();
    setUnlockedIds([]);
    setActiveMemory(null);
  }

  // Put currently active memory back
  function putBackMemory(memId: string) {
    audio.playPop();
    setUnlockedIds((prev) => prev.filter((id) => id !== memId));
    setActiveMemory(null);
  }

  // Close active card modal
  function closeActiveMemory() {
    setActiveMemory(null);
  }

  // Keyboard shortcut: Esc to close card
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setActiveMemory(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-4.5rem)] overflow-hidden px-4 py-8 md:py-12">
      {/* Background ambient glowing orbs */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full opacity-30 blur-3xl transition-opacity duration-1000"
        style={{
          background: "radial-gradient(circle, var(--brand-from, #7c3aed), transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-12 left-1/4 h-80 w-80 rounded-full opacity-20 blur-3xl"
        style={{
          background: "radial-gradient(circle, var(--brand-to, #6366f1), transparent 70%)",
        }}
      />

      <div className="section-shell relative z-10 mx-auto max-w-5xl">
        {/* Top bar controls */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-full border border-line bg-card/60 px-4 py-2 text-sm text-muted backdrop-blur-md transition hover:border-accent-hover hover:text-foreground"
          >
            <span className="transition-transform group-hover:-translate-x-1">←</span>
            <span>Back to Studio</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSound}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card/60 px-3.5 py-1.5 text-xs text-muted backdrop-blur-md transition hover:text-foreground"
              title={soundOn ? "Mute sound" : "Unmute sound"}
              aria-label={soundOn ? "Mute sound" : "Unmute sound"}
            >
              <span>{soundOn ? "🔔 Sound on" : "🔕 Muted"}</span>
            </button>

            {unlockedIds.length > 0 ? (
              <button
                type="button"
                onClick={refillJar}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card/60 px-3.5 py-1.5 text-xs text-muted backdrop-blur-md transition hover:border-accent-hover hover:text-foreground"
                title="Put all memories back into the jar"
              >
                <span>↺ Refill jar</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Header Title */}
        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-chip px-3.5 py-1 text-xs font-medium text-accent-text">
            <span>✨</span>
            <span>Intimate Collection</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            The Memory Jar
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-base text-muted sm:text-lg">
            There are a few memories hiding in here...
          </p>
        </header>

        {/* Main Jar Interactive Stage */}
        <div className="relative mx-auto flex flex-col items-center justify-center py-4 sm:py-8">
          {/* Subtle instruction pulse */}
          <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-widest text-accent-text/80">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-text animate-ping" />
            <span>Click the jar to open one ✨</span>
          </div>

          {/* Interactive Jar */}
          <div className="relative flex items-center justify-center">
            {/* Ambient Aura */}
            <motion.div
              animate={{
                scale: jarHovered || isOpening ? 1.12 : [1, 1.05, 1],
                opacity: jarHovered || isOpening ? 0.8 : [0.35, 0.55, 0.35],
              }}
              transition={{
                duration: jarHovered || isOpening ? 0.3 : 4,
                repeat: jarHovered || isOpening ? 0 : Infinity,
                ease: "easeInOut",
              }}
              className="pointer-events-none absolute -inset-6 rounded-full blur-2xl"
              style={{
                background:
                  "radial-gradient(circle, var(--brand-from, #7c3aed) 0%, rgba(99, 102, 241, 0.3) 50%, transparent 75%)",
              }}
            />

            {/* Jar Trigger Button */}
            <motion.button
              type="button"
              onClick={openNextMemory}
              onMouseEnter={() => setJarHovered(true)}
              onMouseLeave={() => setJarHovered(false)}
              onFocus={() => setJarHovered(true)}
              onBlur={() => setJarHovered(false)}
              disabled={isOpening}
              whileHover={reduce ? {} : { scale: 1.03, y: -4 }}
              whileTap={reduce ? {} : { scale: 0.97, y: 2 }}
              className="group relative block cursor-pointer rounded-3xl p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text"
              aria-label={
                unopenedMemories.length > 0
                  ? `Open memory from jar. ${unopenedMemories.length} unopened memories remaining.`
                  : "All memories opened. Click to open a memory again."
              }
            >
              {/* Glass Jar SVG Rendering */}
              <div className="relative h-72 w-52 sm:h-84 sm:w-60">
                <svg
                  viewBox="0 0 240 320"
                  className="h-full w-full drop-shadow-2xl"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    {/* Glass gradient */}
                    <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="rgba(255, 255, 255, 0.35)" />
                      <stop offset="30%" stopColor="rgba(255, 255, 255, 0.08)" />
                      <stop offset="70%" stopColor="rgba(124, 58, 237, 0.06)" />
                      <stop offset="100%" stopColor="rgba(255, 255, 255, 0.2)" />
                    </linearGradient>

                    {/* Cork texture gradient */}
                    <linearGradient id="corkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#A77B51" />
                      <stop offset="50%" stopColor="#D4A373" />
                      <stop offset="100%" stopColor="#8C6239" />
                    </linearGradient>

                    {/* Inner nebula glow */}
                    <radialGradient id="jarGlow" cx="50%" cy="65%" r="50%">
                      <stop offset="0%" stopColor="var(--brand-from, #7c3aed)" stopOpacity="0.45" />
                      <stop offset="60%" stopColor="var(--brand-to, #6366f1)" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                    </radialGradient>

                    {/* Specular highlight */}
                    <linearGradient id="specular" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(255, 255, 255, 0.6)" />
                      <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
                    </linearGradient>
                  </defs>

                  {/* Cork Lid (Animates up when opening) */}
                  <motion.g
                    animate={
                      isOpening
                        ? { y: -24, rotate: -6 }
                        : jarHovered
                          ? { y: -4 }
                          : { y: 0, rotate: 0 }
                    }
                    transition={{ duration: 0.35, ease: "easeOut" }}
                  >
                    {/* Cork Stopper Base */}
                    <path
                      d="M80 34 H160 V52 C160 55 156 58 150 58 H90 C84 58 80 55 80 52 Z"
                      fill="url(#corkGrad)"
                      stroke="#6B4423"
                      strokeWidth="1.5"
                    />
                    {/* Cork Stopper Top Rim */}
                    <ellipse
                      cx="120"
                      cy="34"
                      rx="44"
                      ry="8"
                      fill="#D4A373"
                      stroke="#8C6239"
                      strokeWidth="1.5"
                    />
                    {/* Cork texture dots */}
                    <circle cx="102" cy="42" r="1.5" fill="#6B4423" opacity="0.6" />
                    <circle cx="135" cy="46" r="1.2" fill="#6B4423" opacity="0.5" />
                    <circle cx="118" cy="38" r="1.4" fill="#6B4423" opacity="0.6" />
                    <circle cx="145" cy="40" r="1" fill="#6B4423" opacity="0.4" />
                  </motion.g>

                  {/* Glass Jar Neck & Lip */}
                  <ellipse
                    cx="120"
                    cy="56"
                    rx="48"
                    ry="9"
                    fill="url(#glassGrad)"
                    stroke="rgba(255, 255, 255, 0.45)"
                    strokeWidth="2.5"
                  />

                  {/* Jar Body Outer Path */}
                  <path
                    d="M72 58 C55 64 35 90 35 130 C35 190 38 270 50 290 C58 302 78 308 120 308 C162 308 182 302 190 290 C202 270 205 190 205 130 C205 90 185 64 168 58 Z"
                    fill="url(#glassGrad)"
                    stroke="rgba(255, 255, 255, 0.35)"
                    strokeWidth="2"
                  />

                  {/* Inner Nebula Glow fill */}
                  <path
                    d="M72 65 C55 70 42 95 42 135 C42 190 44 265 55 282 C62 292 80 298 120 298 C160 298 178 292 185 282 C196 265 198 190 198 135 C198 95 185 70 168 65 Z"
                    fill="url(#jarGlow)"
                  />

                  {/* Specular Highlight (Curved left reflection) */}
                  <path
                    d="M52 105 C48 130 48 180 52 245 C54 265 57 275 62 280 C60 270 56 250 56 230 C53 180 54 130 58 105 Z"
                    fill="url(#specular)"
                    opacity="0.75"
                  />

                  {/* Right slim reflection */}
                  <path
                    d="M188 120 C191 145 191 195 187 250 C185 260 183 268 180 272 C183 265 185 250 185 235 C187 195 187 145 184 120 Z"
                    fill="url(#specular)"
                    opacity="0.4"
                  />

                  {/* Jar Base Ring */}
                  <ellipse
                    cx="120"
                    cy="295"
                    rx="68"
                    ry="9"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.25)"
                    strokeWidth="1.5"
                  />
                </svg>

                {/* Floating Stars & Tiny Glowing Fireflies INSIDE the Jar */}
                <div className="pointer-events-none absolute inset-x-7 bottom-6 top-16 overflow-hidden rounded-[2.5rem]">
                  {/* Floating unopened memory star capsules */}
                  {unopenedMemories.map((mem, idx) => {
                    const color = mem.color || STAR_COLORS[idx % STAR_COLORS.length];
                    const seed = (idx * 37) % 100;
                    const left = 20 + ((idx * 26 + seed) % 60);
                    const top = 30 + ((idx * 22 + (seed % 40)) % 55);
                    const size = 26 + (idx % 3) * 3;

                    return (
                      <motion.div
                        key={mem.id}
                        animate={
                          reduce
                            ? {}
                            : {
                                y: [0, -10, 4, 0],
                                x: [0, 6, -6, 0],
                                rotate: [0, 15, -15, 0],
                              }
                        }
                        transition={{
                          duration: 3.5 + (idx % 4) * 0.8,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: idx * 0.3,
                        }}
                        style={{
                          left: `${left}%`,
                          top: `${top}%`,
                          width: `${size}px`,
                          height: `${size}px`,
                        }}
                        className="absolute flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                      >
                        {/* Glow halo */}
                        <span
                          className="absolute inset-0 rounded-full blur-sm opacity-80 animate-pulse"
                          style={{ background: color }}
                        />
                        {/* Star icon / capsule */}
                        <span
                          className="relative flex h-full w-full items-center justify-center rounded-full border border-white/60 bg-white/20 text-xs shadow-sm backdrop-blur-xs"
                          style={{
                            borderColor: color,
                            boxShadow: `0 0 10px ${color}`,
                          }}
                        >
                          {mem.icon || "✨"}
                        </span>
                      </motion.div>
                    );
                  })}

                  {/* Tiny ambient floating sparkles */}
                  {Array.from({ length: 12 }).map((_, i) => {
                    const delay = (i * 0.4) % 3;
                    const left = 15 + ((i * 17) % 70);
                    const top = 20 + ((i * 23) % 65);
                    const size = 3 + (i % 3) * 2;
                    return (
                      <motion.div
                        key={i}
                        animate={
                          reduce
                            ? {}
                            : {
                                opacity: [0.2, 0.9, 0.2],
                                scale: [0.8, 1.4, 0.8],
                                y: [0, -12, 0],
                              }
                        }
                        transition={{
                          duration: 2.2 + (i % 3),
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay,
                        }}
                        style={{
                          left: `${left}%`,
                          top: `${top}%`,
                          width: `${size}px`,
                          height: `${size}px`,
                        }}
                        className="absolute rounded-full bg-white shadow-[0_0_8px_#ffffff]"
                      />
                    );
                  })}
                </div>

                {/* Star shooting out of the jar when opening */}
                <AnimatePresence>
                  {isOpening && (
                    <motion.div
                      initial={{ scale: 0.2, y: 40, opacity: 1, rotate: 0 }}
                      animate={{ scale: 1.8, y: -120, opacity: 1, rotate: 360 }}
                      exit={{ scale: 2.2, opacity: 0 }}
                      transition={{ duration: 0.65, ease: "easeOut" }}
                      className="pointer-events-none absolute left-1/2 top-10 -translate-x-1/2"
                    >
                      <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg shadow-[0_0_25px_var(--brand-from)]">
                        ✨
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Jar base pedestal shadow */}
              <div className="mx-auto mt-2 h-4 w-40 rounded-full bg-black/20 blur-md dark:bg-black/40" />
            </motion.button>
          </div>

          {/* Jar status / count badge */}
          <div className="mt-4 flex flex-col items-center gap-1.5 text-center">
            <span className="rounded-full border border-line bg-card/80 px-4 py-1.5 text-xs font-medium text-foreground backdrop-blur-md shadow-xs">
              {isAllUnlocked ? (
                <span className="text-accent-text font-semibold">
                  ✦ All {memories.length} memories discovered! ✨
                </span>
              ) : (
                <span>
                  ✦ <strong>{unopenedMemories.length}</strong>{" "}
                  {unopenedMemories.length === 1 ? "memory" : "memories"} nestled inside (
                  <strong>{unlockedIds.length}</strong> opened)
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Constellation / Discovered Memories Shelf */}
        {openedMemories.length > 0 && (
          <div className="mt-10 border-t border-line/60 pt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
                Discovered Memories ({openedMemories.length})
              </h2>
              <button
                type="button"
                onClick={() => setShowAllTray(!showAllTray)}
                className="text-xs text-accent-text hover:underline"
              >
                {showAllTray ? "Hide shelf" : "Show shelf"}
              </button>
            </div>

            {showAllTray && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {openedMemories.map((mem) => {
                  const isCurrent = activeMemory?.id === mem.id;
                  return (
                    <button
                      key={mem.id}
                      type="button"
                      onClick={() => {
                        audio.playChime(0);
                        setActiveMemory(mem);
                      }}
                      className={`group relative flex flex-col items-start rounded-2xl border p-4 text-left transition-all backdrop-blur-md ${
                        isCurrent
                          ? "border-accent-text bg-card shadow-lg ring-2 ring-accent-text/30"
                          : "border-line bg-card/70 hover:border-accent-hover hover:bg-card hover:shadow-md"
                      }`}
                    >
                      <div className="flex w-full items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="flex h-7 w-7 items-center justify-center rounded-full text-sm shadow-xs"
                            style={{
                              backgroundColor: mem.color ? `${mem.color}25` : "var(--chip)",
                              color: mem.color || "var(--accent-text)",
                            }}
                          >
                            {mem.icon || "✨"}
                          </span>
                          <span className="text-xs font-medium text-muted">
                            {mem.category || "Memory"}
                          </span>
                        </div>
                        {mem.date && (
                          <span className="text-[11px] text-muted-soft">{mem.date}</span>
                        )}
                      </div>

                      <h3 className="mt-2 text-sm font-semibold text-foreground group-hover:text-accent-text">
                        {mem.title || mem.note.slice(0, 32)}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs text-muted leading-relaxed">
                        {mem.note}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Empty jar state message if no memories in data */}
        {memories.length === 0 && (
          <div className="mx-auto mt-8 max-w-md rounded-2xl border border-line bg-card p-6 text-center text-sm text-muted">
            <p>The memory jar is currently quiet.</p>
            <p className="mt-2">
              Log into{" "}
              <Link href="/admin" className="text-accent-text underline">
                /admin
              </Link>{" "}
              to add your personal memories!
            </p>
          </div>
        )}
      </div>

      {/* Active Unfolded Memory Card Modal */}
      <AnimatePresence>
        {activeMemory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeActiveMemory}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Memory Card */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-line bg-card p-6 shadow-2xl sm:p-8"
              style={{
                borderColor: activeMemory.color
                  ? `color-mix(in srgb, ${activeMemory.color} 40%, var(--border))`
                  : "var(--border)",
                boxShadow: activeMemory.color
                  ? `0 20px 50px color-mix(in srgb, ${activeMemory.color} 15%, transparent)`
                  : undefined,
              }}
            >
              {/* Decorative top accent gradient bar */}
              <div
                className="absolute inset-x-0 top-0 h-1.5"
                style={{
                  background: activeMemory.color
                    ? `linear-gradient(90deg, ${activeMemory.color}, var(--brand-to, #6366f1))`
                    : "linear-gradient(90deg, var(--brand-from, #7c3aed), var(--brand-to, #6366f1))",
                }}
              />

              {/* Close Button */}
              <button
                type="button"
                onClick={closeActiveMemory}
                className="absolute right-4 top-4 rounded-full p-2 text-muted transition hover:bg-chip hover:text-foreground"
                aria-label="Close memory"
              >
                ✕
              </button>

              {/* Memory Card Header */}
              <div className="flex items-center gap-3">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-2xl text-2xl shadow-inner"
                  style={{
                    backgroundColor: activeMemory.color ? `${activeMemory.color}22` : "var(--chip)",
                  }}
                >
                  {activeMemory.icon || "✨"}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    {activeMemory.category && (
                      <span className="rounded-full bg-chip px-2.5 py-0.5 text-xs font-semibold text-accent-text">
                        {activeMemory.category}
                      </span>
                    )}
                    {activeMemory.date && (
                      <span className="text-xs text-muted">{activeMemory.date}</span>
                    )}
                  </div>
                  {activeMemory.title && (
                    <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                      {activeMemory.title}
                    </h2>
                  )}
                </div>
              </div>

              {/* Memory Note Body */}
              <div className="my-5 rounded-2xl bg-inset/60 p-4 text-base leading-relaxed text-foreground sm:p-5 sm:text-lg">
                <p className="whitespace-pre-wrap font-serif italic text-foreground/90">
                  “{activeMemory.note}”
                </p>
              </div>

              {/* Optional Photo Attachment */}
              {activeMemory.photoUrl && (
                <div className="mb-5 overflow-hidden rounded-2xl border border-line bg-chip p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeMemory.photoUrl}
                    alt={activeMemory.title || "Memory snapshot"}
                    className="max-h-60 w-full rounded-xl object-cover"
                  />
                </div>
              )}

              {/* Footer Actions */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-4">
                <button
                  type="button"
                  onClick={() => putBackMemory(activeMemory.id)}
                  className="rounded-full px-3 py-1.5 text-xs text-muted transition hover:bg-chip hover:text-foreground"
                >
                  Put back in jar
                </button>

                <div className="flex items-center gap-2">
                  {unopenedMemories.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        closeActiveMemory();
                        setTimeout(() => openNextMemory(), 200);
                      }}
                      className="btn-primary inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold text-white shadow-md"
                    >
                      <span>Open next memory ✨</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={closeActiveMemory}
                      className="rounded-full border border-line px-4 py-2 text-sm font-medium text-foreground transition hover:bg-chip"
                    >
                      Done reading
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
