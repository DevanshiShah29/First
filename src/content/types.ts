export const SKILL_ICONS = [
  "discovery",
  "prioritize",
  "specs",
  "map",
  "target",
  "empty",
  "react",
  "next",
  "typescript",
  "tailwind",
  "html",
  "node",
  "express",
  "mongo",
  "git",
  "figma",
] as const;

export type SkillIcon = (typeof SKILL_ICONS)[number];

/**
 * Type guard for SkillIcon ids.
 * @example isSkillIcon("react") // true
 */
export function isSkillIcon(value: string): value is SkillIcon {
  return (SKILL_ICONS as readonly string[]).includes(value);
}

export const HERO_TEMPLATES = [
  {
    id: "classic",
    name: "Classic",
    description: "Left-aligned intro with glow orbs.",
  },
  {
    id: "centered",
    name: "Centered",
    description: "A centered statement with the role underneath.",
  },
  {
    id: "split",
    name: "Split",
    description: "Copy on the left, a highlight card on the right.",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Quiet and tight — no orbs, just the words.",
  },
  {
    id: "spotlight",
    name: "Spotlight",
    description: "Oversized greeting, role as a chip, stats in a row.",
  },
  {
    id: "world",
    name: "3D World",
    description: "Interactive stylized studio — the main experience.",
  },
  {
    id: "nook",
    name: "3D Nook",
    description: "Responsive hobby studio — piano, books, cooking, yoga, and more.",
  },
  {
    id: "studio",
    name: "3D Studio",
    description: "Miniature creative studio centered on you at the laptop, with a photo wall and cozy corners.",
  },
] as const;

export type HeroTemplateId = (typeof HERO_TEMPLATES)[number]["id"];

/**
 * Type guard for HeroTemplateId values.
 * @example isHeroTemplate("classic") // true
 */
export function isHeroTemplate(value: string): value is HeroTemplateId {
  return HERO_TEMPLATES.some((t) => t.id === value);
}

export type HeroMediaKind = "none" | "image" | "video";
export type HeroMediaPlace = "side" | "background";
export type HeroMediaSide = "left" | "right";

export type HeroMedia = {
  kind: HeroMediaKind;
  url: string;
  place: HeroMediaPlace;
  side: HeroMediaSide;
};

export const DEFAULT_HERO_MEDIA: HeroMedia = {
  kind: "none",
  url: "",
  place: "side",
  side: "right",
};

export type SiteContent = {
  name: string;
  initials: string;
  title: string;
  description: string;
  heroTemplate: HeroTemplateId;
  heroMedia: HeroMedia;
  pianoYoutubeUrl: string;
  goodreadsUrl: string;
  kicker: string;
  greeting: string;
  roles: string[];
  line: string;
  about: string;
  philosophyKicker: string;
  philosophyTitle: string;
  philosophy: string;
  experienceIntro: string;
  contactLine: string;
  email: string;
  linkedin: string;
  github: string;
  resume: string;
  stats: { value: number; suffix: string; label: string }[];
};

export type ExperienceItem = {
  id: string;
  when: string;
  current: boolean;
  role: string;
  company: string;
  summary: string;
  bullets: string[];
  stack: string[];
};

export type ProjectItem = {
  id: string;
  name: string;
  blurb: string;
  tags: string[];
  github: string;
  demo: string;
};

export type SkillItem = {
  name: string;
  icon: SkillIcon;
  color?: string;
  /** Custom icon: uploaded image URL (PNG/WebP/etc). Takes precedence over `icon`. */
  iconUrl?: string;
};

export type SkillGroup = {
  title: string;
  items: SkillItem[];
};

export type ThemeMode = "light" | "dark" | "system";

export type ThemePalette = {
  background: string;
  foreground: string;
  card: string;
  cardHover: string;
  chip: string;
  accentText: string;
  accentHover: string;
  badge: string;
};

export type SavedTheme = {
  id: string;
  name: string;
  description?: string;
  brandFrom: string;
  brandTo: string;
  dark: ThemePalette;
  light: ThemePalette;
  createdAt: string;
  updatedAt: string;
};

export type ThemeContent = {
  defaultMode: ThemeMode;
  allowToggle: boolean;
  brandFrom: string;
  brandTo: string;
  dark: ThemePalette;
  light: ThemePalette;
  /** Built-in preset id or saved theme id currently applied. */
  activeThemeId?: string | null;
  savedThemes?: SavedTheme[];
};

