import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAnalyticsReport } from "@/server/analytics";
import { verifySessionCookie } from "@/server/cms-auth";

export const runtime = "nodejs";

/**
 * Handles GET /api/cms/analytics — CMS visitor/page-view report.
 * @example GET ?days=30 // { report }
 */
export async function GET(req: Request) {
  const token = (await cookies()).get("cms_session")?.value;
  if (!(await verifySessionCookie(token))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(req.url);
  const daysRaw = Number(url.searchParams.get("days") || "30");
  const days = Number.isFinite(daysRaw) ? daysRaw : 30;

  try {
    const report = await getAnalyticsReport(days);
    return NextResponse.json({ report });
  } catch {
    console.error("analytics report failed");
    return NextResponse.json(
      { error: "Could not load analytics. Check DATABASE_URL and try again." },
      { status: 500 },
    );
  }
}
