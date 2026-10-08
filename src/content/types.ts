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

/** Public areas that can be hidden from the live site without deleting their CMS content. */
export const SITE_SECTIONS = [
  { id: "hero", label: "Hero", where: "Homepage" },
  { id: "about", label: "About", where: "Homepage" },
  { id: "experience", label: "Experience", where: "Homepage" },
  { id: "projects", label: "Projects", where: "Homepage" },
  { id: "skills", label: "Skills", where: "Homepage" },
  { id: "technologies", label: "Technologies", where: "Homepage" },
  { id: "contact", label: "Contact", where: "Homepage" },
  { id: "craft", label: "Craft", where: "Craft page" },
  { id: "memories", label: "Memories", where: "Memories page" },
  { id: "reading", label: "Book Nook", where: "Book Nook page" },
] as const;

export type SiteSectionId = (typeof SITE_SECTIONS)[number]["id"];

/** Missing or unknown keys stay shown so existing sites do not disappear. */
export type SectionVisibility = Record<SiteSectionId, boolean>;

export const DEFAULT_SECTIONS: SectionVisibility = {
  hero: true,
  about: true,
  experience: true,
  projects: true,
  skills: true,
  technologies: true,
  contact: true,
  craft: true,
  memories: true,
  reading: true,
};

/**
 * Fills a stored visibility map. Only real booleans override the shown default.
 * @example normalizeSections({ hero: false }) // hero hidden, rest shown
 */
export function normalizeSections(value: unknown): SectionVisibility {
  const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const next = { ...DEFAULT_SECTIONS };
  for (const section of SITE_SECTIONS) {
    const flag = raw[section.id];
    if (typeof flag === "boolean") next[section.id] = flag;
  }
  return next;
}

/**
 * True when a section should render on the public site.
 * @example sectionEnabled({ hero: false }, "hero") // false
 */
export function sectionEnabled(
  sections: Partial<SectionVisibility> | null | undefined,
  id: SiteSectionId,
): boolean {
  return sections?.[id] !== false;
}

/**
 * The Skills nav target stays while either skills or technologies is shown.
 * @example skillsNavEnabled({ skills: false, technologies: true }) // true
 */
export function skillsNavEnabled(
  sections: Partial<SectionVisibility> | null | undefined,
): boolean {
  return sectionEnabled(sections, "skills") || sectionEnabled(sections, "technologies");
}

/**
 * True when a header or footer href points at a section that is shown.
 * @example isNavHrefEnabled("/reading", { reading: false }) // false
 */
export function isNavHrefEnabled(
  href: string,
  sections: Partial<SectionVisibility> | null | undefined,
): boolean {
  if (href === "/reading") return sectionEnabled(sections, "reading");
  if (href === "/memories" || href === "/memory-jar") return sectionEnabled(sections, "memories");
  if (href === "/craft") return sectionEnabled(sections, "craft");
  const hashAt = href.indexOf("#");
  if (hashAt === -1) return true;
  switch (href.slice(hashAt)) {
    case "#about":
      return sectionEnabled(sections, "about");
    case "#experience":
      return sectionEnabled(sections, "experience");
    case "#projects":
      return sectionEnabled(sections, "projects");
    case "#skills":
      return skillsNavEnabled(sections);
    case "#contact":
      return sectionEnabled(sections, "contact");
    default:
      return true;
  }
}

export type ContactMediaKind = "none" | "image" | "video";

/** Image or video shown on the contact card. Empty kind keeps the built-in scene. */
export type ContactMedia = {
  kind: ContactMediaKind;
  url: string;
  /** Accessible name. An empty alt treats an image as decorative. */
  alt: string;
};

export const DEFAULT_CONTACT_MEDIA: ContactMedia = {
  kind: "none",
  url: "",
  alt: "",
};

/**
 * True when contact media should replace the built-in scene.
 * @example hasContactMedia({ kind: "image", url: "/a.jpg", alt: "" }) // true
 */
