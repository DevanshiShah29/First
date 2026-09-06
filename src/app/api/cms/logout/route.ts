import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/server/cms-auth";

export const runtime = "nodejs";

export async function POST() {
  const session = clearSessionCookie();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(session.name, "", session.options);
  return res;
}