export const DEFAULT_THEME: ThemeContent = {
  defaultMode: "system",
  allowToggle: true,
  brandFrom: "#7C3AED",
  brandTo: "#6366F1",
  dark: {
    background: "#080808",
    foreground: "#F8F8F8",
    card: "#0F0F0F",
    cardHover: "#141414",
    chip: "#0F0F0F",
    accentText: "#A78BFA",
    accentHover: "#A78BFA",
    badge: "#C4B5FD",
  },
  light: {
    background: "#F7F7FB",
    foreground: "#121218",
    card: "#FFFFFF",
    cardHover: "#F3F1FF",
    chip: "#F4F3FA",
    accentText: "#6D28D9",
    accentHover: "#5B21B6",
    badge: "#6D28D9",
  },
  activeThemeId: null,
  savedThemes: [],
};

export const THEME_PALETTE_FIELDS: { key: keyof ThemePalette; label: string }[] = [
  { key: "background", label: "Background" },
  { key: "foreground", label: "Text" },
  { key: "card", label: "Cards" },
  { key: "cardHover", label: "Card hover" },
  { key: "chip", label: "Chips / tiles" },
  { key: "accentText", label: "Accent text" },
  { key: "accentHover", label: "Accent hover" },
  { key: "badge", label: "Badges" },
];

export type MemoryItem = {
  id: string;
  title?: string;
  note: string;
  date?: string;
  category?: string;
  icon?: string;
  photoUrl?: string;
  color?: string;
};

/** Live shelf breakpoint — matches `.bookshelf-*` CSS at 40rem. */
export const SHELF_MOBILE_MAX_REM = 40;

export type ShelfViewport = "desktop" | "mobile";

/** How a book stack displays on a plank. */
export type BookOrientation = "vertical" | "horizontal" | "tilt-left" | "tilt-right";

export const BOOK_ORIENTATIONS: BookOrientation[] = [
  "vertical",
  "horizontal",
  "tilt-left",
  "tilt-right",
];

/** Soft cap for books in one stack (editor + validation). */
export const SHELF_STACK_MAX_BOOKS = 8;

/** Default / clamp range for White Space (spacer) width in rem. */
export const SHELF_SPACER_DEFAULT_REM = 7.5;
export const SHELF_SPACER_MIN_REM = 0.5;
export const SHELF_SPACER_MAX_REM = 24;

/**
 * Type guard for BookOrientation.
 * @example isBookOrientation("tilt-left") // true
 */
export function isBookOrientation(value: string): value is BookOrientation {
  return (BOOK_ORIENTATIONS as readonly string[]).includes(value);
}

/**
 * One ordered book stack on a plank — moves/reorders as a single unit.
 * `bookIds` order: left→right for vertical/tilt; bottom→top for horizontal piles.
 */
export type ShelfBookStackItem = {
  id: string;
  type: "book-stack";
  orientation: BookOrientation;
  bookIds: string[];
};

/** Invisible horizontal gap in plank order (CMS shows a dashed placeholder). */
export type ShelfSpacerItem = {
  id: string;
  type: "spacer";
  widthRem: number;
};

/** Ordered plank composition unit (stacks + white space). Decor is free-placed. */
export type ShelfPlankItem = ShelfBookStackItem | ShelfSpacerItem;

/**
 * Free-positioned decor inside the shelf cabinet (place anywhere).
 * `xRem` is the horizontal offset from the room’s left edge (matches rem-sized stacks).
 * `xPercent` is legacy / display fallback when `xRem` is missing.
 * Optional size overrides; null/omit → catalog defaults.
 */
export type ShelfDecorPlacement = {
  id: string;
  artifactId: string;
  xPercent: number;
  /** Horizontal offset in rem from `.bookshelf-room` left; preferred over xPercent. */
  xRem?: number | null;
  yPercent: number;
  widthRem?: number | null;
  heightRem?: number | null;
};

/** One shelf plank (drop zone) with left→right ordered items. */
export type ShelfPlank = {
  id: string;
  items: ShelfPlankItem[];
};

/** Plank stacks/spacers + free decor for one viewport (desktop or mobile). */
export type ShelfViewportLayout = {
  planks: ShelfPlank[];
  decor: ShelfDecorPlacement[];
};

/** CMS-managed plank layouts for desktop + mobile (fully independent). */
export type ShelfLayout = {
  desktop: ShelfViewportLayout;
  mobile: ShelfViewportLayout;
};

/**
 * Builds N empty planks with stable ids.
 * @example createEmptyPlanks(2) // [{id:"plank-1",items:[]},…]
 */
export function createEmptyPlanks(count: number): ShelfPlank[] {
  const n = Math.min(6, Math.max(1, Math.trunc(count) || 1));
  return Array.from({ length: n }, (_, i) => ({
    id: `plank-${i + 1}`,
    items: [],
  }));
}

/**
 * Empty viewport layout with two planks and no decor.
 * @example emptyViewportLayout() // { planks: […], decor: [] }
 */
export function emptyViewportLayout(plankCount = 2): ShelfViewportLayout {
  return { planks: createEmptyPlanks(plankCount), decor: [] };
}

