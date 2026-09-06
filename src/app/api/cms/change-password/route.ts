import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  assertSameOrigin,
  passwordsMatch,
  setStoredPassword,
  validateNewPassword,
  verifySessionCookie,
} from "@/lib/cms-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const token = (await cookies()).get("cms_session")?.value;
  if (!(await verifySessionCookie(token))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!assertSameOrigin(req)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
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

  return NextResponse.json({ ok: true });
}
