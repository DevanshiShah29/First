import { NextResponse } from "next/server";
import { cmsUploadRateLimited, requireCmsMutation } from "@/server/cms-auth";
import { storeCmsUpload, type UploadFolder } from "@/server/cms-upload-storage";
import { clientIp } from "@/server/contact";
import { heicToJpeg } from "@/server/heic-jpeg";
import { sniffUploadMagic } from "@/server/upload-magic";

export const runtime = "nodejs";

const FOLDERS = new Set<UploadFolder>(["hero", "skills", "memories", "resume", "artifacts", "contact"]);
const MAX_BYTES = 25 * 1024 * 1024;
const MAX_RESUME_BYTES = 10 * 1024 * 1024;

const MEDIA_EXTS = new Set(["jpg", "png", "webp", "gif", "avif", "heic", "mp4", "webm", "ogv", "mov"]);

/**
 * Reads upload folder from FormData.
 * @example folderName(form) // "hero" | "skills" | …
 */
function folderName(form: FormData): UploadFolder {
  const raw = form.get("folder");
  const value = typeof raw === "string" ? raw.trim() : "";
  return FOLDERS.has(value as UploadFolder) ? (value as UploadFolder) : "hero";
}

/**
 * Handles POST /api/cms/upload.
 * @example POST multipart // {url, kind}
 */
export async function POST(req: Request) {
  const gate = await requireCmsMutation(req);
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  if (await cmsUploadRateLimited(clientIp(req))) {
    return NextResponse.json(
      { error: "Too many uploads. Try again in a few minutes." },
      { status: 429 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const folder = folderName(form);
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: folder === "resume" ? "Choose a PDF file." : "Choose an image or video file." },
      { status: 400 },
    );
  }

  if (folder === "resume") {
    return saveResume(file);
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File must be 25MB or smaller." }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const sniffed = sniffUploadMagic(buf);
  if (!sniffed || !MEDIA_EXTS.has(sniffed.ext)) {
    return NextResponse.json(
      { error: "File content is not a supported JPG, PNG, WebP, GIF, AVIF, HEIC, MP4, WebM, or MOV." },
      { status: 400 },
    );
  }

  let body: Buffer = buf;
  let ext = sniffed.ext;
  let contentType = sniffed.contentType;
  if (sniffed.ext === "heic") {
    try {
      body = await heicToJpeg(buf);
      ext = "jpg";
      contentType = "image/jpeg";
    } catch (err) {
      console.error("HEIC conversion failed", err);
      return NextResponse.json(
        { error: "Could not read that HEIC photo. Export it as JPG and try again." },
        { status: 400 },
      );
    }
  }

  const rawName = file.name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const filename = `${Date.now()}-${rawName || folder}.${ext}`;

  try {
    const stored = await storeCmsUpload({
      folder,
      filename,
      body,
      contentType,
    });
    return NextResponse.json({ url: stored.url, kind: sniffed.kind === "video" ? "video" : "image" });
  } catch (err) {
    console.error("CMS upload failed", err);
    const message =
      err instanceof Error && err.message.includes("BLOB_READ_WRITE_TOKEN")
        ? err.message
        : "Could not save the file. Check blob storage configuration and try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Stores an uploaded PDF resume and returns its public URL.
 * @example await saveResume(file) // JSON
 */
async function saveResume(file: File) {
  if (file.size > MAX_RESUME_BYTES) {
    return NextResponse.json({ error: "Resume must be 10MB or smaller." }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const sniffed = sniffUploadMagic(buf);
  if (!sniffed || sniffed.ext !== "pdf") {
    return NextResponse.json({ error: "That file does not look like a PDF." }, { status: 400 });
  }

  try {
    const stored = await storeCmsUpload({
      folder: "resume",
      filename: "resume.pdf",
      body: buf,
      contentType: "application/pdf",
      allowOverwrite: true,
    });
    const sep = stored.url.includes("?") ? "&" : "?";
    return NextResponse.json({
      url: `${stored.url}${sep}v=${Date.now()}`,
      kind: "file",
    });
  } catch (err) {
    console.error("CMS resume upload failed", err);
    const message =
      err instanceof Error && err.message.includes("BLOB_READ_WRITE_TOKEN")
        ? err.message
        : "Could not save the file. Check blob storage configuration and try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
