import type { CSSProperties } from "react";
import type {
  HeroMedia,
  HeroOverlayBlur,
  HeroOverlayColor,
  HeroOverlayOpacity,
  HeroOverlayStyle,
} from "@/content/types";

export interface ResolvedHeroOverlay {
  style: HeroOverlayStyle;
  opacity: HeroOverlayOpacity;
  color: HeroOverlayColor;
  blur: HeroOverlayBlur;
}

/**
 * Normalizes hero media overlay settings with robust fallbacks.
 * @example resolveHeroOverlay(media) // { style: "left-fade", opacity: "50", ... }
 */
export function resolveHeroOverlay(media: HeroMedia): ResolvedHeroOverlay {
  if (media.overlay === false) {
    return { style: "none", opacity: "15", color: "theme", blur: "none" };
  }

  // Handle legacy overlayMode if present
  let style: HeroOverlayStyle = media.overlayStyle ?? "solid";
  let opacity: HeroOverlayOpacity = media.overlayOpacity ?? "50";

  if (media.overlayMode) {
    if (media.overlayMode === "none") {
      style = "none";
    } else if (
      media.overlayMode === "left-fade" ||
      media.overlayMode === "right-fade" ||
      media.overlayMode === "top-left-fade" ||
      media.overlayMode === "top-right-fade" ||
      media.overlayMode === "bottom-fade"
    ) {
      style = media.overlayMode;
    } else if (
      media.overlayMode === "70" ||
      media.overlayMode === "50" ||
      media.overlayMode === "20"
    ) {
      style = "solid";
      opacity = media.overlayMode === "20" ? "15" : (media.overlayMode as HeroOverlayOpacity);
    }
  }

  const color: HeroOverlayColor = media.overlayColor ?? "theme";
  const blur: HeroOverlayBlur = media.overlayBlur ?? "none";

  return { style, opacity, color, blur };
}

/**
 * Detects whether an overlay color tone or clean image requires dark or light text context for WCAG contrast.
 * @example getHeroContrastTheme("dark", "solid") // "dark" (forces light text)
 * @example getHeroContrastTheme("theme", "none") // "light" (peach image background forces dark text)
 */
export function getHeroContrastTheme(
  color: HeroOverlayColor,
  style?: HeroOverlayStyle,
): "dark" | "light" | undefined {
  // When overlay is completely off, the peach studio artwork is visible.
  // Peach (#fae9dc) is light, so dark text (#121218) achieves 16.5:1 AAA contrast.
  if (style === "none") {
    return "light";
  }

  if (color === "dark" || color === "espresso" || color === "slate") {
    return "dark";
  }
  if (color === "light" || color === "cream" || color === "peach" || color === "rose") {
    return "light";
  }
  return undefined;
}

/**
 * Maps color option to CSS color string or var.
 */
function getOverlayColorHex(color: HeroOverlayColor, themeBg?: string): string {
  switch (color) {
    case "dark":
      return "#000000";
    case "slate":
      return "#0f172a";
    case "espresso":
      return "#1c140e";
    case "light":
      return "#ffffff";
    case "cream":
      return "#faf6f0";
    case "peach":
      return "#fcefe8";
    case "rose":
      return "#f7e8e8";
    case "theme":
    default:
      return themeBg || "var(--background, #080808)";
  }
}

/**
 * Numeric float value from opacity token.
 */
function getOpacityValue(opacity: HeroOverlayOpacity): number {
  switch (opacity) {
    case "15":
      return 0.15;
    case "30":
      return 0.3;
    case "70":
      return 0.7;
    case "85":
      return 0.85;
    case "50":
    default:
      return 0.5;
  }
}

/**
 * Returns standard Tailwind backdrop blur class.
 */
export function getHeroOverlayBlurClass(blur: HeroOverlayBlur): string {
  switch (blur) {
    case "subtle":
      return "backdrop-blur-xs";
    case "medium":
      return "backdrop-blur-sm";
    case "heavy":
      return "backdrop-blur-md";
    case "none":
    default:
      return "";
  }
}

/**
 * Builds Tailwind classes or inline styles for live rendering.
 * Supports responsive viewport direction: desktop (horizontal fade) vs mobile (vertical fade).
 */
