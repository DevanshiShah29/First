import { NextResponse } from "next/server";
import { loadContent } from "@/content/store";
import {
  createPasswordResetToken,
  forgotPasswordRateLimited,
  recordForgotPasswordAttempt,
} from "@/server/cms-auth";
import { clientIp, deliverSimpleMail, requestOrigin } from "@/server/contact";

export const runtime = "nodejs";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (await forgotPasswordRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many reset requests. Try again in a little while." },
      { status: 429 },
    );
  }
  await recordForgotPasswordAttempt(ip);

  const { site } = await loadContent();
  const to = (process.env.CONTACT_TO_EMAIL || site.email).trim();
  if (!to) {
    return NextResponse.json(
      { error: "Admin email is not configured in Site settings." },
      { status: 500 },
    );
  }

  let token: string;
  try {
    ({ token } = await createPasswordResetToken());
  } catch {
    console.error("createPasswordResetToken failed");
    return NextResponse.json(
      { error: "Could not start password reset. Check the database connection." },
      { status: 500 },
    );
  }

  const origin = requestOrigin(req);
  const resetUrl = `${origin}/admin/reset-password?token=${encodeURIComponent(token)}`;
  const siteName = site.name || "Portfolio";
  const subject = `${siteName} CMS password reset`;
  const text = [
    `A password reset was requested for the ${siteName} CMS.`,
    "",
    "Open this link to choose a new password (expires in 2 hours):",
    resetUrl,
    "",
    "If you did not request this, you can ignore this email.",
  ].join("\n");
  const html = `
    <div style="font-family:ui-sans-serif,system-ui,sans-serif;line-height:1.5;color:#121218">
      <p>A password reset was requested for the <strong>${escapeHtml(siteName)}</strong> CMS.</p>
      <p><a href="${escapeHtml(resetUrl)}">Choose a new password</a></p>
      <p style="word-break:break-all;font-size:13px;color:#50575e">${escapeHtml(resetUrl)}</p>
      <p style="color:#50575e;font-size:13px">This link expires in 2 hours.</p>
      <p style="color:#50575e;font-size:13px">If you did not request this, you can ignore this email.</p>
    </div>
  `.trim();

  try {
    const sent = await deliverSimpleMail(req, { to, subject, text, html, siteName });
    if (!sent) {
      return NextResponse.json(
        {
          error:
            "Could not send the reset email. Check RESEND_API_KEY or FORMSUBMIT_KEY, then try again.",
        },
        { status: 502 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Could not send the reset email. Please try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Reset link sent to your email.",
  });
}
