import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { CMS_CONTENT_TAG, loadContent, saveContent } from "@/content/store";
import { parseContentForSave } from "@/content/validate";
import { requireCmsMutation, verifySessionCookie } from "@/server/cms-auth";

export const runtime = "nodejs";

/**
 * Maps a save failure to a short message without connection details.
 * @example saveErrorMessage(err) // "Could not reach the database..."
 */
function saveErrorMessage(err: unknown) {
  const message = err instanceof Error ? err.message : "";
  if (/Can't reach database server|P1001|timed out/i.test(message)) {
    return "Could not reach the database. Check DATABASE_URL and try again.";
  }
  if (/Unknown argument `contactMedia|contactMediaKind|P2022/i.test(message)) {
    return "The database client is out of date. Restart the dev server, then save again.";
  }
  return "Could not save content to the database. Check DATABASE_URL and try again.";
}

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
  } catch (err) {
    console.error("saveContent failed", err);
    return NextResponse.json({ error: saveErrorMessage(err) }, { status: 500 });
  }
  revalidateTag(CMS_CONTENT_TAG, "max");
  // Layout revalidation covers nested public routes; avoid stacking redundant path work.
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, content: parsed.content });
}
