import type { Prisma, PrismaClient } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { normalizeHex } from "@/lib/hex";
import { prisma } from "@/server/prisma";
import { decryptSecret, encryptSecret } from "@/server/secrets-crypto";
import {
  DEFAULT_HERO_MEDIA,
  DEFAULT_THEME,
  EMPTY_CRAFT,
  isHeroTemplate,
  isSkillIcon,
  type ContentData,
  type CraftContent,
  type CraftGroup,
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

/** Tag for on-demand invalidation after CMS saves (`revalidateTag`). */
export const CMS_CONTENT_TAG = "cms-content";

type DbClient = PrismaClient | Prisma.TransactionClient;

/**
 * Coerces unknown to a plain object.
 * @example asRecord({a:1}) // {a:1}, asRecord(null) // {}
 */
function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/**
 * Reads a string field or returns fallback.
 * @example str("hi") // "hi", str(1, "x") // "x"
 */
function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

/**
 * Reads a boolean field or returns fallback.
 * @example bool(true) // true, bool("yes") // false
 */
function bool(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

/**
 * Reads a finite number or returns fallback.
 * @example num(3) // 3, num(NaN, 0) // 0
 */
function num(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/**
 * Maps an array to non-empty strings.
 * @example strList(["a", ""]) // ["a"]
 */
function strList(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => str(item)).filter(Boolean) : [];
}

/**
 * Parses hero media JSON into HeroMedia.
 * @example parseHeroMedia({kind:"image"}) // HeroMedia
 */
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

/**
 * Parses site settings JSON into SiteContent with safe defaults.
 * @example parseSite({}) // SiteContent
 */
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

/**
 * Parses experience array JSON.
 * @example parseExperience([{role:"PM"}]) // ExperienceItem[]
 */
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

/**
 * Parses projects array JSON.
 * @example parseProjects([{name:"App"}]) // ProjectItem[]
 */
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

/**
 * Parses skill/technology group arrays.
 * @example parseSkillGroups([{title:"Lang"}]) // SkillGroup[]
 */
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

/**
 * Parses theme mode string.
 * @example parseMode("dark") // "dark", parseMode("x") // default
 */
function parseMode(value: unknown): ThemeMode {
  return value === "light" || value === "dark" || value === "system" ? value : DEFAULT_THEME.defaultMode;
}

/**
 * Parses a theme palette with hex normalization.
 * @example parsePalette({}, DEFAULT_THEME.dark) // ThemePalette
 */
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

/**
 * Parses theme settings JSON.
 * @example parseTheme({defaultMode:"system"}) // ThemeContent
 */
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

/**
 * Parses memories array JSON.
 * @example parseMemories([{note:"hi"}]) // MemoryItem[]
 */
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

/**
 * Parses craft page JSON into CraftContent.
 * @example parseCraft({title:"Craft"}) // CraftContent
 */
function parseCraft(value: unknown): CraftContent {
  const root = asRecord(value);
  const groupsRaw = Array.isArray(root.groups) ? root.groups : [];
  return {
    kicker: str(root.kicker),
    title: str(root.title),
    intro: str(root.intro),
    footnote: str(root.footnote),
    groups: groupsRaw.map((group) => {
      const g = asRecord(group);
      const itemsRaw = Array.isArray(g.items) ? g.items : [];
      return {
        title: str(g.title, "Untitled group"),
        intro: str(g.intro),
        items: itemsRaw.map((item) => {
          const row = asRecord(item);
          return {
            title: str(row.title, "Untitled"),
            why: str(row.why),
          };
        }),
      };
    }),
  };
}

/**
 * Soft-coerces unknown JSON into ContentData for seed/import.
 * @example parseContent({}) // ContentData
 */
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
    craft: parseCraft(root.craft),
  };
}

/**
 * Builds encrypted site row fields for Prisma.
 * @example await siteCoreData(site) // SiteSettings input
 */
async function siteCoreData(site: SiteContent) {
  return {
    name: site.name,
    initials: site.initials,
    title: site.title,
    description: site.description,
    pianoYoutubeUrl: await encryptSecret(site.pianoYoutubeUrl),
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
  };
}

/**
 * Maps site hero fields to HeroSettings columns.
 * @example heroSettingsData(site) // {template, mediaKind, …}
 */
function heroSettingsData(site: SiteContent) {
  return {
    template: site.heroTemplate,
    mediaKind: site.heroMedia.kind,
    mediaUrl: site.heroMedia.url,
    mediaPlace: site.heroMedia.place,
    mediaSide: site.heroMedia.side,
  };
}

/**
 * Maps ThemeContent to ThemeSettings columns.
 * @example themeSettingsData(theme) // {defaultMode, dark, …}
 */
function themeSettingsData(theme: ThemeContent) {
  return {
    defaultMode: theme.defaultMode,
    allowToggle: theme.allowToggle,
    brandFrom: theme.brandFrom,
    brandTo: theme.brandTo,
    dark: theme.dark,
    light: theme.light,
  };
}

/**
 * Coerces DB JSON palette into ThemePalette.
 * @example asThemePalette(row.dark, fallback) // ThemePalette
 */
function asThemePalette(value: unknown, fallback: ThemePalette): ThemePalette {
  return parsePalette(value, fallback);
}

/**
 * Writes validated ContentData into normalized Prisma tables.
 * @example await persistContent(tx, data) // void
 */
