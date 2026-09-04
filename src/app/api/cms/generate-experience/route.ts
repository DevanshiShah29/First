import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  formatProfileContextForPrompt,
  gatherProfileContext,
  geminiPartsWithProfile,
} from "@/lib/ai-profile-context";
import { verifySessionCookie } from "@/lib/cms-auth";

export const runtime = "nodejs";

const GEMINI_MODEL = "gemini-3.6-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

type GenerateBody = {
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

type GeneratedFields = {
  summary: string;
  bullets: string[];
  tags: string[];
};

function str(v: unknown, max = 200): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function strList(v: unknown, maxItems = 12, maxLen = 200): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.trim().slice(0, maxLen))
    .filter(Boolean)
    .slice(0, maxItems);
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
  const summary = str(obj.summary, 600);
  const bullets = strList(obj.bullets, 6, 280);
  const tags = strList(obj.tags ?? obj.stack, 10, 40);
  if (!summary || bullets.length === 0 || tags.length === 0) return null;
  return { summary, bullets, tags };
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
    return NextResponse.json(
      { error: "Enter a role or company before generating." },
      { status: 400 },
    );
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

  let geminiRes: Response;
  try {
    geminiRes = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: geminiPartsWithProfile(prompt, profile) }],
        generationConfig: {
          temperature: 0.7,
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
    summary: generated.summary,
    bullets: generated.bullets,
    tags: generated.tags,
  });
}
