/** Preferred model, then a quieter Flash-Lite when the preferred one is saturated. */
const MODEL_CHAIN = ["gemini-3.6-flash", "gemini-3.5-flash-lite"] as const;
const REQUEST_TIMEOUT_MS = 25_000;

function modelUrl(model: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type GeminiPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } };

export type GeminiCallResult =
  | { ok: true; text: string }
  | { ok: false; error: string; status: number };

type AttemptResult =
  | { ok: true; text: string }
  | { ok: false; error: string; status: number; retry: "capacity" | "stop" };

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
 * High demand and per-model quota are transient. A bad key or a bad prompt is not.
 * @example isCapacityFailure(503, json) // true
 */
function isCapacityFailure(httpStatus: number, body: GeminiResponseJson | null): boolean {
  const raw = (body?.error?.message || "").toLowerCase();
  const status = (body?.error?.status || "").toUpperCase();
  if (httpStatus === 429 || httpStatus === 500 || httpStatus === 503 || httpStatus === 504) return true;
  if (status === "UNAVAILABLE" || status === "RESOURCE_EXHAUSTED") return true;
  return (
    raw.includes("high demand") ||
    raw.includes("overloaded") ||
    raw.includes("try again later") ||
    raw.includes("resource_exhausted")
  );
}

const BUSY_MESSAGE =
  "Gemini is busy right now. I retried, then tried a quieter model. Wait a minute and generate again.";

/**
 * One generateContent call against a single model.
 * @example await callModel(key, "gemini-3.6-flash", parts, 0.6)
 */
async function callModel(
  apiKey: string,
  model: string,
  parts: GeminiPart[],
  temperature: number,
): Promise<AttemptResult> {
  let geminiRes: Response;
  try {
    geminiRes = await fetch(`${modelUrl(model)}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature,
          responseMimeType: "application/json",
        },
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    console.error("Gemini request failed", model, err);
    return { ok: false, error: "Could not reach Gemini.", status: 502, retry: "capacity" };
  }

  const geminiJson = (await geminiRes.json().catch(() => null)) as GeminiResponseJson | null;

  if (!geminiRes.ok) {
    console.error("Gemini API error", model, geminiRes.status, geminiJson?.error?.message || geminiJson);
    const capacity = isCapacityFailure(geminiRes.status, geminiJson);
    return {
      ok: false,
      error: userFacingGeminiError(geminiRes.status, geminiJson),
      status: geminiRes.status === 429 ? 429 : geminiRes.status === 503 ? 503 : 502,
      retry: capacity ? "capacity" : "stop",
    };
  }

  const { text, finishReason, blockReason } = extractCandidateText(geminiJson);

  if (blockReason) {
    console.error("Gemini blocked prompt", blockReason);
    return {
      ok: false,
      error: "Gemini blocked this prompt. Soften draft wording and try again.",
      status: 502,
      retry: "stop",
    };
  }

  if (!text) {
    console.error("Gemini empty response", { model, finishReason, candidate: geminiJson?.candidates?.[0] });
    if (finishReason === "MAX_TOKENS") {
      return { ok: false, error: "AI ran out of output tokens. Try again.", status: 502, retry: "stop" };
    }
    if (finishReason === "SAFETY" || finishReason === "RECITATION") {
      return {
        ok: false,
        error: "Gemini filtered the response. Soften draft wording and try again.",
        status: 502,
        retry: "stop",
      };
    }
    return { ok: false, error: "Gemini returned an empty response. Try again.", status: 502, retry: "capacity" };
  }

  return { ok: true, text };
}

/**
 * Calls Gemini generateContent and returns JSON text.
 * On high demand, retries the preferred model once, then falls back to Flash-Lite.
 * @example await callGeminiJson(key, parts) // { ok: true, text } | { ok: false, … }
 */
export async function callGeminiJson(
  apiKey: string,
  parts: GeminiPart[],
  temperature = 0.7,
): Promise<GeminiCallResult> {
  let last: Extract<AttemptResult, { ok: false }> | null = null;

  for (let modelIndex = 0; modelIndex < MODEL_CHAIN.length; modelIndex++) {
    const model = MODEL_CHAIN[modelIndex];
    const attempts = modelIndex === 0 ? 2 : 1;

    for (let attempt = 0; attempt < attempts; attempt++) {
      const result = await callModel(apiKey, model, parts, temperature);
      if (result.ok) {
        if (modelIndex > 0) console.error("Gemini fallback model answered", model);
        return { ok: true, text: result.text };
      }

      last = result;
      if (result.retry === "stop") return { ok: false, error: result.error, status: result.status };
      if (attempt + 1 < attempts) {
        await sleep(700 + Math.floor(Math.random() * 400));
      }
    }
  }

  return {
    ok: false,
    error: last && isBusyMessage(last.error) ? BUSY_MESSAGE : last?.error || BUSY_MESSAGE,
    status: last?.status === 429 ? 429 : 503,
  };
}

/**
 * True when the last error is Google's demand or quota text, which we replace.
 * @example isBusyMessage("This model is currently experiencing high demand…") // true
 */
function isBusyMessage(error: string): boolean {
  const lower = error.toLowerCase();
  if (lower.includes("free_tier") || lower.includes("free tier") || lower.includes("quota")) return false;
  return (
    lower.includes("high demand") ||
    lower.includes("try again later") ||
    lower.includes("overloaded") ||
    lower.includes("rate limit") ||
    lower.includes("could not reach") ||
    lower.includes("empty response")
  );
}

/**
 * Reads GEMINI_API_KEY from env or null.
 * @example requireGeminiApiKey() // "AIza…" | null
 */
export function requireGeminiApiKey(): string | null {
  return process.env.GEMINI_API_KEY?.trim() || null;
}
