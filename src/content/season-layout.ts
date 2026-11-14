/**
 * Where a season's ornament images sit.
 * Each festival uses the edge it would in a room — a garland, a diya row, a
 * doorway — instead of the same scatter across the page.
 */

export type SeasonMotif =
  | "garland"
  | "lights"
  | "diyas"
  | "doorway"
  | "color"
  | "eaves"
  | "rise"
  | "tie"
  | "frame";

export type OrnamentEdge = "top" | "bottom" | "left" | "right";
export type OrnamentSize = "sm" | "md" | "lg";
export type OrnamentMotion = "sway" | "flicker" | "twinkle" | "drift" | "rise" | "burst" | "still";
export type OrnamentSide = "left" | "right" | "none";

export type OrnamentSpot = {
  motif: SeasonMotif;
  edge: OrnamentEdge;
  /** Which outer side a bottom-edge image measures in from. */
  side: OrnamentSide;
  /** 0–100 along the rim. Bottom spots measure in from `side`, not across the page. */
  along: number;
  /** Extra offset away from the rim, in rem. */
  drop: number;
  size: OrnamentSize;
  motion: OrnamentMotion;
  delay: string;
  /** Hidden on a narrow screen once that edge is full. */
  quiet: boolean;
  /** Narrow screens keep corners only, inside the page gutter. */
  anchor: "corner" | "rim";
  shiftX: string;
  shiftY: string;
};

export type SpotStyle = {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  animationDelay: string;
  "--drift-x"?: string;
  "--burst-x"?: string;
  "--burst-y"?: string;
};

const MOTIFS: Record<string, SeasonMotif> = {
  christmas: "garland",
  newyear: "lights",
  diwali: "diyas",
  navratri: "doorway",
  holi: "color",
  halloween: "eaves",
  valentine: "rise",
  rakhi: "tie",
};

const PLACEMENT: Record<SeasonMotif, string> = {
  garland: "Hung in a row under the header, like baubles on a garland. They do not float across the page.",
  lights: "An even row under the header, like string lights. They do not fall through the page.",
  diyas: "On the floor at the left and right edges, like diyas at a threshold. The center stays clear.",
  doorway: "Down the left and right edges, like garlands on a doorway.",
  color: "On the outer edges only, like color thrown at the sides of a room.",
  eaves: "Along the top, like decorations on the eaves. They do not cross the page.",
  rise: "In the side margins, rising. They do not cross the page.",
  tie: "The first two sit in the upper corners, like a tied rakhi. Extras stay on that same edge.",
  frame: "In the four corners only. They stay still, with no festival-specific motion.",
};

/**
 * The placement motif for a season. Added festivals use a quiet corner frame.
 * @example motifFor("diwali") // "diyas"
 */
export function motifFor(seasonId: string): SeasonMotif {
  return MOTIFS[seasonId] ?? "frame";
}

/**
 * Editor copy for how this season's images are placed.
 * @example ornamentPlacementCopy("christmas") // "Hung in a row…"
 */
export function ornamentPlacementCopy(seasonId: string): string {
  return PLACEMENT[motifFor(seasonId)];
}

/**
 * One spot per image. Empty when there is nothing to place.
 * @example ornamentSpots("diwali", 2) // two floor-edge diyas
 */
export function ornamentSpots(seasonId: string, count: number): OrnamentSpot[] {
  const total = Math.max(0, Math.floor(count));
  if (!total) return [];
  const motif = motifFor(seasonId);
  switch (motif) {
    case "garland":
      return garland(total);
    case "lights":
      return lights(total);
    case "diyas":
      return diyas(total);
    case "doorway":
      return doorway(total);
    case "color":
      return color(total);
    case "eaves":
      return eaves(total);
    case "rise":
      return rise(total);
    case "tie":
      return tie(total);
    default:
      return frame(total);
  }
}

/**
 * Inline position for one spot. Left and right rims stay below the header.
 * @example spotStyle(ornamentSpots("christmas", 1)[0]).top // "calc(var(--header-h) + 0.15rem)"
 */
