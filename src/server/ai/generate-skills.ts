import { SKILL_ICONS, isSkillIcon, type SkillGroup, type SkillIcon, type SkillItem } from "@/content/types";
import {
  formatProfileContextForPrompt,
  gatherProfileContext,
  geminiPartsWithProfile,
} from "@/server/ai-profile-context";
import { callGeminiJson } from "@/server/ai/gemini";
import { parseJsonObject, str, strList, strListNested } from "@/server/ai/strings";

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
};

type GeneratedFields = {
  groups: SkillGroup[];
};

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

function parseGenerated(raw: string): GeneratedFields | null {
  const obj = parseJsonObject(raw);
  if (!obj) return null;
  const groupsRaw = Array.isArray(obj.groups) ? obj.groups : Array.isArray(obj.skills) ? obj.skills : null;
  if (!groupsRaw || groupsRaw.length === 0) return null;

  const groups: SkillGroup[] = [];
  for (const group of groupsRaw.slice(0, 3)) {
    if (!group || typeof group !== "object") continue;
    const g = group as Record<string, unknown>;
    const title = str(g.title, 80);
    const itemsRaw = Array.isArray(g.items) ? g.items : [];
    const items: SkillItem[] = [];
    for (const item of itemsRaw.slice(0, 12)) {
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

export type GenerateSkillsInput = GenerateBody;

export type GenerateSkillsOutcome =
  | { ok: true; data: GeneratedFields }
  | { ok: false; error: string; status: number };

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
    "You curate the Skills section of a personal portfolio CMS for a product-minded engineer / PM.",
    "Return craft/product skills (not programming languages). Sharp, concrete labels — not buzzword salad. No emojis.",
    "Match this sample tone of skill names:",
    '"Discovery", "Prioritization", "Writing specs", "Opportunity mapping", "Outcomes over output", "Empty states"',
    "",
    "Return ONLY valid JSON with this shape:",
    '{"groups":[{"title":"Skills","items":[{"name":"Discovery","icon":"discovery","color":"#BF70FF"}]}]}',
    "",
    "Rules:",
    "- Prefer a single group titled Skills (or 1–2 groups max).",
    "- 5–8 total items. Deduplicate. Prefer quality over quantity.",
    "- Each item needs name, icon, and color (#RRGGBB).",
    `- icon MUST be one of: ${SOFT_ICONS.join(", ")}. Use "empty" when nothing fits.`,
    "- Infer skills from resume, LinkedIn, and experience summaries/tags — product judgment, discovery, specs, prioritization, systems thinking, etc.",
    "- Do NOT list technologies like React/Node here; those belong in Technologies.",
    "- If an existing draft is provided, improve/reorganize it — keep truth, drop weak entries.",
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
      ? `Existing skills draft:\n${existingGroups
          .map(
            (g) =>
              `- ${g.title}: ${g.items.map((i) => `${i.name}${i.icon ? ` [${i.icon}]` : ""}`).join(", ") || "(empty)"}`,
          )
          .join("\n")}`
      : "Existing skills draft: (empty)",
    "",
    "Profile context (LinkedIn + Resume):",
    formatProfileContextForPrompt(profile),
  ].join("\n");

  const gemini = await callGeminiJson(
    apiKey,
    geminiPartsWithProfile(prompt, profile),
    0.55,
  );
  if (!gemini.ok) return { ok: false, error: gemini.error, status: gemini.status };

  const generated = parseGenerated(gemini.text);
  if (!generated) {
    console.error("Could not parse Gemini JSON", gemini.text.slice(0, 500));
    return { ok: false, error: "Could not parse AI response. Try again.", status: 502 };
  }

  return { ok: true, data: generated };
}
