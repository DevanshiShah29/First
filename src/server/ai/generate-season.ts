import { getSeasonPreset, isSeasonId, type SeasonPalette } from "@/content/season-presets";
import { isCustomSeasonId } from "@/content/seasons";
import { DEFAULT_THEME, THEME_PALETTE_FIELDS, type ThemePalette } from "@/content/types";
import { normalizeHex } from "@/lib/hex";
import { callGeminiJson } from "@/server/ai/gemini";
import { parseJsonObject, str } from "@/server/ai/strings";

export type GeneratedSeasonLook = {
  palette: SeasonPalette;
};

type GenerateBody = {
  seasonId?: unknown;
  name?: unknown;
  note?: unknown;
  palette?: unknown;
};

/**
 * Parses one light or dark palette. Every key must be a hex color.
 * @example parsePaletteObj(raw, DEFAULT_THEME.light) // ThemePalette | null
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
 * Parses the season palette the editor already has, used only as a seed.
 * @example parseSeedPalette(body.palette) // SeasonPalette | null
 */
function parseSeedPalette(value: unknown): SeasonPalette | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const light = parsePaletteObj(row.light, DEFAULT_THEME.light);
  const dark = parsePaletteObj(row.dark, DEFAULT_THEME.dark);
  if (!light || !dark) return null;
  return {
    brandFrom: normalizeHex(row.brandFrom, light.accentText),
    brandTo: normalizeHex(row.brandTo, light.accentHover),
    light,
    dark,
  };
}

/**
 * Parses model JSON into a full season palette.
 * @example parseGenerated(raw) // GeneratedSeasonLook | null
 */
function parseGenerated(raw: string): GeneratedSeasonLook | null {
  const obj = parseJsonObject(raw);
  if (!obj) return null;
  const light = parsePaletteObj(obj.light, DEFAULT_THEME.light);
  const dark = parsePaletteObj(obj.dark, DEFAULT_THEME.dark);
  if (!light || !dark) return null;

  return {
    palette: {
      brandFrom: normalizeHex(obj.brandFrom, light.accentText),
      brandTo: normalizeHex(obj.brandTo, light.accentHover),
      light,
      dark,
    },
  };
}

/**
 * Builds the Gemini prompt for one festive season's colors.
 * @example buildPrompt("Halloween", "Deep plum and amber.", "softer gold") // string
 */
function buildPrompt(
  label: string,
  character: string,
  note: string,
  seed?: { palette: SeasonPalette },
): string {
  const keys = THEME_PALETTE_FIELDS.map((field) => `"${field.key}"`).join(", ");
  const noteBlock = note ? `\nOptional look note:\n"""${note}"""\n` : "";
  const seedBlock = seed
    ? `\nCurrent colors (refine them; do not copy them blindly):\npalette: ${JSON.stringify(seed.palette)}\n`
    : "";

  return `You are a senior product designer restyling a festive overlay on a portfolio site.

Season: ${label}
Character: ${character}
${noteBlock}${seedBlock}
Stay recognizably ${label}. Return ONLY JSON:
{
  "brandFrom": "#RRGGBB",
  "brandTo": "#RRGGBB",
  "light": { ${keys} },
  "dark": { ${keys} }
}

Rules for both light and dark palettes (same 7 keys each):
- background, foreground (text), card, chip, accentText, accentHover, badge
- Readable text/background contrast (WCAG AA: text vs background ≥ 4.5:1)
- Accent text readable on background and cards (≥ 3:1)
- card distinct from background
- chip distinct enough from card/background for tiles
- accentHover clearly different from accentText
- badge should feel like a highlight without clashing
- Light palette: light surfaces, dark text
- Dark palette: dark surfaces, light text
- brandFrom and brandTo complement the accents and work as a gradient
- Hex only as #RRGGBB uppercase
- No extra keys, no markdown`;
}

/**
 * Generates a season palette via Gemini.
 * @example await generateSeason(apiKey, { seasonId: "diwali" })
 */
export async function generateSeason(
  apiKey: string,
  body: GenerateBody,
): Promise<{ ok: true; data: GeneratedSeasonLook } | { ok: false; error: string; status: number }> {
  const seasonId = str(body.seasonId, 40);
  const preset = isSeasonId(seasonId) ? getSeasonPreset(seasonId) : undefined;
  if (!preset && !isCustomSeasonId(seasonId)) {
    return { ok: false, error: "Choose a season first.", status: 400 };
  }

  const label = preset?.name ?? (str(body.name, 60).trim() || "Festival");
  const character =
    preset?.description ?? "A festival added in the CMS. Keep the palette festive and readable.";
  const note = str(body.note, 400);
  const palette = parseSeedPalette(body.palette);
  const seed = palette ? { palette } : undefined;

  const result = await callGeminiJson(apiKey, [{ text: buildPrompt(label, character, note, seed) }], 0.85);
  if (!result.ok) {
    return { ok: false, error: result.error, status: result.status };
  }

  const parsed = parseGenerated(result.text);
  if (!parsed) {
    return { ok: false, error: "AI returned an invalid season palette. Try again.", status: 502 };
  }

  return { ok: true, data: parsed };
}