export function spotStyle(spot: OrnamentSpot): SpotStyle {
  const motion: SpotStyle =
    spot.motion === "drift"
      ? { animationDelay: spot.delay, "--drift-x": spot.shiftX }
      : spot.motion === "burst"
        ? { animationDelay: spot.delay, "--burst-x": spot.shiftX, "--burst-y": spot.shiftY }
        : { animationDelay: spot.delay };

  if (spot.edge === "top") {
    const y = { top: `calc(var(--header-h) + ${spot.drop}rem)` };
    if (spot.side === "right") return { ...motion, ...y, right: `${spot.along}%` };
    if (spot.side === "left") return { ...motion, ...y, left: `${spot.along}%` };
    return { ...motion, ...y, left: `${spot.along}%` };
  }
  if (spot.edge === "bottom") {
    const inset = spot.side === "right" ? { right: `${spot.along}%` } : { left: `${spot.along}%` };
    return { ...motion, bottom: `${round(0.55 + spot.drop)}rem`, ...inset };
  }
  const belowHeader = `max(calc(var(--header-h) + 0.75rem), ${spot.along}%)`;
  if (spot.edge === "left") return { ...motion, left: "0.7rem", top: belowHeader };
  return { ...motion, right: "0.7rem", top: belowHeader };
}

/**
 * Position along a rim. A single image parks at `lone`, not in the middle.
 * @example alongEdge(0, 1, 8, 86, 84) // 84
 */
function alongEdge(index: number, count: number, start: number, end: number, lone: number): number {
  if (count <= 1) return lone;
  return start + ((end - start) * index) / (count - 1);
}

