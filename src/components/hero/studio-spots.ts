export type SpotId = "frames" | "jar" | "books" | "piano" | "laptop" | "cook" | "plants" | "yoga";

export type Spot = { id: SpotId; label: string; left: string; top: string; w: string; h: string };

/** Percentages are relative to the studio art's visible object-fit cover box. */
export const desktopSpots: Spot[] = [
  { id: "frames", label: "Photo wall", left: "1%", top: "8%", w: "15%", h: "38%" },
  { id: "plants", label: "Plants", left: "22%", top: "0%", w: "20%", h: "14%" },
  { id: "plants", label: "Plants", left: "72%", top: "0%", w: "26%", h: "16%" },
  { id: "plants", label: "Plants", left: "88%", top: "48%", w: "11%", h: "28%" },
  { id: "piano", label: "Piano", left: "13%", top: "15%", w: "20%", h: "34%" },
  { id: "books", label: "Book Nook", left: "12%", top: "52%", w: "13%", h: "18%" },
  { id: "jar", label: "Memories", left: "32%", top: "50%", w: "10%", h: "22%" },
  { id: "laptop", label: "Coding", left: "38%", top: "22%", w: "20%", h: "46%" },
  { id: "cook", label: "Baking", left: "64%", top: "38%", w: "15%", h: "24%" },
  { id: "yoga", label: "Yoga", left: "58%", top: "76%", w: "30%", h: "22%" },
];

export const mobileSpots: Spot[] = [
  { id: "frames", label: "Photo wall", left: "2%", top: "2%", w: "40%", h: "26%" },
  { id: "plants", label: "Plants", left: "58%", top: "1%", w: "40%", h: "18%" },
  { id: "plants", label: "Plants", left: "0%", top: "30%", w: "14%", h: "12%" },
  { id: "piano", label: "Piano", left: "0%", top: "40%", w: "26%", h: "24%" },
  { id: "laptop", label: "Coding", left: "32%", top: "32%", w: "36%", h: "32%" },
  { id: "cook", label: "Baking", left: "66%", top: "44%", w: "32%", h: "22%" },
  { id: "books", label: "Book Nook", left: "2%", top: "60%", w: "22%", h: "16%" },
  { id: "jar", label: "Memories", left: "26%", top: "66%", w: "24%", h: "20%" },
  { id: "yoga", label: "Yoga", left: "48%", top: "82%", w: "48%", h: "16%" },
];

export type Hitmap = { left: number; top: number; width: number; height: number };

/**
 * Maps hotspot layer onto the visible object-fit:cover box.
 * @example coverHitmap(1280, 720, w, h, 0.5, 0.48) // Hitmap
 */
export function coverHitmap(
  naturalW: number,
  naturalH: number,
  boxW: number,
  boxH: number,
  posX: number,
  posY: number,
): Hitmap {
  const scale = Math.max(boxW / naturalW, boxH / naturalH);
  const width = naturalW * scale;
  const height = naturalH * scale;
  return {
    left: (boxW - width) * posX,
    top: (boxH - height) * posY,
    width,
    height,
  };
}