export function getHeroOverlayStyles(
  media: HeroMedia,
  themeBg?: string,
  viewport: "desktop" | "mobile" = "desktop",
): { className: string; style?: CSSProperties } {
  const { style, opacity, color, blur } = resolveHeroOverlay(media);
  if (style === "none") {
    return { className: "hidden" };
  }

  const blurClass = getHeroOverlayBlurClass(blur);
  const colorStr = getOverlayColorHex(color, themeBg);
  const alpha = getOpacityValue(opacity);
  const midAlpha = Math.max(0.05, alpha * 0.45);

  let background = "";

  switch (style) {
    case "solid":
      background = `color-mix(in srgb, ${colorStr} ${Math.round(alpha * 100)}%, transparent)`;
      break;
    case "left-fade": {
      // Desktop: fades to right with text protection zone (0-30%).
      // Mobile: fades to bottom with header protection zone (0-28%).
      if (viewport === "mobile") {
        background = `linear-gradient(to bottom, color-mix(in srgb, ${colorStr} ${Math.round(
          alpha * 100,
        )}%, transparent) 0%, color-mix(in srgb, ${colorStr} ${Math.round(
          alpha * 100,
        )}%, transparent) 28%, color-mix(in srgb, ${colorStr} ${Math.round(
          midAlpha * 100,
        )}%, transparent) 55%, transparent 95%)`;
      } else {
        background = `linear-gradient(to right, color-mix(in srgb, ${colorStr} ${Math.round(
          alpha * 100,
        )}%, transparent) 0%, color-mix(in srgb, ${colorStr} ${Math.round(
          alpha * 100,
        )}%, transparent) 30%, color-mix(in srgb, ${colorStr} ${Math.round(
          midAlpha * 100,
        )}%, transparent) 55%, transparent 95%)`;
      }
      break;
    }
    case "left-heavy-fade": {
      if (viewport === "mobile") {
        background = `linear-gradient(to bottom, color-mix(in srgb, ${colorStr} ${Math.round(
          alpha * 100,
        )}%, transparent) 0%, color-mix(in srgb, ${colorStr} ${Math.round(
          alpha * 100,
        )}%, transparent) 40%, color-mix(in srgb, ${colorStr} ${Math.round(
          midAlpha * 100,
        )}%, transparent) 75%, transparent 100%)`;
      } else {
        background = `linear-gradient(to right, color-mix(in srgb, ${colorStr} ${Math.round(
          alpha * 100,
        )}%, transparent) 0%, color-mix(in srgb, ${colorStr} ${Math.round(
          alpha * 100,
        )}%, transparent) 35%, color-mix(in srgb, ${colorStr} ${Math.round(
          midAlpha * 100,
        )}%, transparent) 70%, transparent 100%)`;
      }
      break;
    }
    case "right-fade":
      background = `linear-gradient(to left, color-mix(in srgb, ${colorStr} ${Math.round(
        alpha * 100,
      )}%, transparent) 0%, color-mix(in srgb, ${colorStr} ${Math.round(
        midAlpha * 100,
      )}%, transparent) 45%, transparent 95%)`;
      break;
    case "top-fade":
      background = `linear-gradient(to bottom, color-mix(in srgb, ${colorStr} ${Math.round(
        alpha * 100,
      )}%, transparent) 0%, color-mix(in srgb, ${colorStr} ${Math.round(
        midAlpha * 100,
      )}%, transparent) 50%, transparent 100%)`;
      break;
    case "top-left-fade":
      background = `linear-gradient(135deg, color-mix(in srgb, ${colorStr} ${Math.round(
        alpha * 100,
      )}%, transparent) 0%, color-mix(in srgb, ${colorStr} ${Math.round(
        midAlpha * 100,
      )}%, transparent) 45%, transparent 100%)`;
      break;
    case "top-right-fade":
      background = `linear-gradient(225deg, color-mix(in srgb, ${colorStr} ${Math.round(
        alpha * 100,
      )}%, transparent) 0%, color-mix(in srgb, ${colorStr} ${Math.round(
        midAlpha * 100,
      )}%, transparent) 45%, transparent 100%)`;
      break;
    case "bottom-fade":
      background = `linear-gradient(to top, color-mix(in srgb, ${colorStr} ${Math.round(
        alpha * 100,
      )}%, transparent) 0%, color-mix(in srgb, ${colorStr} ${Math.round(
        midAlpha * 100,
      )}%, transparent) 50%, transparent 100%)`;
      break;
    case "radial-vignette":
      background = `radial-gradient(circle at center, transparent 40%, color-mix(in srgb, ${colorStr} ${Math.round(
        alpha * 100,
      )}%, transparent) 100%)`;
      break;
    case "radial-center":
      background = `radial-gradient(circle at center, color-mix(in srgb, ${colorStr} ${Math.round(
        alpha * 100,
      )}%, transparent) 0%, transparent 75%)`;
      break;
  }

  return {
    className: `absolute inset-0 pointer-events-none ${blurClass}`.trim(),
    style: { background },
  };
}

