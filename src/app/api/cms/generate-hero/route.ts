import { NextResponse } from "next/server";
import { requireCmsAi } from "@/server/ai/cms-ai-gate";
import { generateHero } from "@/server/ai/generate-hero";

export const runtime = "nodejs";

/**
 * Handles POST /api/cms/generate-hero.
 * @example POST body // {variants}
 */
export async function POST(req: Request) {
  const gate = await requireCmsAi(req);
  if (!gate.ok) return gate.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const result = await generateHero(gate.apiKey, (body ?? {}) as object);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    variants: result.data.variants,
  });
}
