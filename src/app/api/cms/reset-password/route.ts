import { NextResponse } from "next/server";
import {
  clearPasswordResetToken,
  consumePasswordResetToken,
  createSessionCookie,
  setStoredPassword,
  validateNewPassword,
} from "@/server/cms-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let token = "";
  let newPassword = "";
  let confirmPassword = "";
  try {
    const body = (await req.json()) as {
      token?: unknown;
      newPassword?: unknown;
      confirmPassword?: unknown;
    };
    token = typeof body.token === "string" ? body.token : "";
    newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
    confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!(await consumePasswordResetToken(token))) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired. Request a new one from the login page." },
      { status: 400 },
    );
  }

  const validationError = validateNewPassword(newPassword);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
  }

  try {
    await setStoredPassword(newPassword);
    await clearPasswordResetToken();
  } catch {
    console.error("reset password failed");
    return NextResponse.json(
      { error: "Could not update password. Check the database connection and try again." },
      { status: 500 },
    );
  }

  const session = await createSessionCookie();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(session.name, session.value, session.options);
  return res;
}
