import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifySessionCookie } from "@/lib/cms-auth";

export const runtime = "nodejs";

const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["image/avif", "avif"],
  ["image/svg+xml", "svg"],
  ["video/mp4", "mp4"],
  ["video/webm", "webm"],
  ["video/ogg", "ogv"],
  ["video/quicktime", "mov"],
]);

const EXT_ALIAS: Record<string, string> = {
  jpeg: "jpg",
  jpg: "jpg",
  png: "png",
  webp: "webp",
  gif: "gif",
  avif: "avif",
  svg: "svg",
  mp4: "mp4",
  webm: "webm",
  ogg: "ogv",
  ogv: "ogv",
  mov: "mov",
};

const FOLDERS = new Set(["hero", "skills", "memories", "resume"]);
const MAX_BYTES = 25 * 1024 * 1024;
const MAX_SVG_BYTES = 512 * 1024;
const MAX_RESUME_BYTES = 10 * 1024 * 1024;

function resolveExt(file: File): string | undefined {
  const byType = ALLOWED.get(file.type);
  if (byType) return byType;
  const match = file.name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? EXT_ALIAS[match[1]] : undefined;
}

function folderName(form: FormData): string {
  const raw = form.get("folder");
  const value = typeof raw === "string" ? raw.trim() : "";
  return FOLDERS.has(value) ? value : "hero";
}

export async function POST(req: Request) {
  const token = (await cookies()).get("cms_session")?.value;
  if (!(await verifySessionCookie(token))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
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

  const ext = resolveExt(file);
  if (!ext) {
    return NextResponse.json({ error: "Use JPG, PNG, WebP, GIF, SVG, MP4, or WebM." }, { status: 400 });
  }
  if (ext === "svg" && file.size > MAX_SVG_BYTES) {
    return NextResponse.json({ error: "SVG must be 512KB or smaller." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File must be 25MB or smaller." }, { status: 400 });
  }

  const rawName = file.name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const filename = `${Date.now()}-${rawName || folder}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  try {
    await mkdir(dir, { recursive: true });
    const buf = Buffer.from(await file.arrayBuffer());
    if (ext === "svg") {
      const text = buf.toString("utf8").replace(/^\uFEFF/, "").trim();
      if (!/<svg[\s>]/i.test(text)) {
        return NextResponse.json({ error: "That file does not look like an SVG." }, { status: 400 });
      }
    }
    await writeFile(path.join(dir, filename), buf);
  } catch {
    return NextResponse.json(
      { error: "Could not save the file on this host. Run the CMS locally to upload." },
      { status: 500 },
    );
  }

  const kind = ext === "svg" || file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "image";
  return NextResponse.json({ url: `/uploads/${folder}/${filename}`, kind });
}

function isPdf(file: File) {
  if (file.type === "application/pdf") return true;
  return file.name.toLowerCase().endsWith(".pdf");
}

async function saveResume(file: File) {
  if (!isPdf(file)) {
    return NextResponse.json({ error: "Use a PDF file for the resume." }, { status: 400 });
  }
  if (file.size > MAX_RESUME_BYTES) {
    return NextResponse.json({ error: "Resume must be 10MB or smaller." }, { status: 400 });
  }

  const dir = path.join(process.cwd(), "public", "uploads", "resume");
  const filename = `resume.pdf`;
  try {
    await mkdir(dir, { recursive: true });
    const buf = Buffer.from(await file.arrayBuffer());
    const header = buf.subarray(0, 5).toString("latin1");
    if (!header.startsWith("%PDF")) {
      return NextResponse.json({ error: "That file does not look like a PDF." }, { status: 400 });
    }
    await writeFile(path.join(dir, filename), buf);
  } catch {
    return NextResponse.json(
      { error: "Could not save the file on this host. Run the CMS locally to upload." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    url: `/uploads/resume/${filename}?v=${Date.now()}`,
    kind: "file",
  });
}
