import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { CMS_CONTENT_TAG, loadContent, saveContent } from "@/content/store";
import { parseContentForSave } from "@/content/validate";
import { requireCmsMutation, verifySessionCookie } from "@/server/cms-auth";

export const runtime = "nodejs";

/**
 * Handles GET /api/cms/content.
 * @example GET // {content} when session cookie is valid
 */
export async function GET() {
  const token = (await cookies()).get("cms_session")?.value;
  if (!(await verifySessionCookie(token))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const content = await loadContent();
  return NextResponse.json({ content });
}

/**
 * Handles POST /api/cms/content.
 * @example POST {content} // save + revalidate + {ok:true}
 */
export async function POST(req: Request) {
  const gate = await requireCmsMutation(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
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
  const parsed = parseContentForSave(payload);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  try {
    await saveContent(parsed.content);
  } catch {
    console.error("saveContent failed");
    return NextResponse.json(
      {
        error: "Could not save content to the database. Check DATABASE_URL and try again.",
      },
      { status: 500 },
    );
  }
  revalidateTag(CMS_CONTENT_TAG, "max");
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/reading");
  revalidatePath("/memories");
  revalidatePath("/craft");
  return NextResponse.json({ ok: true, content: parsed.content });
}
