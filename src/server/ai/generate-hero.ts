import { callGeminiJson } from "@/server/ai/gemini";
import { parseJsonObject, str, strList } from "@/server/ai/strings";

export type GenerateHeroInput = {
  kicker?: unknown;
  greeting?: unknown;
  roles?: unknown;
  line?: unknown;
};

export type HeroCopyVariant = {
  kicker: string;
  greeting: string;
  roles: string[];
  line: string;
};

export type GenerateHeroResult = {
  variants: HeroCopyVariant[];
};

export type GenerateHeroOutcome =
  | { ok: true; data: GenerateHeroResult }
  | { ok: false; error: string; status: number };

/**
 * Parses Gemini JSON into 2–3 hero copy variants.
 * @example parseGenerated(raw) // { variants } | null
 */
function parseGenerated(raw: string): GenerateHeroResult | null {
  const obj = parseJsonObject(raw);
  if (!obj) return null;
  const list = Array.isArray(obj.variants) ? obj.variants : null;
  if (!list || list.length < 2) return null;

  const variants: HeroCopyVariant[] = [];
  for (const entry of list.slice(0, 3)) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const kicker = str(row.kicker, 80);
    const greeting = str(row.greeting, 120);
    const roles = strList(row.roles, 6, 60);
    const line = str(row.line, 320);
    if (!greeting && !line) continue;
    variants.push({
      kicker: kicker || "Portfolio",
      greeting: greeting || "Hi, I’m …",
      roles: roles.length ? roles : ["Product Manager"],
      line: line || greeting,
    });
  }

  if (variants.length < 2) return null;
  return { variants };
}

/**
 * Generates 2–3 polished hero copy variants from the current draft.
 * @example await generateHero(key, body) // { ok: true, data } | { ok: false, … }
 */
export async function generateHero(
  apiKey: string,
  body: GenerateHeroInput,
): Promise<GenerateHeroOutcome> {
  const kicker = str(body.kicker, 80);
  const greeting = str(body.greeting, 120);
  const roles = strList(body.roles, 8, 60);
  const line = str(body.line, 320);

  if (!kicker && !greeting && roles.length === 0 && !line) {
    return {
      ok: false,
      error: "Add some hero copy first, then generate polished versions.",
      status: 400,
    };
  }

  const prompt = [
    "You polish homepage hero copy for a personal portfolio.",
    "Voice: warm, sharp, confident, human — no buzzword salad, no emojis, no corporate fluff.",
    "Return ONLY valid JSON with this shape:",
    '{"variants":[{"kicker":"…","greeting":"…","roles":["…","…"],"line":"…"}]}',
    "",
    "Rules:",
    "- Return exactly 2 or 3 variants that feel meaningfully different (tone/angle), not tiny rewordings.",
    "- kicker: short eyebrow label (1–4 words).",
    "- greeting: short hello / name line.",
    "- roles: 2–4 typed rotating role labels (concise).",
    "- line: one-liner value prop, 1–2 sentences, max ~220 chars.",
    "- Preserve truth from the current draft; sharpen wording, do not invent a new identity.",
    "- Keep first-person natural; avoid \"I am passionate about\".",
    "",
    `Current kicker: ${kicker || "(empty)"}`,
    `Current greeting: ${greeting || "(empty)"}`,
    roles.length ? `Current roles: ${roles.join(", ")}` : "Current roles: (empty)",
    `Current one-liner: ${line || "(empty)"}`,
  ].join("\n");

  const gemini = await callGeminiJson(apiKey, [{ text: prompt }], 0.85);
  if (!gemini.ok) return { ok: false, error: gemini.error, status: gemini.status };

  const generated = parseGenerated(gemini.text);
  if (!generated) {
    console.error("Could not parse Gemini JSON", gemini.text.slice(0, 500));
    return { ok: false, error: "Could not parse AI response. Try again.", status: 502 };
  }

  return { ok: true, data: generated };
}
