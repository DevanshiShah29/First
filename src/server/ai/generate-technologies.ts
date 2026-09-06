import { SKILL_ICONS, isSkillIcon, type SkillGroup, type SkillIcon, type SkillItem } from "@/content/types";
import {
  formatProfileContextForPrompt,
  gatherProfileContext,
  geminiPartsWithProfile,
} from "@/server/ai-profile-context";
import { callGeminiJson } from "@/server/ai/gemini";
import { parseJsonObject, str, strList, strListNested } from "@/server/ai/strings";

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
};

type GeneratedFields = {
  groups: SkillGroup[];
};

/**
 * Normalizes a hex color to #RRGGBB or undefined.
 * @example normalizeHex("#abc") // "#AABBCC"
 */
function normalizeHex(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const value = raw.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value.toUpperCase();
  const short = value.match(/^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/);
  if (short) {
    const [, a, b, c] = short;
    return `#${a}${a}${b}${b}${c}${c}`.toUpperCase();
  }
  return undefined;
}

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
 * Parses Gemini JSON into technology groups.
 * @example parseGenerated(raw) // { groups } | null
 */
function parseGenerated(raw: string): GeneratedFields | null {
  const obj = parseJsonObject(raw);
  if (!obj) return null;
  const groupsRaw = Array.isArray(obj.groups) ? obj.groups : Array.isArray(obj.technologies) ? obj.technologies : null;
  if (!groupsRaw || groupsRaw.length === 0) return null;

  const groups: SkillGroup[] = [];
  for (const group of groupsRaw.slice(0, 4)) {
    if (!group || typeof group !== "object") continue;
    const g = group as Record<string, unknown>;
    const title = str(g.title, 80);
    const itemsRaw = Array.isArray(g.items) ? g.items : [];
    const items: SkillItem[] = [];
    for (const item of itemsRaw.slice(0, 16)) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const name = str(row.name, 60);
      if (!name) continue;
      items.push({
        name,
        icon: mapIcon(row.icon),
        color: normalizeHex(row.color),
      });
    }
    if (!title || items.length === 0) continue;
    groups.push({ title, items });
  }

  if (groups.length === 0) return null;
  return { groups };
}

export type GenerateTechnologiesInput = GenerateBody;

export type GenerateTechnologiesOutcome =
  | { ok: true; data: GeneratedFields }
  | { ok: false; error: string; status: number };

/**
 * Generates technology groups via Gemini + profile.
 * @example await generateTechnologies(key, body) // { ok: true, data } | { ok: false, … }
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
    "You curate the Technologies section of a personal portfolio CMS.",
    "Return realistic tools/frameworks the person actually uses, inferred from resume, LinkedIn, experience stacks, and project tags.",
    "Prefer concrete tech names over soft skills. No buzzword fluff. No emojis.",
    "",
    "Return ONLY valid JSON with this shape:",
    '{"groups":[{"title":"Frontend","items":[{"name":"React","icon":"react","color":"#61DAFB"}]}]}',
    "",
    "Rules:",
    "- 1–3 groups max (e.g. Frontend, Backend, Tools) OR a single group titled Technologies.",
    "- 6–14 total items across all groups. Deduplicate. Prefer quality over quantity.",
    "- Each item needs name, icon, and color (#RRGGBB brand-ish hex).",
    `- icon MUST be one of: ${TECH_ICONS.join(", ")}. Use "empty" when nothing fits.`,
    "- Prefer technologies evidenced by the resume PDF, LinkedIn profile, experience stacks, and project tags.",
    "- You may include closely related staples (e.g. TypeScript with React) sparingly.",
    "- If an existing draft is provided, improve/reorganize it — keep truth, drop weak entries, sharpen grouping.",
    "- Do not invent exotic stacks with no signal in the sources.",
    "",
    `Site title / name: ${siteTitle || "(not set)"}`,
    siteRoles.length ? `Roles: ${siteRoles.join(", ")}` : "Roles: (not set)",
    experienceStacks.length
      ? `Experience stacks/tags: ${experienceStacks.join(", ")}`
      : "Experience stacks/tags: (empty)",
    projectTags.length ? `Project tags: ${projectTags.join(", ")}` : "Project tags: (empty)",
    existingGroups.length
      ? `Existing technologies draft:\n${existingGroups
          .map(
            (g) =>
              `- ${g.title}: ${g.items.map((i) => `${i.name}${i.icon ? ` [${i.icon}]` : ""}`).join(", ") || "(empty)"}`,
          )
          .join("\n")}`
      : "Existing technologies draft: (empty)",
    "",
    "Profile context (LinkedIn + Resume):",
    formatProfileContextForPrompt(profile),
  ].join("\n");

  const gemini = await callGeminiJson(
    apiKey,
    geminiPartsWithProfile(prompt, profile),
    0.5,
  );
  if (!gemini.ok) return { ok: false, error: gemini.error, status: gemini.status };

  const generated = parseGenerated(gemini.text);
  if (!generated) {
    console.error("Could not parse Gemini JSON", gemini.text.slice(0, 500));
    return { ok: false, error: "Could not parse AI response. Try again.", status: 502 };
  }

  return { ok: true, data: generated };
}
