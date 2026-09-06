import {
  formatProfileContextForPrompt,
  gatherProfileContext,
  geminiPartsWithProfile,
} from "@/server/ai-profile-context";
import { callGeminiJson } from "@/server/ai/gemini";
import { parseJsonObject, str, strList } from "@/server/ai/strings";

export type GenerateExperienceInput = {
  role?: unknown;
  company?: unknown;
  when?: unknown;
  current?: unknown;
  existingSummary?: unknown;
  existingBullets?: unknown;
  existingTags?: unknown;
  linkedin?: unknown;
  resume?: unknown;
};

export type GenerateExperienceResult = {
  summary: string;
  bullets: string[];
  tags: string[];
};

export type GenerateExperienceOutcome =
  | { ok: true; data: GenerateExperienceResult }
  | { ok: false; error: string; status: number };

function parseGenerated(raw: string): GenerateExperienceResult | null {
  const obj = parseJsonObject(raw);
  if (!obj) return null;
  const summary = str(obj.summary, 600);
  const bullets = strList(obj.bullets, 6, 280);
  const tags = strList(obj.tags ?? obj.stack, 10, 40);
  if (!summary || bullets.length === 0 || tags.length === 0) return null;
  return { summary, bullets, tags };
}

export async function generateExperience(
  apiKey: string,
  body: GenerateExperienceInput,
): Promise<GenerateExperienceOutcome> {
  const role = str(body.role, 120);
  const company = str(body.company, 120);
  const when = str(body.when, 80);
  const current = Boolean(body.current);
  const existingSummary = str(body.existingSummary, 600);
  const existingBullets = strList(body.existingBullets);
  const existingTags = strList(body.existingTags);
  const linkedin = str(body.linkedin, 400);
  const resume = str(body.resume, 500);

  if (!role && !company) {
    return { ok: false, error: "Enter a role or company before generating.", status: 400 };
  }

  const profile = await gatherProfileContext({ linkedin, resume });

  const prompt = [
    "You write portfolio experience copy for a product-minded engineer / product manager.",
    "Voice: sharp, concrete, first-person implied but no \"I\" spam; outcome-focused; no buzzword salad; no emojis.",
    "Match this sample tone:",
    '"Turned ambiguous founder briefs into shippable scope. Moved the room from “can we build it” to “should this exist, and for whom.”"',
    '"Ran discovery with users of half-built tools and wrote specs that include empty states and who a feature is not for."',
    "",
    "Given the role details below, return ONLY valid JSON with this shape:",
    '{"summary":"1-2 sentences","bullets":["...","...","..."],"tags":["Tag","Tag"]}',
    "",
    "Rules:",
    "- summary: 1–2 sentences, max ~280 chars, impact-focused.",
    "- bullets: 3–5 items, each one concrete action or outcome, max ~180 chars each.",
    "- tags: 4–8 short skill/domain labels (tools, methods, or product areas).",
    "- Prefer facts from the attached resume and LinkedIn profile that match this role/company.",
    "- Do not invent employer names or dates; use only what is provided in the role fields / resume / LinkedIn.",
    "- Ignore resume/LinkedIn jobs that clearly belong to a different company than the one being edited.",
    "- If existing draft fields are provided, improve/rewrite them — keep truth, sharpen language.",
    "",
    `Role: ${role || "(not set)"}`,
    `Company: ${company || "(not set)"}`,
    `When: ${when || "(not set)"}`,
    `Current role: ${current ? "yes" : "no"}`,
    existingSummary ? `Existing summary: ${existingSummary}` : "Existing summary: (empty)",
    existingBullets.length
      ? `Existing bullets:\n- ${existingBullets.join("\n- ")}`
      : "Existing bullets: (empty)",
    existingTags.length ? `Existing tags: ${existingTags.join(", ")}` : "Existing tags: (empty)",
    "",
    "Profile context (LinkedIn + Resume):",
    formatProfileContextForPrompt(profile),
  ].join("\n");

  const gemini = await callGeminiJson(apiKey, geminiPartsWithProfile(prompt, profile));
  if (!gemini.ok) return { ok: false, error: gemini.error, status: gemini.status };

  const generated = parseGenerated(gemini.text);
  if (!generated) {
    console.error("Could not parse Gemini JSON", gemini.text.slice(0, 500));
    return { ok: false, error: "Could not parse AI response. Try again.", status: 502 };
  }

  return { ok: true, data: generated };
}
