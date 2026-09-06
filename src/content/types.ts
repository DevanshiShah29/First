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

export type ThemeContent = {
  defaultMode: ThemeMode;
  allowToggle: boolean;
  brandFrom: string;
  brandTo: string;
  dark: ThemePalette;
  light: ThemePalette;
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

export type ContentData = {
  site: SiteContent;
  experience: ExperienceItem[];
  projects: ProjectItem[];
  skills: SkillGroup[];
  technologies?: SkillGroup[];
  theme: ThemeContent;
  memories?: MemoryItem[];
};

/** Public site props: sensitive media URLs stripped; playback via server proxy. */
export type PublicSiteContent = Omit<SiteContent, "pianoYoutubeUrl"> & {
  pianoAvailable: boolean;
};

export type PublicContentData = Omit<ContentData, "site"> & {
  site: PublicSiteContent;
};

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

export function siteHasPiano(site: PublicSiteContent | SiteContent) {
  if ("pianoAvailable" in site && typeof site.pianoAvailable === "boolean") {
    return site.pianoAvailable;
  }
  return Boolean("pianoYoutubeUrl" in site && site.pianoYoutubeUrl?.trim());
}