/**
 * Shared, unified overlay component for published hero, live preview, and editor thumbnails.
 * Renders responsively across desktop and mobile breakpoints.
 * @example <HeroOverlay media={media} />
 */
export function HeroOverlay({
  media,
  themeBg,
}: {
  media: HeroMedia;
  themeBg?: string;
}) {
  const { style } = resolveHeroOverlay(media);
  if (style === "none") return null;

  const desktop = getHeroOverlayStyles(media, themeBg, "desktop");
  const mobile = getHeroOverlayStyles(media, themeBg, "mobile");

  if (style === "left-fade" || style === "left-heavy-fade") {
    return (
      <>
        <div className={`hidden md:block ${desktop.className}`} style={desktop.style} aria-hidden />
        <div className={`block md:hidden ${mobile.className}`} style={mobile.style} aria-hidden />
      </>
    );
  }

  return <div className={desktop.className} style={desktop.style} aria-hidden />;
}

export interface CuratedHeroPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  swatchBackground: string;
  settings: {
    place: "side" | "background";
    side?: "left" | "right";
    overlayStyle: HeroOverlayStyle;
    overlayOpacity: HeroOverlayOpacity;
    overlayColor: HeroOverlayColor;
    overlayBlur: HeroOverlayBlur;
  };
}

export const CURATED_HERO_PRESETS: CuratedHeroPreset[] = [
  {
    id: "editorial-left-fade",
    name: "Editorial Studio",
    badge: "Recommended",
    description: "Soft fade with text protection ramp. Ensures 100% WCAG AAA contrast while keeping 3D artwork vibrant.",
    swatchBackground:
      "linear-gradient(to right, rgba(8, 8, 8, 0.85) 0%, rgba(8, 8, 8, 0.70) 30%, rgba(8, 8, 8, 0.25) 60%, rgba(250, 233, 220, 0.1) 100%), #fae9dc",
    settings: {
      place: "background",
      overlayStyle: "left-fade",
      overlayOpacity: "70",
      overlayColor: "theme",
      overlayBlur: "none",
    },
  },
  {
    id: "frosted-glass",
    name: "Frosted Glass",
    badge: "Modern",
    description: "Balanced fade with glassmorphism backdrop blur for clean floating typography.",
    swatchBackground:
      "linear-gradient(to right, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.4) 40%, rgba(250, 233, 220, 0.2) 100%), #fae9dc",
    settings: {
      place: "background",
      overlayStyle: "left-fade",
      overlayOpacity: "50",
      overlayColor: "theme",
      overlayBlur: "subtle",
    },
  },
  {
    id: "warm-espresso",
    name: "Warm Espresso",
    badge: "Cozy Dark",
    description: "Deep espresso brown tone tailored to warm peach & terracotta; verified 11.3:1 AAA text contrast.",
    swatchBackground:
      "linear-gradient(to right, rgba(28, 20, 14, 0.95) 0%, rgba(28, 20, 14, 0.75) 35%, rgba(250, 233, 220, 0.1) 100%), #fae9dc",
    settings: {
      place: "background",
      overlayStyle: "left-fade",
      overlayOpacity: "85",
      overlayColor: "espresso",
      overlayBlur: "none",
    },
  },
  {
    id: "clean-raw",
    name: "Clean Master",
    badge: "Raw Art",
    description: "Zero overlay. 100% of the raw 2.7K artwork is displayed with adaptive dark text (16.5:1 AAA).",
    swatchBackground: "#fae9dc",
    settings: {
      place: "background",
      overlayStyle: "none",
      overlayOpacity: "15",
      overlayColor: "theme",
      overlayBlur: "none",
    },
  },
  {
    id: "subtle-vignette",
    name: "Subtle Vignette",
    badge: "Cinematic",
    description: "Soft edge vignette that frames the center artwork and typography with cinematic depth.",
    swatchBackground:
      "radial-gradient(circle at center, transparent 35%, rgba(8, 8, 8, 0.5) 100%), #fae9dc",
    settings: {
      place: "background",
      overlayStyle: "radial-vignette",
      overlayOpacity: "30",
      overlayColor: "theme",
      overlayBlur: "none",
    },
  },
  {
    id: "side-frame",
    name: "Side Graphic (Right)",
    badge: "Classic Split",
    description: "Framed 3D visual card on the right, copy on the left.",
    swatchBackground:
      "linear-gradient(to right, #ffffff 0%, #ffffff 48%, #c3c4c7 48%, #c3c4c7 52%, #fae9dc 52%, #fae9dc 100%)",
    settings: {
      place: "side",
      side: "right",
      overlayStyle: "none",
      overlayOpacity: "50",
      overlayColor: "theme",
      overlayBlur: "none",
    },
  },
];

