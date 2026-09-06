import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/server/cms-auth";

export const runtime = "nodejs";

/**
 * Handles POST /api/cms/logout.
 * @example POST // clear session cookie + {ok:true}
 */
export async function POST() {
  const session = clearSessionCookie();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(session.name, "", session.options);
  return res;
}
