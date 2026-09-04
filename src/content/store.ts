import type { Prisma, PrismaClient } from "@prisma/client";
import { normalizeHex } from "@/lib/hex";
import { prisma } from "@/lib/prisma";
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

const SITE_ID = "main";

type DbClient = PrismaClient | Prisma.TransactionClient;

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
    resume: str(s.resume),
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
      const iconUrl = str(row.iconUrl);
      return {
        name: str(row.name, "Item"),
        icon: isSkillIcon(iconRaw) ? iconRaw : "empty",
        ...(color ? { color } : {}),
        ...(iconUrl ? { iconUrl } : {}),
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

function siteSettingsData(site: SiteContent, theme: ThemeContent) {
  return {
    name: site.name,
    initials: site.initials,
    title: site.title,
    description: site.description,
    heroTemplate: site.heroTemplate,
    heroMediaKind: site.heroMedia.kind,
    heroMediaUrl: site.heroMedia.url,
    heroMediaPlace: site.heroMedia.place,
    heroMediaSide: site.heroMedia.side,
    pianoYoutubeUrl: site.pianoYoutubeUrl,
    goodreadsUrl: site.goodreadsUrl,
    kicker: site.kicker,
    greeting: site.greeting,
    roles: site.roles,
    line: site.line,
    about: site.about,
    philosophyKicker: site.philosophyKicker,
    philosophyTitle: site.philosophyTitle,
    philosophy: site.philosophy,
    experienceIntro: site.experienceIntro,
    contactLine: site.contactLine,
    email: site.email,
    linkedin: site.linkedin,
    github: site.github,
    resume: site.resume,
    themeDefaultMode: theme.defaultMode,
    themeAllowToggle: theme.allowToggle,
    themeBrandFrom: theme.brandFrom,
    themeBrandTo: theme.brandTo,
    darkBackground: theme.dark.background,
    darkForeground: theme.dark.foreground,
    darkCard: theme.dark.card,
    darkCardHover: theme.dark.cardHover,
    darkChip: theme.dark.chip,
    darkAccentText: theme.dark.accentText,
    darkAccentHover: theme.dark.accentHover,
    darkBadge: theme.dark.badge,
    lightBackground: theme.light.background,
    lightForeground: theme.light.foreground,
    lightCard: theme.light.card,
    lightCardHover: theme.light.cardHover,
    lightChip: theme.light.chip,
    lightAccentText: theme.light.accentText,
    lightAccentHover: theme.light.accentHover,
    lightBadge: theme.light.badge,
  };
}

/** Write a full ContentData document into normalized tables. */
export async function persistContent(db: DbClient, raw: ContentData): Promise<void> {
  const data = parseContent(raw);
  const siteFields = siteSettingsData(data.site, data.theme);

  await db.siteSettings.upsert({
    where: { id: SITE_ID },
    create: { id: SITE_ID, ...siteFields },
    update: siteFields,
  });

  // Clear collections first (SkillGroup cascade removes SkillItem).
  await Promise.all([
    db.siteStat.deleteMany({ where: { siteId: SITE_ID } }),
    db.experience.deleteMany(),
    db.project.deleteMany(),
    db.memory.deleteMany(),
    db.skillGroup.deleteMany(),
  ]);

  const skillCreates: Prisma.SkillGroupCreateInput[] = [];
  const skillBundles: { kind: "skills" | "technologies"; groups: SkillGroup[] }[] = [
    { kind: "skills", groups: data.skills },
    { kind: "technologies", groups: data.technologies ?? [] },
  ];
  for (const bundle of skillBundles) {
    for (let g = 0; g < bundle.groups.length; g++) {
      const group = bundle.groups[g];
      skillCreates.push({
        kind: bundle.kind,
        title: group.title,
        sortOrder: g,
        items: {
          create: group.items.map((item, i) => ({
            sortOrder: i,
            name: item.name,
            icon: item.icon,
            color: item.color ?? null,
            iconUrl: item.iconUrl ?? null,
          })),
        },
      });
    }
  }

  await Promise.all([
    data.site.stats.length > 0
      ? db.siteStat.createMany({
          data: data.site.stats.map((stat, i) => ({
            siteId: SITE_ID,
            sortOrder: i,
            value: stat.value,
            suffix: stat.suffix,
            label: stat.label,
          })),
        })
      : Promise.resolve(),
    data.experience.length > 0
      ? db.experience.createMany({
          data: data.experience.map((item, i) => ({
            id: item.id,
            sortOrder: i,
            when: item.when,
            current: item.current,
            role: item.role,
            company: item.company,
            summary: item.summary,
            bullets: item.bullets,
            stack: item.stack,
          })),
        })
      : Promise.resolve(),
    data.projects.length > 0
      ? db.project.createMany({
          data: data.projects.map((item, i) => ({
            id: item.id,
            sortOrder: i,
            name: item.name,
            blurb: item.blurb,
            tags: item.tags,
            github: item.github,
            demo: item.demo,
          })),
        })
      : Promise.resolve(),
    (data.memories ?? []).length > 0
      ? db.memory.createMany({
          data: (data.memories ?? []).map((item, i) => ({
            id: item.id,
            sortOrder: i,
            title: item.title ?? "",
            note: item.note,
            date: item.date ?? "",
            category: item.category ?? "",
            icon: item.icon ?? "",
            photoUrl: item.photoUrl ?? "",
            color: item.color ?? "",
          })),
        })
      : Promise.resolve(),
  ]);

  // Nested creates can't use createMany; run sequentially but few groups.
  for (const create of skillCreates) {
    await db.skillGroup.create({ data: create });
  }
}

export async function loadContent(): Promise<ContentData> {
  const [site, experience, projects, memories, skillGroups] = await Promise.all([
    prisma.siteSettings.findUnique({
      where: { id: SITE_ID },
      include: { stats: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.experience.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.project.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.memory.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.skillGroup.findMany({
      orderBy: [{ kind: "asc" }, { sortOrder: "asc" }],
      include: { items: { orderBy: { sortOrder: "asc" } } },
    }),
  ]);

  if (!site) {
    throw new Error(
      'No site settings found. Run `npm run db:seed` after setting DATABASE_URL and DIRECT_URL.',
    );
  }

  const toSkillGroups = (kind: string): SkillGroup[] =>
    skillGroups
      .filter((g) => g.kind === kind)
      .map((g) => ({
        title: g.title,
        items: g.items.map((item) => ({
          name: item.name,
          icon: isSkillIcon(item.icon) ? item.icon : "empty",
          ...(item.color ? { color: item.color } : {}),
          ...(item.iconUrl ? { iconUrl: item.iconUrl } : {}),
        })),
      }));

  return parseContent({
    site: {
      name: site.name,
      initials: site.initials,
      title: site.title,
      description: site.description,
      heroTemplate: site.heroTemplate,
      heroMedia: {
        kind: site.heroMediaKind,
        url: site.heroMediaUrl,
        place: site.heroMediaPlace,
        side: site.heroMediaSide,
      },
      pianoYoutubeUrl: site.pianoYoutubeUrl,
      goodreadsUrl: site.goodreadsUrl,
      kicker: site.kicker,
      greeting: site.greeting,
      roles: site.roles,
      line: site.line,
      about: site.about,
      philosophyKicker: site.philosophyKicker,
      philosophyTitle: site.philosophyTitle,
      philosophy: site.philosophy,
      experienceIntro: site.experienceIntro,
      contactLine: site.contactLine,
      email: site.email,
      linkedin: site.linkedin,
      github: site.github,
      resume: site.resume,
      stats: site.stats.map((s) => ({
        value: s.value,
        suffix: s.suffix,
        label: s.label,
      })),
    },
    experience: experience.map((item) => ({
      id: item.id,
      when: item.when,
      current: item.current,
      role: item.role,
      company: item.company,
      summary: item.summary,
      bullets: item.bullets,
      stack: item.stack,
    })),
    projects: projects.map((item) => ({
      id: item.id,
      name: item.name,
      blurb: item.blurb,
      tags: item.tags,
      github: item.github,
      demo: item.demo,
    })),
    skills: toSkillGroups("skills"),
    technologies: toSkillGroups("technologies"),
    theme: {
      defaultMode: site.themeDefaultMode,
      allowToggle: site.themeAllowToggle,
      brandFrom: site.themeBrandFrom,
      brandTo: site.themeBrandTo,
      dark: {
        background: site.darkBackground,
        foreground: site.darkForeground,
        card: site.darkCard,
        cardHover: site.darkCardHover,
        chip: site.darkChip,
        accentText: site.darkAccentText,
        accentHover: site.darkAccentHover,
        badge: site.darkBadge,
      },
      light: {
        background: site.lightBackground,
        foreground: site.lightForeground,
        card: site.lightCard,
        cardHover: site.lightCardHover,
        chip: site.lightChip,
        accentText: site.lightAccentText,
        accentHover: site.lightAccentHover,
        badge: site.lightBadge,
      },
    },
    memories: memories.map((item) => ({
      id: item.id,
      title: item.title,
      note: item.note,
      date: item.date,
      category: item.category,
      icon: item.icon,
      photoUrl: item.photoUrl,
      color: item.color,
    })),
  });
}

const TX_OPTIONS = { maxWait: 15_000, timeout: 60_000 } as const;

export async function saveContent(data: ContentData): Promise<void> {
  const parsed = parseContent(data);
  await prisma.$transaction(async (tx) => {
    await persistContent(tx, parsed);
  }, TX_OPTIONS);
}
