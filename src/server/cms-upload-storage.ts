import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";

export type UploadFolder = "hero" | "skills" | "memories" | "resume" | "artifacts";

export type StoredUpload = {
  /** Public URL (blob CDN or same-origin /uploads/...). */
  url: string;
};

/**
 * Reads BLOB_READ_WRITE_TOKEN from env.
 * @example blobToken() // "vercel_blob_…" | ""
 */
function blobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN?.trim() || "";
}

/**
 * True when uploads should go to Vercel Blob.
 * @example usesBlobStorage() // true
 */
export function usesBlobStorage() {
  return Boolean(blobToken());
}

/**
 * Persists a CMS upload to Blob or local public/uploads.
 * @example await storeCmsUpload({…}) // { url }
 */
export async function storeCmsUpload(input: {
  folder: UploadFolder;
  filename: string;
  body: Buffer;
  contentType: string;
  /** Overwrite existing blob/file at the same pathname (resume.pdf). */
  allowOverwrite?: boolean;
}): Promise<StoredUpload> {
  const { folder, filename, body, contentType, allowOverwrite = false } = input;
  const objectPath = `uploads/${folder}/${filename}`;
  const token = blobToken();

  if (token) {
    const blob = await put(objectPath, body, {
      access: "public",
      token,
      contentType,
      addRandomSuffix: false,
      allowOverwrite,
    });
    return { url: blob.url };
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is required for CMS uploads in production.",
    );
  }

  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), body);
  return { url: `/${objectPath}` };
}
