import { NextResponse } from "next/server";
import {
  analyticsRateLimited,
  normalizeAnalyticsPath,
  recordPageView,
  sanitizeReferrer,
  withVisitorCookie,
} from "@/server/analytics";
import { clientIp } from "@/server/contact";

export const runtime = "nodejs";

/**
 * Handles POST /api/analytics/collect — records a public page view.
 * @example POST { path: "/craft", referrer: "…" } // { ok: true }
 */
export async function POST(req: Request) {
  if (await analyticsRateLimited(clientIp(req))) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const path =
    body !== null && typeof body === "object" && "path" in body
      ? normalizeAnalyticsPath((body as { path: unknown }).path)
      : null;
  if (!path) {
    return NextResponse.json({ error: "Invalid path." }, { status: 400 });
  }

  const referrer =
    body !== null && typeof body === "object" && "referrer" in body
      ? sanitizeReferrer((body as { referrer: unknown }).referrer)
      : "";

  try {
    const result = await recordPageView(req, path, referrer);
    const res = NextResponse.json({ ok: true, deduped: result.deduped });
    return withVisitorCookie(res, result.visitorId);
  } catch (err) {
    console.error("analytics collect failed", err);
    return NextResponse.json({ error: "Could not record view." }, { status: 500 });
  }
}
