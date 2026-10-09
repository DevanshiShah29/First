import type { ApiResponse } from "@/lib/api-response";

export interface UploadFileResponse {
  url: string;
  kind?: "image" | "video";
}

/**
 * Upload a CMS asset (hero, contact, memory, skill icon, or resume).
 * @example await uploadCmsFile(file, "hero") // { ok: true, data: { url, kind } }
 */
export async function uploadCmsFile(
  file: File,
  folder?: "hero" | "skills" | "memories" | "resume" | "artifacts" | "contact",
): Promise<ApiResponse<UploadFileResponse>> {
  try {
    const form = new FormData();
    form.append("file", file);
    if (folder) {
      form.append("folder", folder);
    }

    const res = await fetch("/api/cms/upload", {
      method: "POST",
      body: form,
    });

    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      url?: string;
      kind?: "image" | "video";
    };

    if (!res.ok || !body.url) {
      return {
        ok: false,
        error: body.error || "Upload failed.",
      };
    }

    return {
      ok: true,
      data: { url: body.url, kind: body.kind },
    };
  } catch {
    return {
      ok: false,
      error: "Upload failed due to a network error.",
    };
  }
}
