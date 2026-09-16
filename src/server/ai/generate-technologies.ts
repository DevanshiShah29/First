import { SKILL_ICONS, isSkillIcon, type SkillGroup, type SkillIcon, type SkillItem } from "@/content/types";
import {
  formatProfileContextForPrompt,
  gatherProfileContext,
  geminiPartsWithProfile,
} from "@/server/ai-profile-context";
import { callGeminiJson } from "@/server/ai/gemini";
import { normalizeHex, parseJsonObject, str, strList, strListNested } from "@/server/ai/strings";

const TECH_ICONS = SKILL_ICONS.filter(
  (icon) =>
    !["discovery", "prioritize", "specs", "map", "target"].includes(icon),
);

type GenerateBody = {
  siteTitle?: unknown;
  siteRoles?: unknown;
  experienceStacks?: unknown;
  projectTags?: unknown;
  existingGroups?: unknown;
  linkedin?: unknown;
  resume?: unknown;
  /** Optional prior suggestion names to avoid on retry. */
  excludeNames?: unknown;
};

export type TechnologySuggestion = {
  name: string;
  groupTitle: string;
  icon: SkillIcon;
  color?: string;
  isNewGroup: boolean;
};

export type GenerateTechnologiesInput = GenerateBody;

export type GenerateTechnologiesOutcome =
  | { ok: true; data: TechnologySuggestion }
  | { ok: false; error: string; status: number };

/**
 * Maps a raw icon name/alias to a tech SkillIcon.
 * @example mapIcon("nextjs") // "next"
 */
function mapIcon(raw: unknown): SkillIcon {
  if (typeof raw !== "string") return "empty";
  const key = raw.trim().toLowerCase();
  const aliases: Record<string, SkillIcon> = {
    "next.js": "next",
    nextjs: "next",
    "react.js": "react",
    reactjs: "react",
    ts: "typescript",
    "tailwindcss": "tailwind",
    "tailwind css": "tailwind",
    css: "html",
    "html/css": "html",
    html5: "html",
    nodejs: "node",
    "node.js": "node",
    expressjs: "express",
    mongodb: "mongo",
    mongoose: "mongo",
    github: "git",
  };
  if (aliases[key]) return aliases[key];
  if (isSkillIcon(key)) return key;
  return "empty";
}

/**
 * Coerces request body groups into SkillGroup[].
 * @example parseExistingGroups(body.existingGroups) // [{ title, items }]
 */
function parseExistingGroups(v: unknown): SkillGroup[] {
  if (!Array.isArray(v)) return [];
  return v.slice(0, 8).map((group) => {
    const g = group && typeof group === "object" ? (group as Record<string, unknown>) : {};
    const title = str(g.title, 80) || "Technologies";
    const itemsRaw = Array.isArray(g.items) ? g.items : [];
    const items: SkillItem[] = itemsRaw.slice(0, 24).map((item) => {
      const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      return {
        name: str(row.name, 60) || "Technology",
        icon: mapIcon(row.icon),
        color: normalizeHex(row.color),
        iconUrl: str(row.iconUrl, 500) || undefined,
      };
    });
    return { title, items };
  });
}

/**
 * Parses Gemini JSON into a single technology suggestion.
 * @example parseGenerated(raw, groups) // TechnologySuggestion | null
 */
function parseGenerated(raw: string, existingGroups: SkillGroup[]): TechnologySuggestion | null {
  const obj = parseJsonObject(raw);
  if (!obj) return null;
  const name = str(obj.name, 60);
  if (!name) return null;
  let groupTitle = str(obj.groupTitle ?? obj.group, 80) || "Technologies";
  const existingMatch = existingGroups.find(
    (g) => g.title.trim().toLowerCase() === groupTitle.trim().toLowerCase(),
  );
  if (existingMatch) groupTitle = existingMatch.title;
  return {
    name,
    groupTitle,
    icon: mapIcon(obj.icon),
    color: normalizeHex(obj.color),
    isNewGroup: !existingMatch,
  };
}

