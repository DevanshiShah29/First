import { callGeminiJson } from "@/server/ai/gemini";
import { parseJsonObject, str, strList } from "@/server/ai/strings";

export type GenerateCraftPageInput = {
  kicker?: unknown;
  title?: unknown;
  intro?: unknown;
  footnote?: unknown;
  siteName?: unknown;
  siteRoles?: unknown;
  about?: unknown;
};

export type CraftPageVariant = {
  kicker: string;
  title: string;
  intro: string;
  footnote: string;
};

export type GenerateCraftPageResult = {
  variants: CraftPageVariant[];
};

export type CraftGroupItemDraft = {
  title?: unknown;
  why?: unknown;
};

export type GenerateCraftGroupInput = {
  groupTitle?: unknown;
  groupIntro?: unknown;
  items?: unknown;
  siteName?: unknown;
  siteRoles?: unknown;
  about?: unknown;
};

export type CraftGroupVariant = {
  intro: string;
  items: { title: string; why: string }[];
};

export type GenerateCraftGroupResult = {
  variants: CraftGroupVariant[];
};

type Outcome<T> = { ok: true; data: T } | { ok: false; error: string; status: number };

/**
 * Parses Gemini JSON into craft page copy variants.
 * @example parsePageGenerated(raw) // { variants } | null
 */
function parsePageGenerated(raw: string): GenerateCraftPageResult | null {
  const obj = parseJsonObject(raw);
  if (!obj) return null;
  const list = Array.isArray(obj.variants) ? obj.variants : null;
  if (!list || list.length < 2) return null;

  const variants: CraftPageVariant[] = [];
  for (const entry of list.slice(0, 3)) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const kicker = str(row.kicker, 80);
    const title = str(row.title, 120);
    const intro = str(row.intro, 800);
    const footnote = str(row.footnote, 400);
    if (!title && !intro) continue;
    variants.push({
      kicker: kicker || "Engineering",
      title: title || "Notes on craft",
      intro: intro || "",
      footnote: footnote || "",
    });
  }

  if (variants.length < 2) return null;
  return { variants };
}

/**
 * Parses Gemini JSON into craft group variants.
 * @example parseGroupGenerated(raw) // { variants } | null
 */
function parseGroupGenerated(raw: string): GenerateCraftGroupResult | null {
  const obj = parseJsonObject(raw);
  if (!obj) return null;
  const list = Array.isArray(obj.variants) ? obj.variants : null;
  if (!list || list.length < 2) return null;

  const variants: CraftGroupVariant[] = [];
  for (const entry of list.slice(0, 3)) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const intro = str(row.intro, 400);
    const itemsRaw = Array.isArray(row.items) ? row.items : [];
    const items: { title: string; why: string }[] = [];
    for (const item of itemsRaw.slice(0, 10)) {
      if (!item || typeof item !== "object") continue;
      const it = item as Record<string, unknown>;
      const title = str(it.title, 120);
      const why = str(it.why, 400);
      if (!title) continue;
      items.push({ title, why: why || title });
    }
    if (items.length === 0 && !intro) continue;
    variants.push({
      intro: intro || "",
      items: items.length
        ? items
        : [{ title: "A practice", why: "Why it matters — fill in after." }],
    });
  }

  if (variants.length < 2) return null;
  return { variants };
}

/**
 * Generates 2–3 craft page copy packages.
 * @example await generateCraftPage(key, body) // { ok: true, data } | …
 */
