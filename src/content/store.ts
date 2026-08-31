import { promises as fs } from "fs";
import path from "path";
import { normalizeHex } from "@/lib/hex";
import {
  DEFAULT_HERO_MEDIA,
  DEFAULT_THEME,
  isHeroTemplate,
  isSkillIcon,
  type ContentData,
  type ExperienceItem,
  type HeroMedia,
  type HeroMediaKind,
  type HeroMediaPlace,
  type HeroMediaSide,
  type MemoryItem,
  type ProjectItem,
  type SiteContent,
  type SkillGroup,
  type SkillItem,
  type ThemeContent,
  type ThemeMode,
  type ThemePalette,
} from "./types";

const DATA_PATH = path.join(process.cwd(), "src/content/data.json");

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function bool(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function num(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function strList(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => str(item)).filter(Boolean) : [];
}

function parseHeroMedia(value: unknown): HeroMedia {
  const row = asRecord(value);
  const kindRaw = str(row.kind, DEFAULT_HERO_MEDIA.kind);
  const kind: HeroMediaKind =
    kindRaw === "image" || kindRaw === "video" || kindRaw === "none" ? kindRaw : "none";
  const placeRaw = str(row.place, DEFAULT_HERO_MEDIA.place);
  const place: HeroMediaPlace = placeRaw === "background" ? "background" : "side";
  const sideRaw = str(row.side, DEFAULT_HERO_MEDIA.side);
  const side: HeroMediaSide = sideRaw === "left" ? "left" : "right";
  return {
    kind,
    url: str(row.url),
    place,
    side,
  };
}

function parseSite(value: unknown): SiteContent {
  const s = asRecord(value);
  const statsRaw = Array.isArray(s.stats) ? s.stats : [];
  return {
    name: str(s.name, "Devanshi Shah"),
    initials: str(s.initials, "DS").slice(0, 4),
    title: str(s.title),
    description: str(s.description),
    heroTemplate: (() => {
      const hero = str(s.heroTemplate, "classic");
      return isHeroTemplate(hero) ? hero : "classic";
    })(),
    heroMedia: parseHeroMedia(s.heroMedia),
    pianoYoutubeUrl: str(s.pianoYoutubeUrl),
    goodreadsUrl: str(s.goodreadsUrl),
    kicker: str(s.kicker),
    greeting: str(s.greeting),
    roles: strList(s.roles),
    line: str(s.line),
    about: str(s.about),
    philosophyKicker: str(s.philosophyKicker),
    philosophyTitle: str(s.philosophyTitle),
    philosophy: str(s.philosophy),
    experienceIntro: str(s.experienceIntro),
    contactLine: str(s.contactLine),
    email: str(s.email),
    linkedin: str(s.linkedin),
    github: str(s.github),
    resume: str(s.resume, "/resume.pdf"),
    stats: statsRaw.map((item) => {
      const row = asRecord(item);
      return {
        value: Math.max(0, Math.round(num(row.value))),
        suffix: str(row.suffix),
        label: str(row.label, "Stat"),
      };
    }),
  };
}

function parseExperience(value: unknown): ExperienceItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, i) => {
    const row = asRecord(item);
    return {
      id: str(row.id, `exp-${i + 1}`),
      when: str(row.when),
      current: bool(row.current),
      role: str(row.role, "Role"),
      company: str(row.company),
      summary: str(row.summary),
      bullets: strList(row.bullets),
      stack: strList(row.stack),
    };
  });
}

function parseProjects(value: unknown): ProjectItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, i) => {
    const row = asRecord(item);
    return {
      id: str(row.id, `project-${i + 1}`),
      name: str(row.name, "Untitled"),
      blurb: str(row.blurb),
      tags: strList(row.tags),
      github: str(row.github),
      demo: str(row.demo),
    };
  });
}

function parseSkillGroups(value: unknown, defaultTitle = "Skills"): SkillGroup[] {
  if (!Array.isArray(value)) return [];
  return value.map((group) => {
    const g = asRecord(group);
    const itemsRaw = Array.isArray(g.items) ? g.items : [];
    const items: SkillItem[] = itemsRaw.map((item) => {
      const row = asRecord(item);
      const iconRaw = str(row.icon, "empty");
      const color = str(row.color);
      return {
        name: str(row.name, "Item"),
        icon: isSkillIcon(iconRaw) ? iconRaw : "empty",
        ...(color ? { color } : {}),
      };
    });
    return { title: str(g.title, defaultTitle), items };
  });
}

function parseMode(value: unknown): ThemeMode {
  return value === "light" || value === "dark" || value === "system" ? value : DEFAULT_THEME.defaultMode;
}

function parsePalette(value: unknown, fallback: ThemePalette): ThemePalette {
  const row = asRecord(value);
  return {
    background: normalizeHex(row.background, fallback.background),
    foreground: normalizeHex(row.foreground, fallback.foreground),
    card: normalizeHex(row.card, fallback.card),
    cardHover: normalizeHex(row.cardHover, fallback.cardHover),
    chip: normalizeHex(row.chip, fallback.chip),
    accentText: normalizeHex(row.accentText, fallback.accentText),
    accentHover: normalizeHex(row.accentHover, fallback.accentHover),
    badge: normalizeHex(row.badge, fallback.badge),
  };
}

function parseTheme(value: unknown): ThemeContent {
  const row = asRecord(value);
  return {
    defaultMode: parseMode(row.defaultMode),
    allowToggle: bool(row.allowToggle, DEFAULT_THEME.allowToggle),
    brandFrom: normalizeHex(row.brandFrom, DEFAULT_THEME.brandFrom),
    brandTo: normalizeHex(row.brandTo, DEFAULT_THEME.brandTo),
    dark: parsePalette(row.dark, DEFAULT_THEME.dark),
    light: parsePalette(row.light, DEFAULT_THEME.light),
  };
}

function parseMemories(value: unknown): MemoryItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, i) => {
    const row = asRecord(item);
    return {
      id: str(row.id, `mem-${i + 1}`),
      title: str(row.title),
      note: str(row.note),
      date: str(row.date),
      category: str(row.category),
      icon: str(row.icon),
      photoUrl: str(row.photoUrl),
      color: str(row.color),
    };
  });
}

export function parseContent(value: unknown): ContentData {
  const root = asRecord(value);
  return {
    site: parseSite(root.site),
    experience: parseExperience(root.experience),
    projects: parseProjects(root.projects),
    skills: parseSkillGroups(root.skills, "Skills"),
    technologies: parseSkillGroups(root.technologies, "Technologies"),
    theme: parseTheme(root.theme),
    memories: parseMemories(root.memories),
  };
}

export async function loadContent(): Promise<ContentData> {
  const raw = await fs.readFile(DATA_PATH, "utf8");
  return parseContent(JSON.parse(raw) as unknown);
}

export async function saveContent(data: ContentData): Promise<void> {
  const parsed = parseContent(data);
  const tmp = `${DATA_PATH}.tmp`;
  await fs.writeFile(tmp, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
  await fs.rename(tmp, DATA_PATH);
}
