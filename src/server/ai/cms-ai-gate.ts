import { NextResponse } from "next/server";
import { cmsAiRateLimited, requireCmsMutation } from "@/server/cms-auth";
import { clientIp } from "@/server/contact";
import { requireGeminiApiKey } from "@/server/ai/gemini";

export type CmsAiGate =
  | { ok: true; apiKey: string }
  | { ok: false; response: NextResponse };

/**
 * Gates AI routes with session, rate limit, and Gemini key.
 * @example await requireCmsAi(req) // { ok: true, apiKey } | { ok: false, response }
 */
export async function requireCmsAi(req: Request): Promise<CmsAiGate> {
  const gate = await requireCmsMutation(req);
  if (!gate.ok) {
    return {
      ok: false,
      response: NextResponse.json({ error: gate.error }, { status: gate.status }),
    };
  }
  if (await cmsAiRateLimited(clientIp(req))) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Too many AI requests. Try again in a few minutes." },
        { status: 429 },
      ),
    };
  }
  const apiKey = requireGeminiApiKey();
  if (!apiKey) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "GEMINI_API_KEY is not configured on the server." },
        { status: 500 },
      ),
    };
  }
  return { ok: true, apiKey };
}
