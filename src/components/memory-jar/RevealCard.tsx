"use client";

// External dependencies
import { useCallback, useEffect, useId, useMemo, type CSSProperties } from "react";

// Application services & types
import type { MemoryItem } from "@/content/types";
import { useReducedMotion } from "@/hooks/reduced-motion";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import {
  JAR_ASSETS,
  PAPER_THEMES,
  resolveStarColor,
} from "@/lib/memory-jar";
import { jarAudio } from "@/lib/memory-jar-audio";

// UI components
import { MediaImage } from "@/components/MediaImage";
import { PaperStar } from "./PaperStar";

interface RevealCardProps {
  memory: MemoryItem;
  nonce?: number;
  onClose: () => void;
  onPullAnother: () => void;
}

/**
 * Renders the unfolded memory reveal dialog.
 * @example <RevealCard memory={item} onClose={fn} onPullAnother={fn} />
 */
export function RevealCard({
  memory,
  nonce = 0,
  onClose,
  onPullAnother,
}: RevealCardProps) {
  const reduce = useReducedMotion();
  const color = resolveStarColor(memory.color, memory.id);
  const theme = PAPER_THEMES[color];
  const titleId = useId();
  const dialogRef = useDialogFocus<HTMLDivElement>(true, `${memory.id}-${nonce}`);

  /**
   * Plays a pop and closes the reveal dialog.
   * @example handleClose() // onClose()
   */
  const handleClose = useCallback(() => {
    jarAudio.playPop();
    onClose();
  }, [onClose]);

  useEffect(() => {
    /**
     * Closes the dialog on Escape.
     * @example onKeyDown({ key: "Escape" }) // closed
     */
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        handleClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  const backdropStars = useMemo(() => {
    let seed = 0;
    for (let i = 0; i < memory.id.length; i++) seed = (seed * 31 + memory.id.charCodeAt(i)) >>> 0;
    /**
     * Deterministic 0–1 float from seed + n.
     * @example rand(3.1) // 0.42
     */
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
        ref={dialogRef}
        key={`card-${memory.id}-${nonce}`}
        className={`relative z-10 w-full ${reduce ? "" : "animate-paper-unfold"} ${
          hasPhoto ? "max-w-lg" : "max-w-md"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
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
                  <MediaImage
                    src={memory.photoUrl}
                    alt={memory.title || "Memory photo"}
                    className="max-h-48 w-full object-cover select-none"
                    width={640}
                    height={480}
                    sizes="(max-width: 640px) 90vw, 420px"
                    draggable={false}
                  />
                </div>
              </div>
            ) : null}

            <p
              className="mt-5 whitespace-pre-wrap break-words text-center font-serif-italic text-xl leading-snug sm:leading-relaxed"
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
                  <span aria-hidden className="text-2xs opacity-60">✦</span>
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
