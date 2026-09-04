import type { ContentData } from "@/content/types";

export type ApiResponse<T = void> =
  | ([T] extends [void]
      ? { ok: true; data?: undefined; error?: undefined }
      : { ok: true; data: T; error?: undefined })
  | { ok: false; error: string; data?: undefined };

export interface ContactMessageInput {
  name: string;
  email: string;
  message: string;
  company?: string;
}

export interface UploadFileResponse {
  url: string;
  kind?: "image" | "video";
}

/**
 * Submit contact form message to the backend endpoint.
 */
export async function sendContactMessage(input: ContactMessageInput): Promise<ApiResponse> {
  try {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const payload = (await res.json().catch(() => null)) as { error?: string } | null;

    if (!res.ok) {
      return {
        ok: false,
        error: payload?.error || "Could not send your message. Please email me directly.",
      };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Could not send your message. Please email me directly.",
    };
  }
}

/**
 * Authenticate CMS session.
 */
export async function cmsLogin(password: string): Promise<ApiResponse> {
  try {
    const res = await fetch("/api/cms/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const body = (await res.json().catch(() => ({}))) as { error?: string };

    if (!res.ok) {
      return {
        ok: false,
        error: body.error || "Could not log in.",
      };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Could not log in. Network error.",
    };
  }
}

/**
 * Destroy CMS session.
 */
export async function cmsLogout(): Promise<void> {
  await fetch("/api/cms/logout", { method: "POST" });
}

/**
 * Persist modified portfolio content to CMS backend.
 */
export async function saveCmsContent(content: ContentData): Promise<ApiResponse<{ content: ContentData }>> {
  try {
    const res = await fetch("/api/cms/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      content?: ContentData;
    };

    if (!res.ok) {
      return {
        ok: false,
        error: body.error || "Save failed.",
      };
    }

    return {
      ok: true,
      data: { content: body.content ?? content },
    };
  } catch {
    return {
      ok: false,
      error: "Save failed due to a network error.",
    };
  }
}

/**
 * Upload an asset (hero media, memory photo, skill icon, or resume) to the server.
 */
export async function uploadCmsFile(
  file: File,
  folder?: "hero" | "skills" | "memories" | "resume",
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
