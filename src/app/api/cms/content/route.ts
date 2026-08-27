import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { loadContent, parseContent, saveContent } from "@/content/store";
import { verifySessionCookie } from "@/lib/cms-auth";

export const runtime = "nodejs";

async function authed() {
  const token = (await cookies()).get("cms_session")?.value;
  return verifySessionCookie(token);
}

export async function GET() {
  if (!(await authed())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const content = await loadContent();
  return NextResponse.json({ content });
}

export async function POST(req: Request) {
  if (!(await authed())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const payload =
    body !== null && typeof body === "object" && "content" in body
      ? (body as { content: unknown }).content
      : body;
  const content = parseContent(payload);
  try {
    await saveContent(content);
  } catch {
    return NextResponse.json(
      {
        error:
          "Could not write content on this host. Save locally, then commit src/content/data.json to publish.",
      },
      { status: 500 },
    );
  }
  revalidatePath("/", "layout");
  revalidatePath("/");
  return NextResponse.json({ ok: true, content });
}