export const EMPTY_SHELF_LAYOUT: ShelfLayout = {
  desktop: emptyViewportLayout(2),
  mobile: emptyViewportLayout(2),
};

/**
 * Picks desktop vs mobile plank tree (always includes a decor array).
 * @example shelfViewportFor(layout, "mobile") // ShelfViewportLayout
 */
export function shelfViewportFor(layout: ShelfLayout, viewport: ShelfViewport): ShelfViewportLayout {
  const raw = viewport === "mobile" ? layout.mobile : layout.desktop;
  if (!raw?.planks?.length) return emptyViewportLayout(2);
  return {
    planks: raw.planks,
    decor: Array.isArray(raw.decor) ? raw.decor : [],
  };
}

/**
 * True when the viewport has at least one stack/spacer or decor placement.
 * @example shelfViewportHasItems(layout.desktop) // true
 */
export function shelfViewportHasItems(view: ShelfViewportLayout | null | undefined) {
  if (!view) return false;
  const planks = view.planks ?? [];
  const decor = view.decor ?? [];
  return planks.some((plank) => (plank.items?.length ?? 0) > 0) || decor.length > 0;
}

/**
 * Collects Goodreads book ids already placed in a viewport (unique).
 * @example placedBookIds(layout, "desktop") // Set<"123">
 */
export function placedBookIds(layout: ShelfLayout, viewport: ShelfViewport): Set<string> {
  const ids = new Set<string>();
  for (const plank of shelfViewportFor(layout, viewport).planks) {
    for (const item of plank.items) {
      if (item.type !== "book-stack") continue;
      for (const bookId of item.bookIds) {
        if (bookId.trim()) ids.add(bookId);
      }
    }
  }
  return ids;
}

/**
 * Collects catalog artifact ids used in a viewport's free decor layer.
 * @example placedArtifactIds(layout, "desktop") // Set<"a1">
 */
export function placedArtifactIds(layout: ShelfLayout, viewport: ShelfViewport): Set<string> {
  const ids = new Set<string>();
  for (const decor of shelfViewportFor(layout, viewport).decor) {
    if (decor.artifactId.trim()) ids.add(decor.artifactId);
  }
  return ids;
}

/**
 * True when an artifact id appears on either viewport layout.
 * @example isArtifactOnShelf(layout, id) // true
 */
export function isArtifactOnShelf(layout: ShelfLayout, artifactId: string) {
  return (
    placedArtifactIds(layout, "desktop").has(artifactId) ||
    placedArtifactIds(layout, "mobile").has(artifactId)
  );
}

/** CMS-managed shelf ornament catalog entry (placement lives in ShelfLayout). */
export type ShelfArtifactItem = {
  id: string;
  name: string;
  imageUrl: string;
  widthRem: number;
  heightRem: number;
  enabled: boolean;
};

export type CraftItem = {
  title: string;
  why: string;
};

export type CraftGroup = {
  title: string;
  intro: string;
  items: CraftItem[];
};

export type CraftContent = {
  kicker: string;
  title: string;
  intro: string;
  footnote: string;
  groups: CraftGroup[];
};

export const EMPTY_CRAFT: CraftContent = {
  kicker: "",
  title: "",
  intro: "",
  footnote: "",
  groups: [],
};

export type ContentData = {
  site: SiteContent;
  experience: ExperienceItem[];
  projects: ProjectItem[];
  skills: SkillGroup[];
  technologies?: SkillGroup[];
  theme: ThemeContent;
  memories?: MemoryItem[];
  craft?: CraftContent;
  shelfArtifacts?: ShelfArtifactItem[];
  shelfLayout?: ShelfLayout;
};

/** Public site props: sensitive media URLs stripped; playback via server proxy. */
export type PublicSiteContent = Omit<SiteContent, "pianoYoutubeUrl"> & {
  pianoAvailable: boolean;
};

export type PublicContentData = Omit<ContentData, "site"> & {
  site: PublicSiteContent;
};

/**
 * Strips sensitive media URLs for public pages.
 * @example toPublicContent(data) // PublicContentData
 */
export function toPublicContent(content: ContentData): PublicContentData {
  const { pianoYoutubeUrl, ...rest } = content.site;
  return {
    ...content,
    site: {
      ...rest,
      pianoAvailable: Boolean(pianoYoutubeUrl?.trim()),
    },
  };
}

/**
 * True when piano media is available on public or full site.
 * @example siteHasPiano(site) // true
 */
export function siteHasPiano(site: PublicSiteContent | SiteContent) {
  if ("pianoAvailable" in site && typeof site.pianoAvailable === "boolean") {
    return site.pianoAvailable;
  }
  return Boolean("pianoYoutubeUrl" in site && site.pianoYoutubeUrl?.trim());
}

