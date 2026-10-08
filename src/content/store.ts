import type { Prisma, PrismaClient } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { normalizeHex } from "@/lib/hex";
import { prisma } from "@/server/prisma";
import { parseContentForSave } from "@/content/validate";
import {
  replaceCraftGroups,
  replaceExperience,
  replaceMemories,
  replaceProjects,
  replaceShelfArtifacts,
  replaceSiteStats,
  replaceSkillGroups,
} from "@/content/persist-writes";
import { decryptSecret, encryptSecret } from "@/server/secrets-crypto";
import {
  DEFAULT_CONTACT_MEDIA,
  DEFAULT_HERO_MEDIA,
  DEFAULT_THEME,
  EMPTY_CRAFT,
  EMPTY_SHELF_LAYOUT,
  SHELF_SPACER_DEFAULT_REM,
  SHELF_SPACER_MAX_REM,
  SHELF_SPACER_MIN_REM,
  SHELF_STACK_MAX_BOOKS,
  createEmptyPlanks,
  emptyViewportLayout,
  isBookOrientation,
  isHeroTemplate,
  isSkillIcon,
  normalizeSections,
  publishStatusOf,
  type BookOrientation,
  type ContactMediaKind,
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
  type ShelfArtifactItem,
  type ShelfDecorPlacement,
  type ShelfLayout,
  type ShelfPlank,
  type ShelfPlankItem,
  type ShelfViewportLayout,
  type SiteContent,
  type SkillGroup,
  type SkillItem,
  type SavedTheme,
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
 * Parses contact card media JSON into ContactMedia.
 * @example parseContactMedia({kind:"image", url:"/a.jpg"}) // ContactMedia
 */
function parseContactMedia(value: unknown) {
  const row = asRecord(value);
  const kindRaw = str(row.kind, DEFAULT_CONTACT_MEDIA.kind);
  const kind: ContactMediaKind =
    kindRaw === "image" || kindRaw === "video" || kindRaw === "none" ? kindRaw : "none";
  return {
    kind,
    url: str(row.url),
    alt: str(row.alt),
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
    name: str(s.name),
    initials: str(s.initials).slice(0, 4),
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
    contactMedia: parseContactMedia(s.contactMedia),
    email: str(s.email),
    linkedin: str(s.linkedin),
    github: str(s.github),
    resume: str(s.resume),
    sections: normalizeSections(s.sections),
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
      status: publishStatusOf(row.status),
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
      status: publishStatusOf(row.status),
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
        status: publishStatusOf(row.status),
      };
    });
    return { title: str(g.title, defaultTitle), items, status: publishStatusOf(g.status) };
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
 * Parses saved theme library entries.
 * @example parseSavedThemes([{name:"Warm"}]) // SavedTheme[]
 */
function parseSavedThemes(value: unknown): SavedTheme[] {
  if (!Array.isArray(value)) return [];
  const themes: SavedTheme[] = [];
  for (let i = 0; i < value.length && themes.length < 40; i++) {
    const row = asRecord(value[i]);
    const name = str(row.name).trim();
    if (!name) continue;
    const now = new Date().toISOString();
    const description = str(row.description).slice(0, 200);
    const theme: SavedTheme = {
      id: str(row.id, `saved-${i + 1}`),
      name: name.slice(0, 80),
      brandFrom: normalizeHex(row.brandFrom, DEFAULT_THEME.brandFrom),
      brandTo: normalizeHex(row.brandTo, DEFAULT_THEME.brandTo),
      dark: parsePalette(row.dark, DEFAULT_THEME.dark),
      light: parsePalette(row.light, DEFAULT_THEME.light),
      createdAt: str(row.createdAt, now),
      updatedAt: str(row.updatedAt, now),
    };
    if (description) theme.description = description;
    themes.push(theme);
  }
  return themes;
}

/**
 * Parses theme settings JSON.
 * @example parseTheme({defaultMode:"system"}) // ThemeContent
 */
function parseTheme(value: unknown): ThemeContent {
  const row = asRecord(value);
  const activeRaw = row.activeThemeId;
  return {
    defaultMode: parseMode(row.defaultMode),
    allowToggle: bool(row.allowToggle, DEFAULT_THEME.allowToggle),
    brandFrom: normalizeHex(row.brandFrom, DEFAULT_THEME.brandFrom),
    brandTo: normalizeHex(row.brandTo, DEFAULT_THEME.brandTo),
    dark: parsePalette(row.dark, DEFAULT_THEME.dark),
    light: parsePalette(row.light, DEFAULT_THEME.light),
    activeThemeId:
      activeRaw === null || activeRaw === undefined || activeRaw === ""
        ? null
        : str(activeRaw),
    savedThemes: parseSavedThemes(row.savedThemes),
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
      status: publishStatusOf(row.status),
    };
  });
}

