import type { Prisma, PrismaClient } from "@prisma/client";
import { encryptSecret } from "@/server/secrets-crypto";
import {
  replaceCraftGroups,
  replaceExperience,
  replaceMemories,
  replaceProjects,
  replaceShelfArtifacts,
  replaceSiteStats,
  replaceSkillGroups,
} from "@/content/persist-writes";
import {
  EMPTY_CRAFT,
  EMPTY_SHELF_LAYOUT,
  normalizeSections,
  publishStatusOf,
  type ContentData,
  type SiteContent,
  type ThemeContent,
} from "./types";
import { EMPTY_SECTION_TITLES } from "./section-titles";
import { SITE_ID } from "./cms-constants";

type DbClient = PrismaClient | Prisma.TransactionClient;

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
    contactMediaKind: site.contactMedia?.kind ?? "none",
    contactMediaUrl: site.contactMedia?.url ?? "",
    contactMediaAlt: site.contactMedia?.alt ?? "",
    email: site.email,
    linkedin: site.linkedin,
    github: site.github,
    resume: site.resume,
    sections: normalizeSections(site.sections) as unknown as Prisma.InputJsonValue,
    titles: (site.titles ?? EMPTY_SECTION_TITLES) as unknown as Prisma.InputJsonValue,
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
    activeThemeId: theme.activeThemeId ?? null,
    savedThemes: theme.savedThemes ?? [],
  };
}

/**
 * Stable JSON fingerprint for dirty-section checks during save.
 * @example fingerprint({a:1}) // '{"a":1}'
 */
function fingerprint(value: unknown): string {
  return JSON.stringify(value);
}

/**
 * Writes validated ContentData into normalized Prisma tables.
 * Skips wipe+rewrite for collections that match `previous` (same fingerprint).
 * @example await persistContent(tx, data, previous) // void
 */
