"use client";

import type { RefObject } from "react";
import { sectionEnabled, type PublicSiteContent, type SiteContent } from "@/content/types";
import { SpotFx } from "./studio-fx";
import { desktopSpots, mobileSpots, type SpotId } from "./studio-spots";

export function StudioSpotLayer({
  layout,
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
}: {
  layout: "desktop" | "mobile";
  site: PublicSiteContent | SiteContent;
  active: SpotId | null;
  setActive: (next: SpotId | null | ((cur: SpotId | null) => SpotId | null)) => void;
  drag: RefObject<{ x: number; y: number; moved: boolean }>;
  pianoPlaying: boolean;
  hasPiano: boolean;
  goodreadsId: string | null;
  onPianoToggle: () => void;
  onBooksClick: () => void;
  onFramesClick: () => void;
  pianoActive: boolean;
  bookActive: boolean;
  deskTip: string;
  pianoTip: string | null;
  bookTip: string;
}) {
    const spots = layout === "mobile" ? mobileSpots : desktopSpots;
    return (
      <div className={`studio-spots studio-spots-${layout}`}>
        {spots.map((spot, i) => {
          const isPiano = spot.id === "piano";
          const isBook = spot.id === "books";
          const isJar = spot.id === "jar";
          const isFrames = spot.id === "frames";
          const isLaptop = spot.id === "laptop";
          const on = isPiano ? pianoActive : isBook ? bookActive : active === spot.id;
          const href =
            isBook && goodreadsId && sectionEnabled(site.sections, "reading")
              ? "/reading"
              : isJar && sectionEnabled(site.sections, "memories")
                ? "/memories"
                : undefined;
          const Spot = href ? "a" : "button";
          const tip = isPiano
            ? pianoTip
            : isBook
              ? href
                ? bookTip
                : "The books are taking a break 📚"
              : isJar && on
                ? href
                  ? "Open memory jar ✨"
                  : "The jar is taking a break"
                : isLaptop && on
                  ? deskTip
                  : isFrames && on
                    ? "Photo wall"
                    : on
                      ? spot.label
                      : null;
          const label = isPiano
            ? pianoPlaying
              ? "Pause piano music"
              : hasPiano
                ? "Play piano music"
                : "The piano is taking a break"
            : isBook
              ? href
                ? "Open reading list"
                : "The books are taking a break"
              : isJar
                ? href
                  ? "Open memory jar"
                  : "The jar is taking a break"
                : isLaptop
                  ? "Coding setup"
                  : isFrames
                    ? "Photo wall"
                    : spot.label;
          return (
            <Spot
              key={`${layout}-${spot.id}-${spot.left}-${i}`}
              href={href}
              type={href ? undefined : "button"}
              data-spot={spot.id}
              className={`world-spot${on ? " is-on" : ""}${isPiano && pianoPlaying ? " is-playing" : ""}`}
              style={{ left: spot.left, top: spot.top, width: spot.w, height: spot.h }}
              aria-label={label}
              aria-pressed={href ? undefined : isPiano ? pianoPlaying : on}
              onPointerEnter={(e) => {
                if (e.pointerType === "mouse") setActive(spot.id);
              }}
              onPointerLeave={(e) => {
                if (e.pointerType === "mouse") setActive((cur) => (cur === spot.id ? null : cur));
              }}
              onPointerDown={(e) => {
                if (e.pointerType !== "mouse") setActive(spot.id);
              }}
              onFocus={() => setActive(spot.id)}
              onBlur={() => setActive((cur) => (cur === spot.id ? null : cur))}
              onClick={(e) => {
                if (drag.current.moved) {
                  e.preventDefault();
                  return;
                }
                if (isPiano) {
                  e.preventDefault();
                  onPianoToggle();
                  return;
                }
                if (isBook) {
                  onBooksClick();
                  return;
                }
                if (isJar) return;
                if (isFrames) {
                  onFramesClick();
                  setActive((cur) => (cur === spot.id ? null : spot.id));
                  return;
                }
                setActive((cur) => (cur === spot.id ? null : spot.id));
              }}
            >
              {on ? (
                <>
                  <SpotFx id={spot.id} playing={pianoPlaying} />
                  {tip ? (
                    <span className={isPiano || isBook || isJar || isLaptop ? "world-tip" : "world-tag"}>{tip}</span>
                  ) : null}
                </>
              ) : null}
            </Spot>
          );
        })}
      </div>
    );

}
