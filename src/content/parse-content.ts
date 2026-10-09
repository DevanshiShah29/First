import { publishStatusOf, type ContentData, type CraftContent, type MemoryItem } from "./types";
import { asRecord, str } from "./parse-fields";
import { parseExperience, parseProjects, parseSite, parseSkillGroups } from "./parse-site";
import { parseTheme } from "./parse-theme";
import { parseShelfArtifacts, parseShelfLayout } from "./parse-shelf";

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
        title: str(g.title).trim(),
        intro: str(g.intro),
        status: publishStatusOf(g.status),
        items: itemsRaw.map((item) => {
          const row = asRecord(item);
          return {
            title: str(row.title).trim(),
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
    skills: parseSkillGroups(root.skills),
    technologies: parseSkillGroups(root.technologies),
    theme: parseTheme(root.theme),
    memories: parseMemories(root.memories),
    craft: parseCraft(root.craft),
    shelfArtifacts: parseShelfArtifacts(root.shelfArtifacts),
    shelfLayout: parseShelfLayout(root.shelfLayout),
  };
}