export async function persistContent(
  db: DbClient,
  data: ContentData,
  previous?: ContentData | null,
): Promise<void> {
  const siteFields = await siteCoreData(data.site);
  const heroFields = heroSettingsData(data.site);
  const themeFields = themeSettingsData(data.theme);
  const craft = data.craft ?? EMPTY_CRAFT;
  const prevCraft = previous?.craft ?? EMPTY_CRAFT;

  const siteCoreChanged =
    !previous ||
    fingerprint({
      name: data.site.name,
      initials: data.site.initials,
      title: data.site.title,
      description: data.site.description,
      pianoYoutubeUrl: data.site.pianoYoutubeUrl,
      goodreadsUrl: data.site.goodreadsUrl,
      kicker: data.site.kicker,
      greeting: data.site.greeting,
      roles: data.site.roles,
      line: data.site.line,
      about: data.site.about,
      philosophyKicker: data.site.philosophyKicker,
      philosophyTitle: data.site.philosophyTitle,
      philosophy: data.site.philosophy,
      experienceIntro: data.site.experienceIntro,
      contactLine: data.site.contactLine,
      contactMediaKind: data.site.contactMedia.kind,
      contactMediaUrl: data.site.contactMedia.url,
      contactMediaAlt: data.site.contactMedia.alt,
      email: data.site.email,
      linkedin: data.site.linkedin,
      github: data.site.github,
      resume: data.site.resume,
      sections: normalizeSections(data.site.sections),
      titles: data.site.titles ?? EMPTY_SECTION_TITLES,
    }) !==
      fingerprint({
        name: previous.site.name,
        initials: previous.site.initials,
        title: previous.site.title,
        description: previous.site.description,
        pianoYoutubeUrl: previous.site.pianoYoutubeUrl,
        goodreadsUrl: previous.site.goodreadsUrl,
        kicker: previous.site.kicker,
        greeting: previous.site.greeting,
        roles: previous.site.roles,
        line: previous.site.line,
        about: previous.site.about,
        philosophyKicker: previous.site.philosophyKicker,
        philosophyTitle: previous.site.philosophyTitle,
        philosophy: previous.site.philosophy,
        experienceIntro: previous.site.experienceIntro,
        contactLine: previous.site.contactLine,
        contactMediaKind: previous.site.contactMedia.kind,
        contactMediaUrl: previous.site.contactMedia.url,
        contactMediaAlt: previous.site.contactMedia.alt,
        email: previous.site.email,
        linkedin: previous.site.linkedin,
        github: previous.site.github,
        resume: previous.site.resume,
        sections: normalizeSections(previous.site.sections),
        titles: previous.site.titles ?? EMPTY_SECTION_TITLES,
      });

  const heroChanged =
    !previous ||
    fingerprint(heroSettingsData(data.site)) !== fingerprint(heroSettingsData(previous.site));
  const themeChanged =
    !previous || fingerprint(themeSettingsData(data.theme)) !== fingerprint(themeSettingsData(previous.theme));
  const statsChanged =
    !previous || fingerprint(data.site.stats) !== fingerprint(previous.site.stats);
  const experienceChanged =
    !previous || fingerprint(data.experience) !== fingerprint(previous.experience);
  const projectsChanged =
    !previous || fingerprint(data.projects) !== fingerprint(previous.projects);
  const memoriesChanged =
    !previous || fingerprint(data.memories ?? []) !== fingerprint(previous.memories ?? []);
  const shelfArtifactsChanged =
    !previous ||
    fingerprint(data.shelfArtifacts ?? []) !== fingerprint(previous.shelfArtifacts ?? []);
  const shelfLayoutChanged =
    !previous ||
    fingerprint(data.shelfLayout ?? EMPTY_SHELF_LAYOUT) !==
      fingerprint(previous.shelfLayout ?? EMPTY_SHELF_LAYOUT);
  const skillsChanged =
    !previous ||
    fingerprint(data.skills) !== fingerprint(previous.skills) ||
    fingerprint(data.technologies ?? []) !== fingerprint(previous.technologies ?? []);
  const craftPageChanged =
    !previous ||
    fingerprint({
      kicker: craft.kicker,
      title: craft.title,
      intro: craft.intro,
      footnote: craft.footnote,
      status: publishStatusOf(craft.status),
    }) !==
      fingerprint({
        kicker: prevCraft.kicker,
        title: prevCraft.title,
        intro: prevCraft.intro,
        footnote: prevCraft.footnote,
        status: publishStatusOf(prevCraft.status),
      });
  const craftGroupsChanged =
    !previous || fingerprint(craft.groups) !== fingerprint(prevCraft.groups);

  // Sequential on purpose. Promise.all on the direct Neon connection opens one
  // connection per query, and each new connection costs seconds from here.
  const craftSettingsData = {
    kicker: craft.kicker,
    title: craft.title,
    intro: craft.intro,
    footnote: craft.footnote,
    status: publishStatusOf(craft.status),
  };
  // Existing rows use UPDATE (one statement). Upsert adds a read before and after.
  if (siteCoreChanged) {
    if (previous) await db.siteSettings.update({ where: { id: SITE_ID }, data: siteFields });
    else {
      await db.siteSettings.upsert({
        where: { id: SITE_ID },
        create: { id: SITE_ID, ...siteFields },
        update: siteFields,
      });
    }
  }
  if (heroChanged) {
    if (previous) await db.heroSettings.update({ where: { siteId: SITE_ID }, data: heroFields });
    else {
      await db.heroSettings.upsert({
        where: { siteId: SITE_ID },
        create: { site: { connect: { id: SITE_ID } }, ...heroFields },
        update: heroFields,
      });
    }
  }
  if (themeChanged) {
    if (previous) await db.themeSettings.update({ where: { siteId: SITE_ID }, data: themeFields });
    else {
      await db.themeSettings.upsert({
        where: { siteId: SITE_ID },
        create: { site: { connect: { id: SITE_ID } }, ...themeFields },
        update: themeFields,
      });
    }
  }
  if (craftPageChanged || (craftGroupsChanged && !previous)) {
    if (previous) await db.craftSettings.update({ where: { id: SITE_ID }, data: craftSettingsData });
    else {
      await db.craftSettings.upsert({
        where: { id: SITE_ID },
        create: { id: SITE_ID, ...craftSettingsData },
        update: craftSettingsData,
      });
    }
  }

  if (statsChanged) await replaceSiteStats(db, data.site.stats);
  if (experienceChanged) await replaceExperience(db, data.experience);
  if (projectsChanged) await replaceProjects(db, data.projects);
  if (memoriesChanged) await replaceMemories(db, data.memories ?? []);
  if (shelfArtifactsChanged) await replaceShelfArtifacts(db, data.shelfArtifacts ?? []);
  if (shelfLayoutChanged) {
    const layout = data.shelfLayout ?? EMPTY_SHELF_LAYOUT;
    const rowCount = Math.max(layout.desktop.planks.length, layout.mobile.planks.length, 1);
    const layoutData = {
      rowCount,
      desktop: layout.desktop as unknown as Prisma.InputJsonValue,
      mobile: layout.mobile as unknown as Prisma.InputJsonValue,
    };
    if (previous) await db.shelfLayout.update({ where: { id: SITE_ID }, data: layoutData });
    else {
      await db.shelfLayout.upsert({
        where: { id: SITE_ID },
        create: { id: SITE_ID, ...layoutData },
        update: layoutData,
      });
    }
  }
  if (skillsChanged) await replaceSkillGroups(db, data.skills, data.technologies ?? []);
  if (craftGroupsChanged) await replaceCraftGroups(db, craft.groups);
}
