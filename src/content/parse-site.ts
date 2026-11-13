import {
  DEFAULT_CONTACT_MEDIA,
  DEFAULT_HERO_MEDIA,
  isHeroTemplate,
  isSkillIcon,
  normalizeSections,
  publishStatusOf,
  type ContactMediaKind,
  type ExperienceItem,
  type HeroMedia,
  type HeroMediaKind,
  type HeroMediaPlace,
  type HeroMediaSide,
  type ProjectItem,
  type SiteContent,
  type SkillGroup,
  type SkillItem,
} from "./types";
import { asRecord, bool, num, str, strList } from "./parse-fields";
import { parseCursor } from "./cursor";
import { parseSeasons } from "./seasons";
import { parseSectionTitles } from "./section-titles";

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
export function parseSite(value: unknown): SiteContent {
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
    titles: parseSectionTitles(s.titles),
    seasons: parseSeasons(s.seasons),
    cursor: parseCursor(s.cursor),
    stats: statsRaw.map((item) => {
      const row = asRecord(item);
      return {
        value: Math.max(0, Math.round(num(row.value))),
        suffix: str(row.suffix),
        label: str(row.label).trim(),
      };
    }),
  };
}

/**
 * Parses experience array JSON.
 * @example parseExperience([{role:"PM"}]) // ExperienceItem[]
 */
export function parseExperience(value: unknown): ExperienceItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, i) => {
    const row = asRecord(item);
    return {
      id: str(row.id, `exp-${i + 1}`),
      when: str(row.when),
      current: bool(row.current),
      role: str(row.role).trim(),
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
export function parseProjects(value: unknown): ProjectItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, i) => {
    const row = asRecord(item);
    return {
      id: str(row.id, `project-${i + 1}`),
      name: str(row.name).trim(),
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
 * Blank titles and names stay blank. The public page supplies a display label.
 * @example parseSkillGroups([{title:"Lang"}]) // SkillGroup[]
 */
export function parseSkillGroups(value: unknown): SkillGroup[] {
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
        name: str(row.name).trim(),
        icon: isSkillIcon(iconRaw) ? iconRaw : "empty",
        ...(color ? { color } : {}),
        ...(iconUrl ? { iconUrl } : {}),
        status: publishStatusOf(row.status),
      };
    });
    return { title: str(g.title).trim(), items, status: publishStatusOf(g.status) };
  });
}