/**
 * Suggests one new technology to append (never replaces the list).
 * @example await generateTechnologies(key, body) // { ok: true, data } | …
 */
export async function generateTechnologies(
  apiKey: string,
  body: GenerateTechnologiesInput,
): Promise<GenerateTechnologiesOutcome> {
  const siteTitle = str(body.siteTitle, 120);
  const siteRoles = strList(body.siteRoles, 8, 80);
  const experienceStacks = strListNested(body.experienceStacks);
  const projectTags = strListNested(body.projectTags);
  const existingGroups = parseExistingGroups(body.existingGroups);
  const existingNames = existingGroups.flatMap((g) => g.items.map((i) => i.name));
  const excludeNames = [
    ...new Set([...existingNames, ...strList(body.excludeNames, 40, 60)].map((n) => n.toLowerCase())),
  ];
  const linkedin = str(body.linkedin, 400);
  const resume = str(body.resume, 500);

  const profile = await gatherProfileContext({ linkedin, resume });
  const hasProfile = Boolean(profile.linkedin.url || profile.resume.url);

  if (
    experienceStacks.length === 0 &&
    projectTags.length === 0 &&
    existingNames.length === 0 &&
    !hasProfile
  ) {
    return {
      ok: false,
      error:
        "Add technologies draft, experience stacks, project tags, LinkedIn, or resume before generating.",
      status: 400,
    };
  }

  const prompt = [
    "You suggest ONE new technology/tool for a personal portfolio Technologies section.",
    "Prefer concrete tools/frameworks evidenced by the sources. No soft skills. No emojis.",
    "",
    "Return ONLY valid JSON with this shape:",
    '{"name":"Vue.js","groupTitle":"Frontend","icon":"empty","color":"#42B883"}',
    "",
    "Rules:",
    "- Suggest exactly one technology that is NOT in the exclusion list (case-insensitive).",
    "- Prefer an existing group title (Frontend/Backend/Tools/…) when one fits; invent a new groupTitle only when needed.",
    `- icon MUST be one of: ${TECH_ICONS.join(", ")}. Use "empty" when nothing fits.`,
    "- color: brand-ish #RRGGBB.",
    "- Do not invent exotic stacks with no signal in the sources.",
    "",
    `Site title / name: ${siteTitle || "(not set)"}`,
    siteRoles.length ? `Roles: ${siteRoles.join(", ")}` : "Roles: (not set)",
    experienceStacks.length
      ? `Experience stacks/tags: ${experienceStacks.join(", ")}`
      : "Experience stacks/tags: (empty)",
    projectTags.length ? `Project tags: ${projectTags.join(", ")}` : "Project tags: (empty)",
    existingGroups.length
      ? `Existing technologies:\n${existingGroups
          .map(
            (g) =>
              `- ${g.title}: ${g.items.map((i) => i.name).join(", ") || "(empty)"}`,
          )
          .join("\n")}`
      : "Existing technologies: (empty)",
    excludeNames.length
      ? `Do NOT suggest these names: ${excludeNames.join(", ")}`
      : "No exclusions yet.",
    "",
    "Profile context (LinkedIn + Resume):",
    formatProfileContextForPrompt(profile),
  ].join("\n");

  const gemini = await callGeminiJson(
    apiKey,
    geminiPartsWithProfile(prompt, profile),
    0.65,
  );
  if (!gemini.ok) return { ok: false, error: gemini.error, status: gemini.status };

  const generated = parseGenerated(gemini.text, existingGroups);
  if (!generated) {
    console.error("Could not parse Gemini JSON", gemini.text.slice(0, 500));
    return { ok: false, error: "Could not parse AI response. Try again.", status: 502 };
  }

  if (excludeNames.includes(generated.name.toLowerCase())) {
    return {
      ok: false,
      error: "AI suggested a duplicate. Generate with AI again for another technology.",
      status: 502,
    };
  }

  return { ok: true, data: generated };
}
