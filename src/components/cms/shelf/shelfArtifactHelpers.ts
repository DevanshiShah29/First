// Application services & types
import type { ShelfArtifactItem } from "@/content/types";

const FALLBACK_WIDTH_REM = 1.85;
const FALLBACK_HEIGHT_REM = 5.4;
const BASE_HEIGHT_REM = 5.0;
const MIN_WIDTH_REM = 1.2;
const MAX_WIDTH_REM = 10.0;

/**
 * Formats a clean, title-cased ornament name from an uploaded image filename.
 * Removes extensions, replaces delimiters, strips camera prefixes, and title-cases words.
 *
 * @example
 * formatNameFromFilename("vintage_brass_lamp.png") // "Vintage Brass Lamp"
 * formatNameFromFilename("IMG_potted-succulent.webp") // "Potted Succulent"
 */
export function formatNameFromFilename(filename: string): string {
  if (!filename || typeof filename !== "string") return "";

  // Strip file extension (.png, .webp, .jpg, etc.)
  const withoutExt = filename.replace(/\.[^/.]+$/, "");

  // Strip common camera/scanner prefixes like IMG_, DSC_, Photo_, etc.
  const cleanedPrefix = withoutExt.replace(/^(?:img|dsc|photo|scan|screenshot)[-_]/i, "");

  // Replace underscores, hyphens, and multiple dots/spaces with a single space
  const spaced = cleanedPrefix.replace(/[_\-.]+/g, " ").trim();

  if (!spaced) return "";

  // Convert to Title Case
  return spaced
    .split(/\s+/)
    .map((word) => {
      if (!word) return "";
      // Keep acronyms like 3D, LED or Roman numerals if already uppercase
      if (word.length <= 3 && word === word.toUpperCase() && !/^\d+$/.test(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

/**
 * Automatically calculates proportional width and height (in rem) for an ornament
 * based on the uploaded image's natural aspect ratio.
 *
 * @example
 * calculateOrnamentDimensions(400, 400) // { widthRem: 5.0, heightRem: 5.0 }
 * calculateOrnamentDimensions(200, 400) // { widthRem: 2.5, heightRem: 5.0 }
 */
export function calculateOrnamentDimensions(
  naturalWidth: number,
  naturalHeight: number,
): Pick<ShelfArtifactItem, "widthRem" | "heightRem"> {
  if (
    !Number.isFinite(naturalWidth) ||
    !Number.isFinite(naturalHeight) ||
    naturalWidth <= 0 ||
    naturalHeight <= 0
  ) {
    return { widthRem: FALLBACK_WIDTH_REM, heightRem: FALLBACK_HEIGHT_REM };
  }

  const aspect = naturalWidth / naturalHeight;
  const rawWidth = BASE_HEIGHT_REM * aspect;
  const clampedWidth = Math.max(MIN_WIDTH_REM, Math.min(MAX_WIDTH_REM, rawWidth));
  const widthRem = Math.round(clampedWidth * 100) / 100;

  return {
    widthRem,
    heightRem: BASE_HEIGHT_REM,
  };
}
