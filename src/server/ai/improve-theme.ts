import {
  DEFAULT_THEME,
  THEME_PALETTE_FIELDS,
  type ThemePalette,
} from "@/content/types";
import { applyAllSuggestions, checkPalette, type PaletteIssue } from "@/lib/theme-contrast";
import { normalizeHex } from "@/lib/hex";
import { callGeminiJson } from "@/server/ai/gemini";
import { parseJsonObject, str } from "@/server/ai/strings";

export type ImproveThemeResult = {
  issues: PaletteIssue[];
  light: ThemePalette;
  dark: ThemePalette;
  summary: string;
};

type ImproveBody = {
  light?: unknown;
  dark?: unknown;
  mode?: unknown;
};

/**
 * Parses a ThemePalette from request/model JSON.
 * @example parsePalette(raw, fallback) // ThemePalette | null
 */
function parsePalette(value: unknown, fallback: ThemePalette): ThemePalette | null {
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
 * Improves light/dark palettes: local contrast check + Gemini refinement.
 * @example await improveTheme(apiKey, { light, dark })
 */
export async function improveTheme(
  apiKey: string,
  body: ImproveBody,
): Promise<{ ok: true; data: ImproveThemeResult } | { ok: false; error: string; status: number }> {
  const light = parsePalette(body.light, DEFAULT_THEME.light);
  const dark = parsePalette(body.dark, DEFAULT_THEME.dark);
  if (!light || !dark) {
    return { ok: false, error: "Both light and dark palettes are required.", status: 400 };
  }

  const mode = str(body.mode, 10) === "dark" ? "dark" : "light";
  const focus = mode === "dark" ? dark : light;
  const localIssues = checkPalette(focus);

  const keys = THEME_PALETTE_FIELDS.map((f) => `"${f.key}"`).join(", ");
  const issueLines =
    localIssues.length > 0
      ? localIssues.map((i) => `- ${i.field}: ${i.message} (now ${i.current}, local suggestion ${i.suggested})`).join("\n")
      : "- No hard failures; polish hierarchy and harmony.";

  const prompt = `You are a senior product designer reviewing a website color system.

Focus mode: ${mode}
Current light palette: ${JSON.stringify(light)}
Current dark palette: ${JSON.stringify(dark)}

Detected issues on the ${mode} palette:
${issueLines}

Return ONLY JSON:
{
  "summary": "one short sentence about what you improved",
  "light": { ${keys} },
  "dark": { ${keys} },
  "issues": [
    {
      "id": "short-id",
      "field": "one of ${THEME_PALETTE_FIELDS.map((f) => f.key).join("|")}",
      "message": "brief issue explanation",
      "current": "#RRGGBB",
      "suggested": "#RRGGBB"
    }
  ]
}

Rules:
- Keep the same visual personality; only fix contrast, similarity, weak hover, and hierarchy
- Preserve readable text/background contrast (AA)
- Keep card/chip/accent/badge hierarchy intentional
- Prefer minimal changes over a full redesign
- Hex only #RRGGBB uppercase
- issues array should list the meaningful fixes you made (or remaining concerns)
- No markdown`;

  const result = await callGeminiJson(apiKey, [{ text: prompt }], 0.4);
  if (!result.ok) {
    const fixed = applyAllSuggestions(focus, localIssues);
    return {
      ok: true,
      data: {
        issues: localIssues,
        light: mode === "light" ? fixed : light,
        dark: mode === "dark" ? fixed : dark,
        summary:
          localIssues.length > 0
            ? "Applied local contrast and hierarchy fixes (AI unavailable)."
            : "Palette looks solid — no issues found.",
      },
    };
  }

  const obj = parseJsonObject(result.text);
  if (!obj) {
    return { ok: false, error: "AI returned an invalid improvement payload.", status: 502 };
  }

  const nextLight = parsePalette(obj.light, light) || light;
  const nextDark = parsePalette(obj.dark, dark) || dark;

  const issuesRaw = Array.isArray(obj.issues) ? obj.issues : [];
  const fieldKeys = new Set(THEME_PALETTE_FIELDS.map((f) => f.key));
  const issues: PaletteIssue[] = issuesRaw
    .map((item, i) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const field = str(row.field, 40) as keyof ThemePalette;
      if (!fieldKeys.has(field)) return null;
      const current = normalizeHex(row.current, "");
      const suggested = normalizeHex(row.suggested, "");
      if (!current || !suggested) return null;
      return {
        id: str(row.id, 40) || `ai-${i + 1}`,
        field,
        message: str(row.message, 200) || "Suggested adjustment.",
        current,
        suggested,
      } satisfies PaletteIssue;
    })
    .filter((item): item is PaletteIssue => item !== null);

  return {
    ok: true,
    data: {
      issues: issues.length > 0 ? issues : localIssues,
      light: nextLight,
      dark: nextDark,
      summary: str(obj.summary, 200) || "Improved palette contrast and hierarchy.",
    },
  };
}
