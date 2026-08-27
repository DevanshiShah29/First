import { NextResponse } from "next/server";
import { cmsConfigured, createSessionCookie, passwordsMatch } from "@/lib/cms-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!cmsConfigured()) {
    return NextResponse.json(
      { error: "Set ADMIN_PASSWORD in .env.local, then restart the server." },
      { status: 500 },
    );
  }
  let password = "";
  try {
    const body = (await req.json()) as { password?: unknown };
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!(await passwordsMatch(password))) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }
  const session = await createSessionCookie();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(session.name, session.value, session.options);
  return res;
}