/**
 * Parses a positive rem size (no max — CMS may scale ornaments freely).
 * @example parsePositiveRem(9, 1.85) // 9
 */
function parsePositiveRem(value: unknown, fallback: number) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return n;
}

/**
 * Parses shelf artifact catalog JSON (placement lives in ShelfLayout).
 * @example parseShelfArtifacts([{name:"Plant"}]) // ShelfArtifactItem[]
 */
function parseShelfArtifacts(value: unknown): ShelfArtifactItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, i) => {
    const row = asRecord(item);
    return {
      id: str(row.id, `artifact-${i + 1}`),
      name: str(row.name, "Ornament"),
      imageUrl: str(row.imageUrl),
      widthRem: parsePositiveRem(row.widthRem, 1.85),
      heightRem: parsePositiveRem(row.heightRem, 5.4),
      enabled: row.enabled !== false,
    };
  });
}

/**
 * Parses an optional positive rem (null when missing/invalid).
 * @example parseOptionalPositiveRem(2.1) // 2.1
 */
function parseOptionalPositiveRem(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/**
 * Clamps spacer width into the allowed rem range.
 * @example clampSpacerWidth(3) // 3
 */
function clampSpacerWidth(value: unknown, fallback = SHELF_SPACER_DEFAULT_REM): number {
  const n = typeof value === "number" ? value : Number(value);
  const base = Number.isFinite(n) && n > 0 ? n : fallback;
  return (
    Math.round(
      Math.min(SHELF_SPACER_MAX_REM, Math.max(SHELF_SPACER_MIN_REM, base)) * 100,
    ) / 100
  );
}

/**
 * Parses free decor placement; skips invalid rows.
 * @example parseShelfDecor({artifactId:"a",xPercent:10,yPercent:20}, 0)
 */
function parseShelfDecor(value: unknown, index: number): ShelfDecorPlacement | null {
  const row = asRecord(value);
  const artifactId = str(row.artifactId);
  if (!artifactId) return null;
  const x = typeof row.xPercent === "number" ? row.xPercent : Number(row.xPercent);
  const y = typeof row.yPercent === "number" ? row.yPercent : Number(row.yPercent);
  const xRemRaw = typeof row.xRem === "number" ? row.xRem : Number(row.xRem);
  const xRem =
    Number.isFinite(xRemRaw) && xRemRaw >= 0 ? Math.min(120, xRemRaw) : null;
  return {
    id: str(row.id, `decor-${index + 1}`),
    artifactId,
    xPercent: Number.isFinite(x) ? Math.min(100, Math.max(0, x)) : 42,
    xRem,
    yPercent: Number.isFinite(y) ? Math.min(100, Math.max(0, y)) : 28,
    widthRem: parseOptionalPositiveRem(row.widthRem),
    heightRem: parseOptionalPositiveRem(row.heightRem),
  };
}

/**
 * Parses one plank item (book-stack or spacer). Inline decor is lifted to free layer.
 * @example parseShelfPlankItem({type:"book-stack",bookIds:["1"]}, 0)
 */
function parseShelfPlankItem(
  value: unknown,
  index: number,
): { item: ShelfPlankItem | null; liftedDecor: ShelfDecorPlacement | null } {
  const row = asRecord(value);
  const id = str(row.id, `item-${index + 1}`);
  const type = str(row.type);
  const orientationRaw = str(row.orientation, "vertical");
  const orientation: BookOrientation = isBookOrientation(orientationRaw)
    ? orientationRaw
    : "vertical";

  // Legacy inline plank decor → free decor layer.
  if (type === "decor") {
    const artifactId = str(row.artifactId);
    if (!artifactId) return { item: null, liftedDecor: null };
    return {
      item: null,
      liftedDecor: {
        id,
        artifactId,
        xPercent: 42,
        xRem: null,
        yPercent: 28,
        widthRem: parseOptionalPositiveRem(row.widthRem),
        heightRem: parseOptionalPositiveRem(row.heightRem),
      },
    };
  }

  if (type === "spacer") {
    return {
      item: { id, type: "spacer", widthRem: clampSpacerWidth(row.widthRem) },
      liftedDecor: null,
    };
  }

  if (type === "stack" || type === "book-stack" || Array.isArray(row.bookIds)) {
    const rawIds = Array.isArray(row.bookIds) ? row.bookIds : [];
    const bookIds = rawIds
      .map((idValue) => str(idValue))
      .filter(Boolean)
      .slice(0, SHELF_STACK_MAX_BOOKS);
    if (!bookIds.length) return { item: null, liftedDecor: null };
    return { item: { id, type: "book-stack", orientation, bookIds }, liftedDecor: null };
  }

  // Legacy single-book plank item → one-book stack.
  if (type === "book" || row.bookId) {
    const bookId = str(row.bookId);
    if (!bookId) return { item: null, liftedDecor: null };
    return {
      item: { id, type: "book-stack", orientation, bookIds: [bookId] },
      liftedDecor: null,
    };
  }

  return { item: null, liftedDecor: null };
}

/**
 * Dedupes book ids on planks and artifact ids on free decor.
 * @example dedupeViewportItems(view) // ShelfViewportLayout
 */
function dedupeViewportItems(view: ShelfViewportLayout): ShelfViewportLayout {
  const seenBooks = new Set<string>();
  const seenArtifacts = new Set<string>();
  return {
    planks: view.planks.map((plank) => ({
      ...plank,
      items: plank.items
        .map((item) => {
          if (item.type !== "book-stack") return item;
          const bookIds = item.bookIds.filter((bookId) => {
            if (seenBooks.has(bookId)) return false;
            seenBooks.add(bookId);
            return true;
          });
          return { ...item, bookIds };
        })
        .filter((item) => item.type !== "book-stack" || item.bookIds.length > 0),
    })),
    decor: view.decor.filter((entry) => {
      if (seenArtifacts.has(entry.artifactId)) return false;
      seenArtifacts.add(entry.artifactId);
      return true;
    }),
  };
}

/**
 * Parses a viewport layout (plank stacks/spacers + free decor).
 * @example parseViewportLayout({planks:[]}, 2) // ShelfViewportLayout
 */
function parseViewportLayout(value: unknown, fallbackPlankCount: number): ShelfViewportLayout {
  const root = asRecord(value);
  const planksRaw = Array.isArray(root.planks) ? root.planks : null;
  if (!planksRaw) return emptyViewportLayout(fallbackPlankCount);

  const liftedDecor: ShelfDecorPlacement[] = [];
  const planks: ShelfPlank[] = planksRaw.slice(0, 6).map((raw, i) => {
    const row = asRecord(raw);
    const itemsRaw = Array.isArray(row.items) ? row.items : [];
    const items: ShelfPlankItem[] = [];
    itemsRaw.forEach((item, j) => {
      const parsed = parseShelfPlankItem(item, j);
      if (parsed.item) items.push(parsed.item);
      if (parsed.liftedDecor) liftedDecor.push(parsed.liftedDecor);
    });
    return {
      id: str(row.id, `plank-${i + 1}`),
      items,
    };
  });

  const decorRaw = Array.isArray(root.decor) ? root.decor : [];
  const decor: ShelfDecorPlacement[] = [];
  const seenArtifacts = new Set<string>();
  decorRaw.forEach((item, i) => {
    const parsed = parseShelfDecor(item, i);
    if (!parsed || seenArtifacts.has(parsed.artifactId)) return;
    seenArtifacts.add(parsed.artifactId);
    decor.push(parsed);
  });
  for (const lifted of liftedDecor) {
    if (seenArtifacts.has(lifted.artifactId)) continue;
    seenArtifacts.add(lifted.artifactId);
    decor.push(lifted);
  }

  if (!planks.length) return emptyViewportLayout(fallbackPlankCount);
  return dedupeViewportItems({ planks, decor });
}

/**
 * Migrates legacy free-% book placements into ordered one-book stacks.
 * @example migrateLegacyViewport(placements, 2) // ShelfViewportLayout
 */
function migrateLegacyViewport(placements: unknown[], rowCount: number): ShelfViewportLayout {
  const planks = createEmptyPlanks(rowCount);
  type Legacy = { bookId: string; orientation: BookOrientation; xPercent: number; rowIndex: number };
  const placed: Legacy[] = [];

  placements.forEach((raw, index) => {
    const row = asRecord(raw);
    const bookId = str(row.bookId, `book-${index + 1}`);
    const x = typeof row.xPercent === "number" ? row.xPercent : Number(row.xPercent);
    const y = typeof row.yPercent === "number" ? row.yPercent : Number(row.yPercent);
    if (!bookId || !Number.isFinite(x) || !Number.isFinite(y)) return;
    const orientationRaw = str(row.orientation, "vertical");
    const orientation: BookOrientation = isBookOrientation(orientationRaw)
      ? orientationRaw
      : orientationRaw === "horizontal"
        ? "horizontal"
        : "vertical";
    const rowRaw = typeof row.rowIndex === "number" ? row.rowIndex : Number(row.rowIndex);
    const rowIndex = Number.isFinite(rowRaw)
      ? Math.min(planks.length - 1, Math.max(0, Math.trunc(rowRaw)))
      : 0;
    placed.push({ bookId, orientation, xPercent: x, rowIndex });
  });

  placed.sort((a, b) => a.rowIndex - b.rowIndex || a.xPercent - b.xPercent);
  const seen = new Set<string>();
  let seq = 0;
  for (const entry of placed) {
    if (seen.has(entry.bookId)) continue;
    seen.add(entry.bookId);
    const plank = planks[entry.rowIndex] ?? planks[planks.length - 1];
    if (!plank) continue;
    seq += 1;
    plank.items.push({
      id: `migrated-${seq}`,
      type: "book-stack",
      bookIds: [entry.bookId],
      orientation: entry.orientation,
    });
  }
  return { planks, decor: [] };
}
/**
 * Parses CMS shelf layout JSON (new plank shape or legacy free-% arrays).
 * @example parseShelfLayout({desktop:{planks:[]}}) // ShelfLayout
 */
function parseShelfLayout(value: unknown): ShelfLayout {
  if (!value || typeof value !== "object") {
    return {
      desktop: emptyViewportLayout(2),
      mobile: emptyViewportLayout(2),
    };
  }
  const root = asRecord(value);
  const rowRaw = typeof root.rowCount === "number" ? root.rowCount : Number(root.rowCount);
  const rowCount = Number.isFinite(rowRaw) ? Math.min(6, Math.max(1, Math.trunc(rowRaw))) : 2;

  const desktopRaw = root.desktop;
  const mobileRaw = root.mobile;

  const desktopIsNew =
    desktopRaw !== null &&
    typeof desktopRaw === "object" &&
    !Array.isArray(desktopRaw) &&
    Array.isArray(asRecord(desktopRaw).planks);
  const mobileIsNew =
    mobileRaw !== null &&
    typeof mobileRaw === "object" &&
    !Array.isArray(mobileRaw) &&
    Array.isArray(asRecord(mobileRaw).planks);

  if (desktopIsNew || mobileIsNew) {
    return {
      desktop: desktopIsNew
        ? parseViewportLayout(desktopRaw, rowCount)
        : emptyViewportLayout(rowCount),
      mobile: mobileIsNew
        ? parseViewportLayout(mobileRaw, rowCount)
        : emptyViewportLayout(rowCount),
    };
  }

  // Legacy: desktop/mobile were ShelfBookPlacement[].
  const desktopArr = Array.isArray(desktopRaw) ? desktopRaw : [];
  const mobileArr = Array.isArray(mobileRaw) ? mobileRaw : [];
  return {
    desktop: migrateLegacyViewport(desktopArr, rowCount),
    mobile: migrateLegacyViewport(mobileArr, rowCount),
  };
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
    status: publishStatusOf(root.status),
    groups: groupsRaw.map((group) => {
      const g = asRecord(group);
      const itemsRaw = Array.isArray(g.items) ? g.items : [];
      return {
        title: str(g.title, "Untitled group"),
        intro: str(g.intro),
        status: publishStatusOf(g.status),
        items: itemsRaw.map((item) => {
          const row = asRecord(item);
          return {
            title: str(row.title, "Untitled"),
            why: str(row.why),
            status: publishStatusOf(row.status),
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
    shelfArtifacts: parseShelfArtifacts(root.shelfArtifacts),
    shelfLayout: parseShelfLayout(root.shelfLayout),
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
    contactMediaKind: site.contactMedia?.kind ?? "none",
    contactMediaUrl: site.contactMedia?.url ?? "",
    contactMediaAlt: site.contactMedia?.alt ?? "",
    email: site.email,
    linkedin: site.linkedin,
    github: site.github,
    resume: site.resume,
    sections: normalizeSections(site.sections) as unknown as Prisma.InputJsonValue,
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
 * Coerces DB JSON palette into ThemePalette.
 * @example asThemePalette(row.dark, fallback) // ThemePalette
 */
function asThemePalette(value: unknown, fallback: ThemePalette): ThemePalette {
  return parsePalette(value, fallback);
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

const getCachedContent = unstable_cache(fetchContentFromDb, ["cms-content-v9"], {
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
