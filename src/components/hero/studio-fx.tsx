"use client";

import type { CSSProperties } from "react";
import { MiniUi, Notes } from "./fx";
import type { SpotId } from "./studio-spots";

const paperStars = [
  { l: "22%", t: "42%", d: "0s", c: "#fde68a", r: -14 },
  { l: "48%", t: "56%", d: "0.1s", c: "#e9d5ff", r: 16 },
  { l: "64%", t: "38%", d: "0.22s", c: "#fbcfe8", r: -8 },
  { l: "34%", t: "68%", d: "0.08s", c: "#fcd34d", r: 10 },
  { l: "56%", t: "72%", d: "0.3s", c: "#ddd6fe", r: -18 },
  { l: "40%", t: "36%", d: "0.16s", c: "#fef3c7", r: 6 },
  { l: "70%", t: "60%", d: "0.38s", c: "#c4b5fd", r: 12 },
  { l: "28%", t: "78%", d: "0.26s", c: "#f9a8d4", r: -6 },
];

/**
 * Renders paper-star FX inside the studio jar hotspot.
 * @example <PaperStars />
 */
function PaperStars() {
  return (
    <div className="studio-jar-vessel" aria-hidden>
      {paperStars.map((star, i) => (
        <span
          key={i}
          className="studio-paper-star"
          style={{
            left: star.l,
            top: star.t,
            animationDelay: star.d,
            ["--star"]: star.c,
            transform: `rotate(${star.r}deg)`,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}

/**
 * Renders baking steam FX.
 * @example <Steam />
 */
function Steam() {
  return (
    <div className="studio-steam" aria-hidden>
      <i style={{ left: "28%", animationDelay: "0s" }} />
      <i style={{ left: "48%", animationDelay: "0.25s" }} />
      <i style={{ left: "66%", animationDelay: "0.45s" }} />
    </div>
  );
}

/**
 * Renders yoga breath pulse FX.
 * @example <Breath />
 */
function Breath() {
  return <span className="studio-breath" aria-hidden />;
}

/**
 * Renders photo-wall sparkles FX.
 * @example <FrameSparks />
 */
function FrameSparks() {
  return (
    <div className="studio-sparks" aria-hidden>
      <i style={{ left: "12%", top: "18%" }} />
      <i style={{ left: "48%", top: "8%" }} />
      <i style={{ left: "78%", top: "22%" }} />
      <i style={{ left: "30%", top: "58%" }} />
    </div>
  );
}

/**
 * Renders swaying leaf FX for plant hotspots.
 * @example <LeafSway />
 */
function LeafSway() {
  return (
    <div className="studio-leaves" aria-hidden>
      <i style={{ left: "22%", top: "40%" }} />
      <i style={{ left: "54%", top: "28%" }} />
      <i style={{ left: "78%", top: "52%" }} />
    </div>
  );
}

/**
 * Renders hotspot FX for a studio spot id.
 * @example <SpotFx id="cook" playing />
 */
export function SpotFx({ id, playing }: { id: SpotId; playing?: boolean }) {
  if (id === "piano") return playing ? <Notes looping /> : null;
  if (id === "laptop") return <MiniUi className="world-ui studio-ui" />;
  if (id === "cook") return <Steam />;
  if (id === "jar") return <PaperStars />;
  if (id === "yoga") return <Breath />;
  if (id === "frames") return <FrameSparks />;
  if (id === "plants") return <LeafSway />;
  return null;
}
