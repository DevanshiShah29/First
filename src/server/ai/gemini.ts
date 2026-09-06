const GEMINI_MODEL = "gemini-3.6-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export type GeminiPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } };

export type GeminiCallResult =
  | { ok: true; text: string }
  | { ok: false; error: string; status: number };

/**
 * Calls Gemini generateContent and returns JSON text.
 * @example await callGeminiJson(key, parts) // { ok: true, text } | { ok: false, … }
 */
export async function callGeminiJson(
  apiKey: string,
  parts: GeminiPart[],
  temperature = 0.7,
): Promise<GeminiCallResult> {
  let geminiRes: Response;
  try {
    geminiRes = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature,
          responseMimeType: "application/json",
        },
      }),
    });
  } catch (err) {
    console.error("Gemini request failed", err);
    return { ok: false, error: "Could not reach Gemini.", status: 502 };
  }

  const geminiJson = (await geminiRes.json().catch(() => null)) as {
    error?: { message?: string };
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  } | null;

  if (!geminiRes.ok) {
    console.error("Gemini API error", geminiRes.status);
    return { ok: false, error: "AI generation failed. Try again.", status: 502 };
  }

  const text = geminiJson?.candidates?.[0]?.content?.parts
    ?.map((p) => p.text || "")
    .join("")
    .trim();

  if (!text) {
    return { ok: false, error: "Gemini returned an empty response.", status: 502 };
  }

  return { ok: true, text };
}

/**
 * Reads GEMINI_API_KEY from env or null.
 * @example requireGeminiApiKey() // "AIza…" | null
 */
export function requireGeminiApiKey(): string | null {
  return process.env.GEMINI_API_KEY?.trim() || null;
}