export function hasContactMedia(
  media: ContactMedia | null | undefined,
): media is ContactMedia {
  return Boolean(media && media.kind !== "none" && media.url.trim());
}

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
  contactMedia: ContactMedia;
  email: string;
  linkedin: string;
  github: string;
  resume: string;
  stats: { value: number; suffix: string; label: string }[];
  /** Homepage and standalone pages. Missing means every section stays shown. */
  sections?: SectionVisibility;
};

/** Public visibility for a CMS entry. Missing means published. */
export type PublishStatus = "published" | "draft";

/**
 * Coerces a stored status. Anything other than "draft" stays published.
 * @example publishStatusOf("draft") // "draft"
 */
export function publishStatusOf(value: unknown): PublishStatus {
  return value === "draft" ? "draft" : "published";
}

/**
 * True when an entry should appear on the public site.
 * @example isPublished("draft") // false
 */
export function isPublished(status: PublishStatus | null | undefined): boolean {
  return status !== "draft";
}

export type ExperienceItem = {
  id: string;
  when: string;
  current: boolean;
  role: string;
  company: string;
  summary: string;
  bullets: string[];
  stack: string[];
  /** Missing means published so existing roles stay on the public site. */
  status?: PublishStatus;
};

export type ProjectItem = {
  id: string;
  name: string;
  blurb: string;
  tags: string[];
  github: string;
  demo: string;
  /** Missing means published so existing projects stay on the public site. */
  status?: PublishStatus;
};

export type SkillItem = {
  name: string;
  icon: SkillIcon;
  color?: string;
  /** Custom icon: uploaded image URL (PNG/WebP/etc). Takes precedence over `icon`. */
  iconUrl?: string;
  /** Missing means published so existing skills stay on the public site. */
  status?: PublishStatus;
};

export type SkillGroup = {
  title: string;
  items: SkillItem[];
  /** Missing means published so existing groups stay on the public site. */
  status?: PublishStatus;
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
  /** Missing means published so existing memories stay in the public jar. */
  status?: PublishStatus;
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
  /** Missing means published so existing notes stay on the public page. */
  status?: PublishStatus;
};

export type CraftGroup = {
  title: string;
  intro: string;
  items: CraftItem[];
  /** Missing means published so existing groups stay on the public page. */
  status?: PublishStatus;
};

export type CraftContent = {
  kicker: string;
  title: string;
  intro: string;
  footnote: string;
  groups: CraftGroup[];
  /** Missing means published so the existing /craft page stays public. */
  status?: PublishStatus;
};

export const EMPTY_CRAFT: CraftContent = {
  kicker: "",
  title: "",
  intro: "",
  footnote: "",
  groups: [],
  status: "published",
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
 * Keeps published skill groups and drops draft items inside them.
 * Groups with no published items are omitted.
 * @example publishedSkillGroups(groups) // SkillGroup[]
 */
function publishedSkillGroups(groups: SkillGroup[] | undefined): SkillGroup[] {
  return (groups ?? [])
    .filter((group) => isPublished(group.status))
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => isPublished(item.status)),
    }))
    .filter((group) => group.items.length > 0);
}

/**
 * Returns craft copy with draft groups and items removed.
 * A draft page is omitted entirely.
 * @example publishedCraft(craft) // CraftContent | undefined
 */
function publishedCraft(craft: CraftContent | undefined): CraftContent | undefined {
  if (!craft || !isPublished(craft.status)) return undefined;
  return {
    ...craft,
    groups: craft.groups
      .filter((group) => isPublished(group.status))
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => isPublished(item.status)),
      }))
      .filter((group) => group.title.trim() || group.intro.trim() || group.items.length > 0),
  };
}

/**
 * Strips sensitive media URLs and draft entries for public pages.
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
    experience: content.experience.filter((item) => isPublished(item.status)),
    projects: content.projects.filter((item) => isPublished(item.status)),
    skills: publishedSkillGroups(content.skills),
    technologies: publishedSkillGroups(content.technologies),
    memories: (content.memories ?? []).filter((item) => isPublished(item.status)),
    craft: publishedCraft(content.craft),
    shelfArtifacts: content.shelfArtifacts ?? [],
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

