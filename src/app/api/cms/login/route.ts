import { NextResponse } from "next/server";
import {
  clearFailedLogins,
  cmsConfigured,
  createSessionCookie,
  loginRateLimited,
  passwordsMatch,
  recordFailedLogin,
} from "@/server/cms-auth";
import { clientIp } from "@/server/contact";

export const runtime = "nodejs";

/**
 * Handles POST /api/cms/login.
 * @example POST {password} // Set-Cookie + {ok:true}
 */
export async function POST(req: Request) {
  if (!(await cmsConfigured())) {
    return NextResponse.json(
      {
        error:
          "Set ADMIN_PASSWORD and CMS_SECRET in .env.local, then restart the server.",
      },
      { status: 500 },
    );
  }

  const ip = clientIp(req);
  if (await loginRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again in a few minutes." },
      { status: 429 },
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
    await recordFailedLogin(ip);
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }
  await clearFailedLogins(ip);
  const session = await createSessionCookie();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(session.name, session.value, session.options);
  return res;
}
