import {
  formatProfileContextForPrompt,
  gatherProfileContext,
  geminiPartsWithProfile,
} from "@/server/ai-profile-context";
import { callGeminiJson } from "@/server/ai/gemini";
import { parseJsonObject, str, strList } from "@/server/ai/strings";

export type GenerateAboutInput = {
  about?: unknown;
  philosophyKicker?: unknown;
  philosophyTitle?: unknown;
  philosophy?: unknown;
  experienceIntro?: unknown;
  experienceSummaries?: unknown;
  linkedin?: unknown;
  resume?: unknown;
};

export type AboutCopyVariant = {
  about: string;
  philosophyKicker: string;
  philosophyTitle: string;
  philosophy: string;
  experienceIntro: string;
};

export type GenerateAboutResult = {
  variants: AboutCopyVariant[];
};

export type GenerateAboutOutcome =
  | { ok: true; data: GenerateAboutResult }
  | { ok: false; error: string; status: number };

/**
 * Parses Gemini JSON into 2–3 about copy packages.
 * @example parseGenerated(raw) // { variants } | null
 */
function parseGenerated(raw: string): GenerateAboutResult | null {
  const obj = parseJsonObject(raw);
  if (!obj) return null;
  const list = Array.isArray(obj.variants) ? obj.variants : null;
  if (!list || list.length < 2) return null;

  const variants: AboutCopyVariant[] = [];
  for (const entry of list.slice(0, 3)) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const about = str(row.about, 1200);
    const philosophyKicker = str(row.philosophyKicker, 80);
    const philosophyTitle = str(row.philosophyTitle, 120);
    const philosophy = str(row.philosophy, 800);
    const experienceIntro = str(row.experienceIntro, 500);
    if (!about && !philosophy) continue;
    variants.push({
      about: about || "…",
      philosophyKicker: philosophyKicker || "Philosophy",
      philosophyTitle: philosophyTitle || "How I work",
      philosophy: philosophy || about,
      experienceIntro: experienceIntro || "",
    });
  }

  if (variants.length < 2) return null;
  return { variants };
}

/**
 * Generates 2–3 About section packages from draft + profile signals.
 * @example await generateAbout(key, body) // { ok: true, data } | { ok: false, … }
 */
export async function generateAbout(
  apiKey: string,
  body: GenerateAboutInput,
): Promise<GenerateAboutOutcome> {
  const about = str(body.about, 1200);
  const philosophyKicker = str(body.philosophyKicker, 80);
  const philosophyTitle = str(body.philosophyTitle, 120);
  const philosophy = str(body.philosophy, 800);
  const experienceIntro = str(body.experienceIntro, 500);
  const experienceSummaries = strList(body.experienceSummaries, 12, 280);
  const linkedin = str(body.linkedin, 400);
  const resume = str(body.resume, 500);

  const profile = await gatherProfileContext({ linkedin, resume });
  const hasProfile = Boolean(profile.linkedin.url || profile.resume.url);
  const hasDraft = Boolean(about || philosophy || experienceIntro || philosophyTitle);

  if (!hasDraft && !hasProfile && experienceSummaries.length === 0) {
    return {
      ok: false,
      error: "Add About draft text, LinkedIn/resume, or experience summaries first.",
      status: 400,
    };
  }

  const prompt = [
    "You write the About section of a personal portfolio for a product-minded engineer / PM.",
    "Voice: sharp, concrete, warm, first-person; no buzzword salad; no emojis.",
    "Return ONLY valid JSON with this shape:",
    '{"variants":[{"about":"…","philosophyKicker":"…","philosophyTitle":"…","philosophy":"…","experienceIntro":"…"}]}',
    "",
    "Rules:",
    "- Return exactly 2 or 3 variants with different angles (e.g. craft-first, outcome-first, human-first).",
    "- about: 2–4 short paragraphs (use \\n\\n between paragraphs), max ~900 chars total.",
    "- philosophyKicker: short eyebrow (1–3 words).",
    "- philosophyTitle: short section title.",
    "- philosophy: 2–4 sentences on how you work / what you believe.",
    "- experienceIntro: 1–2 sentences introducing the experience list.",
    "- Prefer facts from the attached resume, LinkedIn, and experience summaries.",
    "- If a draft is provided, polish it — keep truth, sharpen language.",
    "- Do not invent employers, degrees, or years.",
    "",
    `Current about: ${about || "(empty)"}`,
    `Current philosophy kicker: ${philosophyKicker || "(empty)"}`,
    `Current philosophy title: ${philosophyTitle || "(empty)"}`,
    `Current philosophy: ${philosophy || "(empty)"}`,
    `Current experience intro: ${experienceIntro || "(empty)"}`,
    experienceSummaries.length
      ? `Experience summaries:\n- ${experienceSummaries.join("\n- ")}`
      : "Experience summaries: (empty)",
    "",
    "Profile context (LinkedIn + Resume):",
    formatProfileContextForPrompt(profile),
  ].join("\n");

  const gemini = await callGeminiJson(apiKey, geminiPartsWithProfile(prompt, profile), 0.8);
  if (!gemini.ok) return { ok: false, error: gemini.error, status: gemini.status };

  const generated = parseGenerated(gemini.text);
  if (!generated) {
    console.error("Could not parse Gemini JSON", gemini.text.slice(0, 500));
    return { ok: false, error: "Could not parse AI response. Try again.", status: 502 };
  }

  return { ok: true, data: generated };
}
