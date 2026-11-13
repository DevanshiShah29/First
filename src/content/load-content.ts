import { unstable_cache } from "next/cache";
import { cache } from "react";
import { prisma } from "@/server/prisma";
import { parseContentForSave } from "@/content/validate";
import { decryptSecret } from "@/server/secrets-crypto";
import {
  DEFAULT_THEME,
  EMPTY_CRAFT,
  EMPTY_SHELF_LAYOUT,
  isSkillIcon,
  publishStatusOf,
  type ContentData,
  type CraftGroup,
  type SkillGroup,
} from "./types";
import { CMS_CONTENT_TAG, SITE_ID } from "./cms-constants";
import { parseContent } from "./parse-content";
import { parseShelfLayout } from "./parse-shelf";
import { asThemePalette, parseSavedThemes } from "./parse-theme";
import { persistContent } from "./persist-content";

/**
 * Loads the full CMS document from Prisma and coerces it.
 * @example await fetchContentFromDb() // ContentData
 */
async function fetchContentFromDb(): Promise<ContentData> {
  const [site, experience, projects, memories, shelfArtifacts, shelfLayoutRow, skillGroups, craftSettings] =
    await Promise.all([
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
    prisma.shelfArtifact
      ? prisma.shelfArtifact.findMany({ orderBy: { sortOrder: "asc" } })
      : Promise.resolve([]),
    prisma.shelfLayout
      ? prisma.shelfLayout.findUnique({ where: { id: SITE_ID } })
      : Promise.resolve(null),
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
        status: publishStatusOf(g.status),
        items: g.items.map((item) => ({
          name: item.name,
          icon: isSkillIcon(item.icon) ? item.icon : "empty",
          ...(item.color ? { color: item.color } : {}),
          ...(item.iconUrl ? { iconUrl: item.iconUrl } : {}),
          status: publishStatusOf(item.status),
        })),
      }));

  const craftGroups: CraftGroup[] = (craftSettings?.groups ?? []).map((g) => ({
    title: g.title,
    intro: g.intro,
    status: publishStatusOf(g.status),
    items: g.items.map((item) => ({
      title: item.title,
      why: item.why,
      status: publishStatusOf(item.status),
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
      contactMedia: {
        kind: site.contactMediaKind,
        url: site.contactMediaUrl,
        alt: site.contactMediaAlt,
      },
      email: site.email,
      linkedin: site.linkedin,
      github: site.github,
      resume: site.resume,
      sections: site.sections,
      titles: site.titles,
      seasons: site.seasons,
      cursor: site.cursor,
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
      status: publishStatusOf(item.status),
    })),
    projects: projects.map((item) => ({
      id: item.id,
      name: item.name,
      blurb: item.blurb,
      tags: item.tags,
      github: item.github,
      demo: item.demo,
      status: publishStatusOf(item.status),
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
      activeThemeId: site.theme.activeThemeId ?? null,
      savedThemes: parseSavedThemes(site.theme.savedThemes),
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
      status: publishStatusOf(item.status),
    })),
    craft: craftSettings
      ? {
          kicker: craftSettings.kicker,
          title: craftSettings.title,
          intro: craftSettings.intro,
          footnote: craftSettings.footnote,
          status: publishStatusOf(craftSettings.status),
          groups: craftGroups,
        }
      : EMPTY_CRAFT,
    shelfArtifacts: shelfArtifacts.map((item) => ({
      id: item.id,
      name: item.name,
      imageUrl: item.imageUrl,
      widthRem: item.widthRem,
      heightRem: item.heightRem,
      enabled: item.enabled,
    })),
    shelfLayout: shelfLayoutRow
      ? parseShelfLayout({
          rowCount: shelfLayoutRow.rowCount,
          desktop: shelfLayoutRow.desktop,
          mobile: shelfLayoutRow.mobile,
        })
      : EMPTY_SHELF_LAYOUT,
  });
}

const getCachedContent = unstable_cache(fetchContentFromDb, ["cms-content-v11"], {
  tags: [CMS_CONTENT_TAG],
  // Fallback if a save misses tag expiration. Saves pass revalidateTag(..., { expire: 0 }).
  revalidate: 3600,
});

/** Last document written by this process. Avoids an 8-query reread on the next save. */
let savedSnapshot: ContentData | null = null;

/**
 * Loads cached CMS content (request-deduped).
 * After a save in this process, returns that document instead of hitting Neon again.
 * @example await loadContent() // ContentData
 */
export const loadContent = cache(async (): Promise<ContentData> => {
  if (savedSnapshot) return structuredClone(savedSnapshot);
  return getCachedContent();
});

/**
 * Baseline for a diff. Prefers the in-process snapshot, then the warm CMS cache.
 * Both are normalized the same way as the save payload so unchanged sections match.
 * @example await baselineForSave() // ContentData | null
 */
async function baselineForSave(): Promise<ContentData | null> {
  const raw = savedSnapshot ?? (await getCachedContent());
  const parsed = parseContentForSave(raw);
  return parsed.ok ? parsed.content : raw;
}

/**
 * Persists ContentData. Unchanged sections are skipped.
 * Writes run on one connection, without a wrapping interactive transaction.
 * @example await saveContent(data) // void
 */
export async function saveContent(data: ContentData): Promise<void> {
  const previous = await baselineForSave();
  await persistContent(prisma, data, previous);
  savedSnapshot = structuredClone(data);
}
