import { callGeminiJson } from "@/server/ai/gemini";
import { normalizeHex, parseJsonObject, str } from "@/server/ai/strings";

export type GenerateMemoryInput = {
  title?: unknown;
  note?: unknown;
  category?: unknown;
  date?: unknown;
  color?: unknown;
};

export type MemoryCopyVariant = {
  title: string;
  note: string;
  category: string;
  color: string;
};

export type GenerateMemoryResult = {
  variants: MemoryCopyVariant[];
};

export type GenerateMemoryOutcome =
  | { ok: true; data: GenerateMemoryResult }
  | { ok: false; error: string; status: number };

const CATEGORIES = ["Milestone", "Tiny Joy", "Craft", "Discovery", "Learning", "Life"];

/**
 * Parses Gemini JSON into memory variants.
 * @example parseGenerated(raw) // { variants } | null
 */
function parseGenerated(raw: string): GenerateMemoryResult | null {
  const obj = parseJsonObject(raw);
  if (!obj) return null;
  const list = Array.isArray(obj.variants) ? obj.variants : null;
  if (!list || list.length < 2) return null;

  const variants: MemoryCopyVariant[] = [];
  for (const entry of list.slice(0, 3)) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const title = str(row.title, 120);
    const note = str(row.note, 800);
    let category = str(row.category, 40);
    if (!CATEGORIES.includes(category) && category) {
      // keep custom category if model invents one; prefer known set when close
      const match = CATEGORIES.find((c) => c.toLowerCase() === category.toLowerCase());
      if (match) category = match;
    }
    const color = normalizeHex(row.color) || "#A78BFA";
    if (!note && !title) continue;
    variants.push({
      title: title || "A small moment",
      note: note || title,
      category: category || "Tiny Joy",
      color,
    });
  }

  if (variants.length < 2) return null;
  return { variants };
}

/**
 * Generates 2–3 polished memory packages from the current draft.
 * @example await generateMemory(key, body) // { ok: true, data } | …
 */
export async function generateMemory(
  apiKey: string,
  body: GenerateMemoryInput,
): Promise<GenerateMemoryOutcome> {
  const title = str(body.title, 120);
  const note = str(body.note, 800);
  const category = str(body.category, 40);
  const date = str(body.date, 80);
  const color = normalizeHex(body.color) || "";

  if (!title && !note && !category) {
    return {
      ok: false,
      error: "Add a title, note, or category first, then generate.",
      status: 400,
    };
  }

  const prompt = [
    "You polish a single Memory Jar entry for a personal portfolio.",
    "Tone: intimate, specific, warm — like a handwritten note. No corporate voice. No emojis.",
    "Return ONLY valid JSON:",
    '{"variants":[{"title":"…","note":"…","category":"…","color":"#A78BFA"}]}',
    "",
    "Rules:",
    "- Exactly 2 or 3 variants with different emotional angles.",
    "- title: short evocative label (optional-feeling but always fill).",
    "- note: 2–5 sentences max; sensory and specific; preserve the real moment.",
    `- category: prefer one of ${CATEGORIES.join(", ")} unless the draft uses something else.`,
    "- color: #RRGGBB glow accent that fits the mood.",
    "- Use the date only for temporal tone; do not rewrite the date field.",
    "- If draft is sparse, expand gently without inventing false life events.",
    "",
    `Current title: ${title || "(empty)"}`,
    `Current note: ${note || "(empty)"}`,
    `Current category: ${category || "(empty)"}`,
    `Current date: ${date || "(empty)"}`,
    `Current color: ${color || "(empty)"}`,
  ].join("\n");

  const gemini = await callGeminiJson(apiKey, [{ text: prompt }], 0.9);
  if (!gemini.ok) return { ok: false, error: gemini.error, status: gemini.status };

  const generated = parseGenerated(gemini.text);
  if (!generated) {
    console.error("Could not parse Gemini JSON", gemini.text.slice(0, 500));
    return { ok: false, error: "Could not parse AI response. Try again.", status: 502 };
  }

  return { ok: true, data: generated };
}