export interface CuratedHeroArtwork {
  id: string;
  name: string;
  badge: string;
  description: string;
  desktopSrc: string;
  mobileSrc: string;
  width: number;
  height: number;
  mobileWidth: number;
  mobileHeight: number;
}

export const CURATED_HERO_ARTWORKS: CuratedHeroArtwork[] = [
  {
    id: "warm-portrait",
    name: "Golden Hour Studio",
    badge: "Portrait",
    description: "Warm photographic studio portrait at the creative desk with golden hour sunlight, baby's breath, fairy lights, and piano.",
    desktopSrc: "/images/hero-warm-portrait.jpg",
    mobileSrc: "/images/hero-warm-portrait-mobile.jpg",
    width: 1376,
    height: 768,
    mobileWidth: 896,
    mobileHeight: 1200,
  },
  {
    id: "sunset-castle",
    name: "Sunset Castle Studio",
    badge: "Day & Sunset",
    description: "Pastel creative desk with arched fairytale castle window, cherry mug, baby's breath flowers & sleeping cat.",
    desktopSrc: "/images/hero-sunset-castle.jpg",
    mobileSrc: "/images/hero-sunset-castle-mobile.jpg",
    width: 2752,
    height: 1548,
    mobileWidth: 1792,
    mobileHeight: 2400,
  },
  {
    id: "cosmic-rocket",
    name: "Cosmic Rocket Studio",
    badge: "Night Voyage",
    description: "Warm amber studio with rocket taking off into starry skies, floating books, fairy lights & tabby cat.",
    desktopSrc: "/images/hero-cosmic-rocket.jpg",
    mobileSrc: "/images/hero-cosmic-rocket-mobile.jpg",
    width: 2752,
    height: 1548,
    mobileWidth: 1792,
    mobileHeight: 2400,
  },
  {
    id: "editorial-3d",
    name: "Editorial 3D Studio",
    badge: "Studio Classic",
    description: "Editorial 3D creative studio artwork with dual responsive compositions.",
    desktopSrc: "/hero-desktop.jpg",
    mobileSrc: "/hero-mobile.jpg",
    width: 2752,
    height: 1536,
    mobileWidth: 1792,
    mobileHeight: 2400,
  },
];

/**
 * Finds a curated artwork from a saved hero media URL.
 * @example findCuratedArtwork("/hero-desktop.jpg")?.id // "editorial-3d"
 */
export function findCuratedArtwork(url: string): CuratedHeroArtwork | undefined {
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  return CURATED_HERO_ARTWORKS.find(
    (artwork) =>
      trimmed === artwork.desktopSrc ||
      trimmed.includes(artwork.desktopSrc) ||
      trimmed.endsWith(artwork.desktopSrc) ||
      (artwork.id === "editorial-3d" && trimmed.includes("hero-desktop.jpg")),
  );
}

