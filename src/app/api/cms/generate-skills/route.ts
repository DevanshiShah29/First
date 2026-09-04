import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SKILL_ICONS, isSkillIcon, type SkillGroup, type SkillIcon, type SkillItem } from "@/content/types";
import {
  formatProfileContextForPrompt,
  gatherProfileContext,
  geminiPartsWithProfile,
} from "@/lib/ai-profile-context";
import { verifySessionCookie } from "@/lib/cms-auth";

export const runtime = "nodejs";

const GEMINI_MODEL = "gemini-3.6-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

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

function str(v: unknown, max = 200): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function strList(v: unknown, maxItems = 40, maxLen = 80): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.trim().slice(0, maxLen))
    .filter(Boolean)
    .slice(0, maxItems);
}

function strListNested(v: unknown, maxLists = 20, maxItems = 16): string[] {
  if (!Array.isArray(v)) return [];
  const flat: string[] = [];
  for (const entry of v.slice(0, maxLists)) {
    if (typeof entry === "string") {
      const s = entry.trim().slice(0, 80);
      if (s) flat.push(s);
      continue;
    }
    if (Array.isArray(entry)) {
      for (const item of entry.slice(0, maxItems)) {
        if (typeof item === "string") {
          const s = item.trim().slice(0, 80);
          if (s) flat.push(s);
        }
      }
    }
  }
  return [...new Set(flat)].slice(0, 60);
}

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
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;
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

async function authed() {
  const token = (await cookies()).get("cms_session")?.value;
  return verifySessionCookie(token);
}

export async function POST(req: Request) {
  if (!(await authed())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  let body: GenerateBody;
  try {
    body = (await req.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

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
    return NextResponse.json(
      {
        error:
          "Add a LinkedIn URL, resume, experience copy, or skills draft before generating.",
      },
      { status: 400 },
    );
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

  let geminiRes: Response;
  try {
    geminiRes = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: geminiPartsWithProfile(prompt, profile) }],
        generationConfig: {
          temperature: 0.55,
          responseMimeType: "application/json",
        },
      }),
    });
  } catch (err) {
    console.error("Gemini request failed", err);
    return NextResponse.json({ error: "Could not reach Gemini." }, { status: 502 });
  }

  const geminiJson = (await geminiRes.json().catch(() => null)) as {
    error?: { message?: string };
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  } | null;

  if (!geminiRes.ok) {
    const message = geminiJson?.error?.message || `Gemini error (${geminiRes.status}).`;
    console.error("Gemini API error", geminiRes.status, message);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const text = geminiJson?.candidates?.[0]?.content?.parts
    ?.map((p) => p.text || "")
    .join("")
    .trim();

  if (!text) {
    return NextResponse.json({ error: "Gemini returned an empty response." }, { status: 502 });
  }

  const generated = parseGenerated(text);
  if (!generated) {
    console.error("Could not parse Gemini JSON", text.slice(0, 500));
    return NextResponse.json({ error: "Could not parse AI response. Try again." }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    groups: generated.groups,
  });
}