export async function persistContent(db: DbClient, data: ContentData): Promise<void> {
  const siteFields = await siteCoreData(data.site);
  const heroFields = heroSettingsData(data.site);
  const themeFields = themeSettingsData(data.theme);

  await db.siteSettings.upsert({
    where: { id: SITE_ID },
    create: { id: SITE_ID, ...siteFields },
    update: siteFields,
  });

  await Promise.all([
    db.heroSettings.upsert({
      where: { siteId: SITE_ID },
      create: { siteId: SITE_ID, ...heroFields },
      update: heroFields,
    }),
    db.themeSettings.upsert({
      where: { siteId: SITE_ID },
      create: { siteId: SITE_ID, ...themeFields },
      update: themeFields,
    }),
  ]);

  const craft = data.craft ?? EMPTY_CRAFT;

  // Clear collections first (SkillGroup / CraftGroup cascade removes items).
  await Promise.all([
    db.siteStat.deleteMany({ where: { siteId: SITE_ID } }),
    db.experience.deleteMany(),
    db.project.deleteMany(),
    db.memory.deleteMany(),
    db.skillGroup.deleteMany(),
    db.craftGroup.deleteMany(),
  ]);

  await db.craftSettings.upsert({
    where: { id: SITE_ID },
    create: {
      id: SITE_ID,
      kicker: craft.kicker,
      title: craft.title,
      intro: craft.intro,
      footnote: craft.footnote,
    },
    update: {
      kicker: craft.kicker,
      title: craft.title,
      intro: craft.intro,
      footnote: craft.footnote,
    },
  });

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

  const craftCreates: Prisma.CraftGroupCreateInput[] = craft.groups.map((group, g) => ({
    craft: { connect: { id: SITE_ID } },
    title: group.title,
    intro: group.intro,
    sortOrder: g,
    items: {
      create: group.items.map((item, i) => ({
        sortOrder: i,
        title: item.title,
        why: item.why,
      })),
    },
  }));

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
  for (const create of craftCreates) {
    await db.craftGroup.create({ data: create });
  }
}

/**
 * Loads the full CMS document from Prisma and coerces it.
 * @example await fetchContentFromDb() // ContentData
 */
async function fetchContentFromDb(): Promise<ContentData> {
  const [site, experience, projects, memories, skillGroups, craftSettings] = await Promise.all([
    prisma.siteSettings.findUnique({
      where: { id: SITE_ID },
      include: {
        stats: { orderBy: { sortOrder: "asc" } },
        hero: true,
        theme: true,
      },
    }),
    prisma.experience.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.project.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.memory.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.skillGroup.findMany({
      orderBy: [{ kind: "asc" }, { sortOrder: "asc" }],
      include: { items: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.craftSettings.findUnique({
      where: { id: SITE_ID },
      include: {
        groups: {
          orderBy: { sortOrder: "asc" },
          include: { items: { orderBy: { sortOrder: "asc" } } },
        },
      },
    }),
  ]);

  if (!site) {
    throw new Error(
      'No site settings found. Run `npm run db:seed` after setting DATABASE_URL and DIRECT_URL.',
    );
  }

  if (!site.hero || !site.theme) {
    throw new Error(
      "Site hero/theme rows missing. Re-run the site-split migration or `npm run db:seed`.",
    );
  }

  /**
   * Filters DB skill groups by kind.
   * @example toSkillGroups("skills") // SkillGroup[]
   */
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

  const craftGroups: CraftGroup[] = (craftSettings?.groups ?? []).map((g) => ({
    title: g.title,
    intro: g.intro,
    items: g.items.map((item) => ({
      title: item.title,
      why: item.why,
    })),
  }));

  return parseContent({
    site: {
      name: site.name,
      initials: site.initials,
      title: site.title,
      description: site.description,
      heroTemplate: site.hero.template,
      heroMedia: {
        kind: site.hero.mediaKind,
        url: site.hero.mediaUrl,
        place: site.hero.mediaPlace,
        side: site.hero.mediaSide,
      },
      pianoYoutubeUrl: await decryptSecret(site.pianoYoutubeUrl),
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
      defaultMode: site.theme.defaultMode,
      allowToggle: site.theme.allowToggle,
      brandFrom: site.theme.brandFrom,
      brandTo: site.theme.brandTo,
      dark: asThemePalette(site.theme.dark, DEFAULT_THEME.dark),
      light: asThemePalette(site.theme.light, DEFAULT_THEME.light),
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
    craft: craftSettings
      ? {
          kicker: craftSettings.kicker,
          title: craftSettings.title,
          intro: craftSettings.intro,
          footnote: craftSettings.footnote,
          groups: craftGroups,
        }
      : EMPTY_CRAFT,
  });
}

const getCachedContent = unstable_cache(fetchContentFromDb, ["cms-content-v3"], {
  tags: [CMS_CONTENT_TAG],
  // Safety net if on-demand revalidation is missed; CMS save also revalidates the tag.
  revalidate: 3600,
});

/**
 * Loads cached CMS content (request-deduped).
 * @example await loadContent() // ContentData
 */
export const loadContent = cache(async (): Promise<ContentData> => getCachedContent());

const TX_OPTIONS = { maxWait: 15_000, timeout: 60_000 } as const;

/**
 * Persists ContentData in a Prisma transaction.
 * @example await saveContent(data) // void
 */
export async function saveContent(data: ContentData): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await persistContent(tx, data);
  }, TX_OPTIONS);
}
