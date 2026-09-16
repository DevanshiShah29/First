import { SKILL_ICONS, isSkillIcon, type SkillGroup, type SkillIcon, type SkillItem } from "@/content/types";
import {
  formatProfileContextForPrompt,
  gatherProfileContext,
  geminiPartsWithProfile,
} from "@/server/ai-profile-context";
import { callGeminiJson } from "@/server/ai/gemini";
import { normalizeHex, parseJsonObject, str, strList, strListNested } from "@/server/ai/strings";

const SOFT_ICONS = SKILL_ICONS.filter((icon) =>
  ["discovery", "prioritize", "specs", "map", "target", "empty"].includes(icon),
);

type GenerateBody = {
  siteTitle?: unknown;
  siteRoles?: unknown;
  experienceStacks?: unknown;
  experienceSummaries?: unknown;
  existingGroups?: unknown;
  linkedin?: unknown;
  resume?: unknown;
  /** Optional prior suggestion names to avoid on retry. */
  excludeNames?: unknown;
};

export type SkillSuggestion = {
  name: string;
  groupTitle: string;
  icon: SkillIcon;
  color?: string;
  isNewGroup: boolean;
};

export type GenerateSkillsInput = GenerateBody;

export type GenerateSkillsOutcome =
  | { ok: true; data: SkillSuggestion }
  | { ok: false; error: string; status: number };

/**
 * Maps a raw icon name/alias to a soft SkillIcon.
 * @example mapIcon("research") // "discovery"
 */
function mapIcon(raw: unknown): SkillIcon {
  if (typeof raw !== "string") return "empty";
  const key = raw.trim().toLowerCase();
  const aliases: Record<string, SkillIcon> = {
    research: "discovery",
    "user research": "discovery",
    prioritisation: "prioritize",
    prioritization: "prioritize",
    roadmap: "map",
    "opportunity mapping": "map",
    specification: "specs",
    "writing specs": "specs",
    outcomes: "target",
    "empty states": "empty",
  };
  if (aliases[key]) return aliases[key];
  if (isSkillIcon(key) && SOFT_ICONS.includes(key)) return key;
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
    const title = str(g.title, 80) || "Skills";
    const itemsRaw = Array.isArray(g.items) ? g.items : [];
    const items: SkillItem[] = itemsRaw.slice(0, 24).map((item) => {
      const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      return {
        name: str(row.name, 60) || "Skill",
        icon: mapIcon(row.icon),
        color: normalizeHex(row.color),
        iconUrl: str(row.iconUrl, 500) || undefined,
      };
    });
    return { title, items };
  });
}

/**
 * Parses Gemini JSON into a single skill suggestion.
 * @example parseGenerated(raw, groups) // SkillSuggestion | null
 */
function parseGenerated(raw: string, existingGroups: SkillGroup[]): SkillSuggestion | null {
  const obj = parseJsonObject(raw);
  if (!obj) return null;
  const name = str(obj.name, 60);
  if (!name) return null;
  let groupTitle = str(obj.groupTitle ?? obj.group, 80) || "Skills";
  const existingMatch = existingGroups.find(
    (g) => g.title.trim().toLowerCase() === groupTitle.trim().toLowerCase(),
  );
  if (existingMatch) groupTitle = existingMatch.title;
  const isNewGroup = !existingMatch;
  return {
    name,
    groupTitle,
    icon: mapIcon(obj.icon),
    color: normalizeHex(obj.color),
    isNewGroup,
  };
}

/**
 * Suggests one new skill to append (never replaces the list).
 * @example await generateSkills(key, body) // { ok: true, data } | { ok: false, … }
 */
export async function generateSkills(
  apiKey: string,
  body: GenerateSkillsInput,
): Promise<GenerateSkillsOutcome> {
  const siteTitle = str(body.siteTitle, 120);
  const siteRoles = strList(body.siteRoles, 8, 80);
  const experienceStacks = strListNested(body.experienceStacks);
  const experienceSummaries = strList(body.experienceSummaries, 12, 280);
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
    experienceSummaries.length === 0 &&
    existingNames.length === 0 &&
    !hasProfile
  ) {
    return {
      ok: false,
      error:
        "Add a LinkedIn URL, resume, experience copy, or skills draft before generating.",
      status: 400,
    };
  }

  const prompt = [
    "You suggest ONE new soft/product skill for a personal portfolio Skills section.",
    "Not programming languages. Sharp, concrete labels — not buzzword salad. No emojis.",
    "Sample skill names: Discovery, Prioritization, Writing specs, Opportunity mapping, Outcomes over output, Empty states.",
    "",
    "Return ONLY valid JSON with this shape:",
    '{"name":"Discovery","groupTitle":"Skills","icon":"discovery","color":"#BF70FF"}',
    "",
    "Rules:",
    "- Suggest exactly one skill that is NOT in the exclusion list (case-insensitive).",
    "- Prefer an existing group title when one fits; only invent a new groupTitle when needed.",
    `- icon MUST be one of: ${SOFT_ICONS.join(", ")}. Use "empty" when nothing fits.`,
    "- color: #RRGGBB.",
    "- Infer from resume, LinkedIn, and experience summaries/tags.",
    "- Do NOT list technologies like React/Node here.",
    "",
    `Site title / name: ${siteTitle || "(not set)"}`,
    siteRoles.length ? `Roles: ${siteRoles.join(", ")}` : "Roles: (not set)",
    experienceStacks.length
      ? `Experience stacks/tags: ${experienceStacks.join(", ")}`
      : "Experience stacks/tags: (empty)",
    experienceSummaries.length
      ? `Experience summaries:\n- ${experienceSummaries.join("\n- ")}`
      : "Experience summaries: (empty)",
    existingGroups.length
      ? `Existing skills:\n${existingGroups
          .map(
            (g) =>
              `- ${g.title}: ${g.items.map((i) => i.name).join(", ") || "(empty)"}`,
          )
          .join("\n")}`
      : "Existing skills: (empty)",
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
    0.7,
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
      error: "AI suggested a duplicate. Generate with AI again for another skill.",
      status: 502,
    };
  }

  return { ok: true, data: generated };
}
