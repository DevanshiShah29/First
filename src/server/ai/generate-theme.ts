import {
  DEFAULT_THEME,
  THEME_PALETTE_FIELDS,
  type ThemePalette,
} from "@/content/types";
import { normalizeHex } from "@/lib/hex";
import { callGeminiJson } from "@/server/ai/gemini";
import { parseJsonObject, str } from "@/server/ai/strings";

export type GeneratedTheme = {
  name: string;
  description: string;
  brandFrom: string;
  brandTo: string;
  light: ThemePalette;
  dark: ThemePalette;
};

type GenerateBody = {
  prompt?: unknown;
  seedLight?: unknown;
  seedDark?: unknown;
};

/**
 * Parses a ThemePalette object from model JSON.
 * @example parsePaletteObj(raw, fallback) // ThemePalette | null
 */
function parsePaletteObj(value: unknown, fallback: ThemePalette): ThemePalette | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const next: ThemePalette = { ...fallback };
  for (const field of THEME_PALETTE_FIELDS) {
    const hex = normalizeHex(row[field.key], "");
    if (!hex) return null;
    next[field.key] = hex;
  }
  return next;
}

/**
 * Parses Gemini JSON into a full light+dark theme.
 * @example parseGenerated(raw) // GeneratedTheme | null
 */
function parseGenerated(raw: string): GeneratedTheme | null {
  const obj = parseJsonObject(raw);
  if (!obj) return null;

  const light = parsePaletteObj(obj.light, DEFAULT_THEME.light);
  const dark = parsePaletteObj(obj.dark, DEFAULT_THEME.dark);
  if (!light || !dark) return null;

  return {
    name: str(obj.name, 60) || "Custom theme",
    description: str(obj.description, 160) || "AI-generated palette",
    brandFrom: normalizeHex(obj.brandFrom, light.accentText),
    brandTo: normalizeHex(obj.brandTo, light.accentHover),
    light,
    dark,
  };
}

/**
 * Builds the Gemini prompt for a cohesive 8-variable theme.
 * @example buildPrompt("warm vintage") // string
 */
function buildPrompt(prompt: string, seed?: { light: ThemePalette; dark: ThemePalette }): string {
  const keys = THEME_PALETTE_FIELDS.map((f) => `"${f.key}"`).join(", ");
  const seedBlock = seed
    ? `\nOptional starting point (refine, do not copy blindly):\nlight: ${JSON.stringify(seed.light)}\ndark: ${JSON.stringify(seed.dark)}\n`
    : "";

  return `You are a senior product designer creating a production-ready website theme.

User mood / personality:
"""${prompt}"""
${seedBlock}
Return ONLY JSON with this shape:
{
  "name": "short theme name",
  "description": "one short mood sentence",
  "brandFrom": "#RRGGBB",
  "brandTo": "#RRGGBB",
  "light": { ${keys} },
  "dark": { ${keys} }
}

Rules for both light and dark palettes (same 8 keys each):
- background, foreground (text), card, cardHover, chip (chips/tiles), accentText, accentHover, badge
- Strong visual harmony and intentional hierarchy
- Readable text/background contrast (WCAG AA: text vs background ≥ 4.5:1)
- Accent text readable on background and cards (≥ 3:1)
- card distinct from background; cardHover clearly different from card
- chip distinct enough from card/background for tiles
- accentHover clearly different from accentText
- badge should feel like a highlight without clashing
- Light palette: light surfaces, dark text
- Dark palette: dark surfaces, light text
- brandFrom/brandTo should complement accent colors (used for logo/gradients)
- Hex only as #RRGGBB uppercase
- No extra keys, no markdown`;
}

/**
 * Generates a full theme (light + dark) from a mood prompt via Gemini.
 * @example await generateTheme(apiKey, { prompt: "warm vintage" })
 */
export async function generateTheme(
  apiKey: string,
  body: GenerateBody,
): Promise<{ ok: true; data: GeneratedTheme } | { ok: false; error: string; status: number }> {
  const prompt = str(body.prompt, 400);
  if (prompt.length < 3) {
    return { ok: false, error: "Describe the mood or personality you want (at least a few words).", status: 400 };
  }

  let seed: { light: ThemePalette; dark: ThemePalette } | undefined;
  const seedLight = parsePaletteObj(body.seedLight, DEFAULT_THEME.light);
  const seedDark = parsePaletteObj(body.seedDark, DEFAULT_THEME.dark);
  if (seedLight && seedDark) seed = { light: seedLight, dark: seedDark };

  const result = await callGeminiJson(apiKey, [{ text: buildPrompt(prompt, seed) }], 0.85);
  if (!result.ok) {
    return { ok: false, error: result.error, status: result.status };
  }

  const parsed = parseGenerated(result.text);
  if (!parsed) {
    return { ok: false, error: "AI returned an invalid theme palette. Try again.", status: 502 };
  }

  return { ok: true, data: parsed };
}
