import { rateLimited as sharedRateLimited } from "@/server/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_MAX = 100;
const EMAIL_MAX = 254;
const MESSAGE_MAX = 4000;
const CONTACT_SCOPE = "contact";
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

export type ContactFields = {
  name: string;
  email: string;
  message: string;
  company: string;
};

export function clientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || req.headers.get("x-real-ip") || "unknown";
}

/** Contact form rate limit (shared store when Upstash is configured). */
export async function rateLimited(ip: string) {
  return sharedRateLimited(CONTACT_SCOPE, ip || "unknown", MAX_PER_WINDOW, WINDOW_MS);
}

export function parseContactBody(body: unknown): ContactFields | { error: string } {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Invalid request." };
  }
  const row = body as Record<string, unknown>;
  const name = typeof row.name === "string" ? row.name.trim() : "";
  const email = typeof row.email === "string" ? row.email.trim() : "";
  const message = typeof row.message === "string" ? row.message.trim() : "";
  const company = typeof row.company === "string" ? row.company.trim() : "";
  if (!name || !email || !message) return { error: "Name, email, and message are required." };
  if (name.length > NAME_MAX) return { error: "Name is too long." };
  if (email.length > EMAIL_MAX || !EMAIL_RE.test(email)) return { error: "Enter a valid email." };
  if (message.length > MESSAGE_MAX) return { error: "Message is too long." };
  return { name, email, message, company };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function mailCopy(fields: ContactFields, siteName: string) {
  const subject = `Portfolio note from ${fields.name}`;
  const text = [
    `New message from the ${siteName} contact form.`,
    "",
    `Name: ${fields.name}`,
    `Email: ${fields.email}`,
    "",
    fields.message,
  ].join("\n");
  const html = `
    <div style="font-family:ui-sans-serif,system-ui,sans-serif;line-height:1.5;color:#121218">
      <p>New message from the ${escapeHtml(siteName)} contact form.</p>
      <p><strong>Name:</strong> ${escapeHtml(fields.name)}<br/>
      <strong>Email:</strong> ${escapeHtml(fields.email)}</p>
      <p style="white-space:pre-wrap">${escapeHtml(fields.message)}</p>
    </div>
  `.trim();
  return { subject, text, html };
}

async function sendWithResend(to: string, from: string, fields: ContactFields, siteName: string) {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return false;
  const { subject, text, html } = mailCopy(fields, siteName);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: fields.email,
      subject,
      text,
      html,
    }),
  });
  return res.ok;
}

function formOrigin(req: Request) {
  const origin = req.headers.get("origin")?.trim();
  if (origin) return origin;
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (!host) return "http://localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || "http";
  return `${proto}://${host}`;
}

async function sendWithFormSubmit(fields: ContactFields, siteName: string, origin: string) {
  const formKey = process.env.FORMSUBMIT_KEY?.trim();
  if (!formKey) return false;
  const { subject } = mailCopy(fields, siteName);
  const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(formKey)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Origin: origin,
      Referer: `${origin}/`,
    },
    body: JSON.stringify({
      name: fields.name,
      email: fields.email,
      message: fields.message,
      _subject: subject,
      _template: "table",
      _captcha: "false",
    }),
  });
  if (!res.ok) return false;
  const payload = (await res.json().catch(() => null)) as { success?: unknown; message?: unknown } | null;
  if (payload?.success === true || payload?.success === "true") return true;
  const message = typeof payload?.message === "string" ? payload.message : "";
  return /activat/i.test(message);
}

export async function deliverContact(req: Request, fields: ContactFields, to: string, siteName: string) {
  const from =
    process.env.CONTACT_FROM_EMAIL?.trim() || `${siteName} <onboarding@resend.dev>`;
  if (await sendWithResend(to, from, fields, siteName)) return true;
  return sendWithFormSubmit(fields, siteName, formOrigin(req));
}

export function requestOrigin(req: Request) {
  return formOrigin(req);
}

/** Send a simple transactional email (Resend first, FormSubmit fallback). */
export async function deliverSimpleMail(
  req: Request,
  input: { to: string; subject: string; text: string; html: string; siteName: string },
) {
  const from =
    process.env.CONTACT_FROM_EMAIL?.trim() || `${input.siteName} <onboarding@resend.dev>`;
  const key = process.env.RESEND_API_KEY?.trim();
  if (key) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    });
    if (res.ok) return true;
  }

  const formKey = process.env.FORMSUBMIT_KEY?.trim();
  if (!formKey) return false;
  const origin = formOrigin(req);
  const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(formKey)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Origin: origin,
      Referer: `${origin}/`,
    },
    body: JSON.stringify({
      name: "CMS Password Reset",
      email: input.to,
      message: input.text,
      _subject: input.subject,
      _template: "table",
      _captcha: "false",
    }),
  });
  if (!res.ok) return false;
  const payload = (await res.json().catch(() => null)) as { success?: unknown; message?: unknown } | null;
  if (payload?.success === true || payload?.success === "true") return true;
  const message = typeof payload?.message === "string" ? payload.message : "";
  return /activat/i.test(message);
}
