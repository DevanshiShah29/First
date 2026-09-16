const GEMINI_MODEL = "gemini-3.6-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export type GeminiPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } };

export type GeminiCallResult =
  | { ok: true; text: string }
  | { ok: false; error: string; status: number };

type GeminiResponseJson = {
  error?: { message?: string; status?: string; code?: number };
  promptFeedback?: { blockReason?: string };
  candidates?: {
    finishReason?: string;
    content?: { parts?: { text?: string; thought?: boolean }[] };
  }[];
};

/**
 * Maps Gemini HTTP / API errors to a short user-facing message.
 * @example userFacingGeminiError(429, json) // "AI rate limit…"
 */
function userFacingGeminiError(httpStatus: number, body: GeminiResponseJson | null): string {
  const raw = (body?.error?.message || "").trim();
  const lower = raw.toLowerCase();

  if (httpStatus === 429 || lower.includes("rate") || lower.includes("quota") || lower.includes("resource_exhausted")) {
    if (lower.includes("free_tier") || lower.includes("free tier")) {
      return "Gemini free-tier quota for this model is used up (often ~20 requests/day). Wait for reset, or enable billing / switch models.";
    }
    return "AI rate limit hit. Wait a minute and try again.";
  }
  if (httpStatus === 401 || httpStatus === 403 || lower.includes("api key")) {
    return "Gemini API key was rejected. Check GEMINI_API_KEY on the server.";
  }
  if (
    httpStatus === 413 ||
    lower.includes("too large") ||
    lower.includes("payload") ||
    lower.includes("request entity")
  ) {
    return "The AI request was too large (often the resume PDF). Try again with a smaller resume, or shorten draft text.";
  }
  if (raw) return raw.slice(0, 180);
  return `AI generation failed (HTTP ${httpStatus}). Try again.`;
}

/**
 * Extracts non-thought text from a Gemini generateContent response.
 * @example extractCandidateText(json) // "{\"variants\":…}"
 */
function extractCandidateText(body: GeminiResponseJson | null): {
  text: string;
  finishReason?: string;
  blockReason?: string;
} {
  const blockReason = body?.promptFeedback?.blockReason;
  const candidate = body?.candidates?.[0];
  const finishReason = candidate?.finishReason;
  // Prefer non-thought parts; if the model only returned text parts, use those.
  const parts = candidate?.content?.parts ?? [];
  const nonThought = parts.filter((p) => !p.thought).map((p) => p.text || "").join("").trim();
  const text = nonThought || parts.map((p) => p.text || "").join("").trim();
  return { text, finishReason, blockReason };
}

/**
 * Calls Gemini generateContent and returns JSON text.
 * Request shape matches the previously working CMS config (temperature + JSON mime only).
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

  const geminiJson = (await geminiRes.json().catch(() => null)) as GeminiResponseJson | null;

  if (!geminiRes.ok) {
    console.error("Gemini API error", geminiRes.status, geminiJson?.error?.message || geminiJson);
    return {
      ok: false,
      error: userFacingGeminiError(geminiRes.status, geminiJson),
      status: geminiRes.status === 429 ? 429 : 502,
    };
  }

  const { text, finishReason, blockReason } = extractCandidateText(geminiJson);

  if (blockReason) {
    console.error("Gemini blocked prompt", blockReason);
    return {
      ok: false,
      error: "Gemini blocked this prompt. Soften draft wording and try again.",
      status: 502,
    };
  }

  if (!text) {
    console.error("Gemini empty response", { finishReason, candidate: geminiJson?.candidates?.[0] });
    if (finishReason === "MAX_TOKENS") {
      return {
        ok: false,
        error: "AI ran out of output tokens. Try again.",
        status: 502,
      };
    }
    if (finishReason === "SAFETY" || finishReason === "RECITATION") {
      return {
        ok: false,
        error: "Gemini filtered the response. Soften draft wording and try again.",
        status: 502,
      };
    }
    return { ok: false, error: "Gemini returned an empty response. Try again.", status: 502 };
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