function delay(index: number): string {
  return `-${(index % 7) * 0.7}s`;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function spot(
  motif: SeasonMotif,
  edge: OrnamentEdge,
  side: OrnamentSide,
  along: number,
  drop: number,
  size: OrnamentSize,
  motion: OrnamentMotion,
  index: number,
  shiftX = "0px",
  shiftY = "0px",
  quiet = false,
): OrnamentSpot {
  return {
    motif,
    edge,
    side,
    along: round(along),
    drop,
    size,
    motion,
    delay: delay(index),
    quiet,
    anchor: anchorFor(edge, side, round(along)),
    shiftX,
    shiftY,
  };
}

/**
 * A phone keeps ornaments that sit in a corner. A rim image would cover the text column.
 * @example anchorFor("top", "none", 8) // "corner"
 */
function anchorFor(edge: OrnamentEdge, side: OrnamentSide, along: number): "corner" | "rim" {
  if (edge === "left" || edge === "right") return along <= 28 || along >= 68 ? "corner" : "rim";
  if (side === "left" || side === "right") return along <= 8 ? "corner" : "rim";
  return along <= 14 || along >= 80 ? "corner" : "rim";
}

/** Christmas: baubles hang from a string under the header, at mixed lengths. */
function garland(count: number): OrnamentSpot[] {
  const drops = [0.15, 0.9, 0.45];
  return Array.from({ length: count }, (_, index) =>
    spot(
      "garland",
      "top",
      "none",
      alongEdge(index, count, 8, 86, 84),
      drops[index % drops.length],
      index % 4 === 2 ? "lg" : index % 2 === 0 ? "md" : "sm",
      "sway",
      index,
      "0px",
      "0px",
      index >= 6,
    ),
  );
}

/** New Year: an even wire of lights, not falling confetti. */
function lights(count: number): OrnamentSpot[] {
  return Array.from({ length: count }, (_, index) =>
    spot(
      "lights",
      "top",
      "none",
      alongEdge(index, count, 6, 90, 86),
      0.15,
      "sm",
      "twinkle",
      index,
      "0px",
      "0px",
      index >= 8,
    ),
  );
}

/** Diwali: diyas on the floor, only in the outer quarter of each side. */
function diyas(count: number): OrnamentSpot[] {
  const leftCount = Math.ceil(count / 2);
  const rightCount = Math.floor(count / 2);
  return Array.from({ length: count }, (_, index) => {
    const side = index % 2 === 0 ? "left" : "right";
    const slot = Math.floor(index / 2);
    const slots = side === "left" ? leftCount : rightCount;
    return spot(
      "diyas",
      "bottom",
      side,
      alongEdge(slot, slots, 4, 22, 5),
      slot % 2 === 0 ? 0 : 0.4,
      slot === 0 ? "lg" : "md",
      "flicker",
      index,
      "0px",
      "0px",
      slot >= 2,
    );
  });
}

/** Navratri: garlands down the two jambs of a doorway. */
function doorway(count: number): OrnamentSpot[] {
  return sides(count, "doorway", 16, 70, 18, "md", "sway", 3);
}

/** Holi: color stays on the rim and only tosses a few pixels inward. */
function color(count: number): OrnamentSpot[] {
  return Array.from({ length: count }, (_, index) => {
    const cycle = index % 4;
    const lap = Math.floor(index / 4);
    const quiet = index >= 6;
    if (cycle === 0) {
      return spot("color", "left", "none", Math.min(26 + lap * 14, 68), 0, "sm", "burst", index, "10px", "0px", quiet);
    }
    if (cycle === 1) {
      return spot("color", "right", "none", Math.min(34 + lap * 14, 68), 0, "sm", "burst", index, "-10px", "0px", quiet);
    }
    if (cycle === 2) {
      return spot("color", "top", "none", lap % 2 === 0 ? 7 : 90, 0.35, "sm", "burst", index, "0px", "8px", quiet);
    }
    return spot(
      "color",
      "bottom",
      lap % 2 === 0 ? "left" : "right",
      6,
      0.2,
      "sm",
      "burst",
      index,
      "0px",
      "-8px",
      quiet,
    );
  });
}

/** Halloween: perched on the eaves, drifting along the roofline. */
function eaves(count: number): OrnamentSpot[] {
  return Array.from({ length: count }, (_, index) =>
    spot(
      "eaves",
      "top",
      "none",
      alongEdge(index, count, 8, 88, 86),
      index % 2 === 0 ? 0.25 : 0.7,
      index % 3 === 0 ? "md" : "sm",
      "drift",
      index,
      index % 2 === 0 ? "12px" : "-12px",
      "0px",
      index >= 5,
    ),
  );
}

/** Valentine: hearts rise in the side margins. */
function rise(count: number): OrnamentSpot[] {
  const leftCount = Math.ceil(count / 2);
  const rightCount = Math.floor(count / 2);
  return Array.from({ length: count }, (_, index) => {
    const edge = index % 2 === 0 ? "left" : "right";
    const slot = Math.floor(index / 2);
    const slots = edge === "left" ? leftCount : rightCount;
    return spot(
      "rise",
      edge,
      "none",
      alongEdge(slot, slots, 68, 30, 72),
      0,
      "sm",
      "rise",
      index,
      "0px",
      "0px",
      slot >= 3,
    );
  });
}

/** Rakhi: one tied accent in each upper corner. Further images stay on that edge. */
function tie(count: number): OrnamentSpot[] {
  return Array.from({ length: count }, (_, index) => {
    if (index === 0) return spot("tie", "top", "none", 90, 0.45, "lg", "still", index);
    if (index === 1) return spot("tie", "top", "none", 8, 0.45, "md", "still", index);
    const edge = index % 2 === 0 ? "right" : "left";
    const step = Math.floor(index / 2);
    return spot("tie", edge, "none", Math.min(18 + step * 10, 42), 0, "sm", "still", index, "0px", "0px", true);
  });
}

/** Added festivals: four corners, still. Extras stack in that corner instead of spreading. */
function frame(count: number): OrnamentSpot[] {
  const corners: Array<{ edge: OrnamentEdge; side: OrnamentSide }> = [
    { edge: "top", side: "right" },
    { edge: "top", side: "left" },
    { edge: "bottom", side: "left" },
    { edge: "bottom", side: "right" },
  ];
  return Array.from({ length: count }, (_, index) => {
    const corner = corners[index % 4];
    const step = Math.floor(index / 4);
    return spot(
      "frame",
      corner.edge,
      corner.side,
      4,
      0.35 + step * 0.55,
      step === 0 ? "md" : "sm",
      "still",
      index,
      "0px",
      "0px",
      index >= 4,
    );
  });
}

/** Split images down the left and right rims. */
function sides(
  count: number,
  motif: SeasonMotif,
  start: number,
  end: number,
  lone: number,
  size: OrnamentSize,
  motion: OrnamentMotion,
  quietAfter: number,
): OrnamentSpot[] {
  const leftCount = Math.ceil(count / 2);
  const rightCount = Math.floor(count / 2);
  return Array.from({ length: count }, (_, index) => {
    const edge = index % 2 === 0 ? "left" : "right";
    const slot = Math.floor(index / 2);
    const slots = edge === "left" ? leftCount : rightCount;
    return spot(motif, edge, "none", alongEdge(slot, slots, start, end, lone), 0, size, motion, index, "0px", "0px", slot >= quietAfter);
  });
}
