import { NextResponse } from "next/server";
import { loadContent } from "@/content/store";
import { clientIp, deliverContact, parseContactBody, rateLimited } from "@/server/contact";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      const form = await req.formData();
      body = {
        name: form.get("name"),
        email: form.get("email"),
        message: form.get("message"),
        company: form.get("company"),
      };
    }
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = parseContactBody(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  if (parsed.company) {
    return NextResponse.json({ ok: true });
  }
  if (await rateLimited(clientIp(req))) {
    return NextResponse.json({ error: "Too many messages. Try again in a few minutes." }, { status: 429 });
  }

  const { site } = await loadContent();
  const to = (process.env.CONTACT_TO_EMAIL || site.email).trim();
  if (!to) {
    return NextResponse.json({ error: "Contact email is not configured." }, { status: 500 });
  }

  try {
    const sent = await deliverContact(req, parsed, to, site.name || "portfolio");
    if (!sent) {
      return NextResponse.json(
        { error: "Could not send your message. Please email me directly." },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Could not send your message. Please email me directly." },
      { status: 502 },
    );
  }
}
