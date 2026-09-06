import { NextResponse } from "next/server";
import {
  createSessionCookie,
  passwordsMatch,
  requireCmsMutation,
  setStoredPassword,
  validateNewPassword,
} from "@/server/cms-auth";

export const runtime = "nodejs";

/**
 * Handles POST /api/cms/change-password.
 * @example POST {current,new,confirm} // Set-Cookie + {ok:true}
 */
export async function POST(req: Request) {
  const gate = await requireCmsMutation(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  let currentPassword = "";
  let newPassword = "";
  let confirmPassword = "";
  try {
    const body = (await req.json()) as {
      currentPassword?: unknown;
      newPassword?: unknown;
      confirmPassword?: unknown;
    };
    currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
    confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!(await passwordsMatch(currentPassword))) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
  }

  const validationError = validateNewPassword(newPassword);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: "New passwords do not match." }, { status: 400 });
  }

  if (newPassword === currentPassword) {
    return NextResponse.json(
      { error: "New password must be different from the current password." },
      { status: 400 },
    );
  }

  try {
    await setStoredPassword(newPassword);
  } catch {
    console.error("setStoredPassword failed");
    return NextResponse.json(
      { error: "Could not update password. Check the database connection and try again." },
      { status: 500 },
    );
  }

  // Issue a fresh cookie bound to the new sessionVersion; old cookies are invalid.
  const session = await createSessionCookie();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(session.name, session.value, session.options);
  return res;
}