export async function generateCraftPage(
  apiKey: string,
  body: GenerateCraftPageInput,
): Promise<Outcome<GenerateCraftPageResult>> {
  const kicker = str(body.kicker, 80);
  const title = str(body.title, 120);
  const intro = str(body.intro, 800);
  const footnote = str(body.footnote, 400);
  const siteName = str(body.siteName, 80);
  const siteRoles = strList(body.siteRoles, 8, 60);
  const about = str(body.about, 600);

  if (!kicker && !title && !intro && !footnote && !about && !siteName) {
    return {
      ok: false,
      error: "Add page copy or site identity first, then generate.",
      status: 400,
    };
  }

  const prompt = [
    "You write the Craft page intro for a personal portfolio (/craft — engineering notes).",
    "Voice: thoughtful, concrete, maker energy; no buzzwords; no emojis.",
    "Return ONLY valid JSON:",
    '{"variants":[{"kicker":"…","title":"…","intro":"…","footnote":"…"}]}',
    "",
    "Rules:",
    "- Exactly 2 or 3 variants with distinct angles.",
    "- kicker: short eyebrow (1–3 words).",
    "- title: page title.",
    "- intro: 1–3 short paragraphs (\\n\\n), max ~500 chars.",
    "- footnote: optional short line under the intro.",
    "- Ground voice in site name/roles/about when provided; polish existing draft if present.",
    "",
    `Site name: ${siteName || "(not set)"}`,
    siteRoles.length ? `Roles: ${siteRoles.join(", ")}` : "Roles: (not set)",
    `About excerpt: ${about || "(empty)"}`,
    `Current kicker: ${kicker || "(empty)"}`,
    `Current title: ${title || "(empty)"}`,
    `Current intro: ${intro || "(empty)"}`,
    `Current footnote: ${footnote || "(empty)"}`,
  ].join("\n");

  const gemini = await callGeminiJson(apiKey, [{ text: prompt }], 0.8);
  if (!gemini.ok) return { ok: false, error: gemini.error, status: gemini.status };

  const generated = parsePageGenerated(gemini.text);
  if (!generated) {
    console.error("Could not parse Gemini JSON", gemini.text.slice(0, 500));
    return { ok: false, error: "Could not parse AI response. Try again.", status: 502 };
  }

  return { ok: true, data: generated };
}

/**
 * Generates 2–3 polished craft group packages (intro + items).
 * @example await generateCraftGroup(key, body) // { ok: true, data } | …
 */
export async function generateCraftGroup(
  apiKey: string,
  body: GenerateCraftGroupInput,
): Promise<Outcome<GenerateCraftGroupResult>> {
  const groupTitle = str(body.groupTitle, 120);
  const groupIntro = str(body.groupIntro, 400);
  const siteName = str(body.siteName, 80);
  const siteRoles = strList(body.siteRoles, 8, 60);
  const about = str(body.about, 400);

  const itemsRaw = Array.isArray(body.items) ? body.items : [];
  const items = itemsRaw.slice(0, 12).map((item) => {
    const row = item && typeof item === "object" ? (item as CraftGroupItemDraft) : {};
    return {
      title: str(row.title, 120),
      why: str(row.why, 400),
    };
  }).filter((item) => item.title || item.why);

  if (!groupTitle && !groupIntro && items.length === 0) {
    return {
      ok: false,
      error: "Add a group title, intro, or items first, then generate.",
      status: 400,
    };
  }

  const prompt = [
    "You polish one Craft group on a personal portfolio (/craft).",
    "Each item is a practice/principle with a short why-it-matters note.",
    "Voice: concrete, reflective, no fluff, no emojis.",
    "Return ONLY valid JSON:",
    '{"variants":[{"intro":"…","items":[{"title":"…","why":"…"}]}]}',
    "",
    "Rules:",
    "- Exactly 2 or 3 variants.",
    "- Keep roughly the same number of items as the draft when items exist (improve them).",
    "- If the draft has no items, invent 2–4 strong items that fit the group title.",
    "- Do not change the group title (title stays as provided by the editor).",
    "- intro: 1–2 sentences for the group.",
    "- why: 1–2 sentences max per item.",
    "",
    `Site name: ${siteName || "(not set)"}`,
    siteRoles.length ? `Roles: ${siteRoles.join(", ")}` : "Roles: (not set)",
    `About excerpt: ${about || "(empty)"}`,
    `Group title: ${groupTitle || "(untitled)"}`,
    `Group intro: ${groupIntro || "(empty)"}`,
    items.length
      ? `Draft items:\n${items.map((i) => `- ${i.title || "(untitled)"}: ${i.why || "(empty)"}`).join("\n")}`
      : "Draft items: (empty)",
  ].join("\n");

  const gemini = await callGeminiJson(apiKey, [{ text: prompt }], 0.8);
  if (!gemini.ok) return { ok: false, error: gemini.error, status: gemini.status };

  const generated = parseGroupGenerated(gemini.text);
  if (!generated) {
    console.error("Could not parse Gemini JSON", gemini.text.slice(0, 500));
    return { ok: false, error: "Could not parse AI response. Try again.", status: 502 };
  }

  return { ok: true, data: generated };
}
