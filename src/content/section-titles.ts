import { displayFallback } from "./display-fallback";
import { asRecord, str } from "./parse-fields";

/** CMS keys for public page and section titles. Blank stays blank in the database. */
export const SECTION_TITLE_KEYS = [
  "about",
  "aboutNav",
  "experience",
  "projects",
  "skills",
  "skillsNav",
  "contact",
  "contactNav",
  "reading",
  "readingNow",
  "readingDone",
  "readingWant",
  "memories",
] as const;

export type SectionTitleKey = (typeof SECTION_TITLE_KEYS)[number];

export type SectionTitles = Record<SectionTitleKey, string>;

/** Stored when a title has never been set. Do not persist the visitor fallbacks. */
export const EMPTY_SECTION_TITLES: SectionTitles = {
  about: "",
  aboutNav: "",
  experience: "",
  projects: "",
  skills: "",
  skillsNav: "",
  contact: "",
  contactNav: "",
  reading: "",
  readingNow: "",
  readingDone: "",
  readingWant: "",
  memories: "",
};

/** Visitor wording for a blank title. Applied at render time only. */
export const SECTION_TITLE_FALLBACKS: SectionTitles = {
  about: "About Me",
  aboutNav: "About",
  experience: "Experience",
  projects: "Projects",
  skills: "Skills & Technologies",
  skillsNav: "Skills",
  contact: "Let's Work Together",
  contactNav: "Contact",
  reading: "Book Nook",
  readingNow: "Currently reading",
  readingDone: "Read",
  readingWant: "Want to read",
  memories: "Memories",
};

/**
 * Reads stored section titles. Missing or non-string keys stay empty.
 * @example parseSectionTitles({ about: "Hello" }) // about "Hello", rest ""
 */
export function parseSectionTitles(value: unknown): SectionTitles {
  const raw = asRecord(value);
  const next = { ...EMPTY_SECTION_TITLES };
  for (const key of SECTION_TITLE_KEYS) {
    next[key] = str(raw[key]).trim();
  }
  return next;
}

/**
 * Visitor label for one title. A blank CMS value uses the fallback and is not written back.
 * @example sectionTitle({ about: "" }, "about") // "About Me"
 */
export function sectionTitle(
  titles: Partial<SectionTitles> | null | undefined,
  key: SectionTitleKey,
): string {
  return displayFallback(titles?.[key] ?? "", SECTION_TITLE_FALLBACKS[key]);
}

/**
 * Returns a site copy with one title replaced. Other titles stay as stored.
 * @example setSectionTitle(site, "projects", "Selected work") // site
 */
export function setSectionTitle<T extends { titles?: SectionTitles }>(
  site: T,
  key: SectionTitleKey,
  value: string,
): T {
  return {
    ...site,
    titles: { ...EMPTY_SECTION_TITLES, ...site.titles, [key]: value },
  };
}
