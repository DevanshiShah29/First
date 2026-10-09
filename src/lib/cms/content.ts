import type { ContentData } from "@/content/types";
import type { ApiResponse } from "@/lib/api-response";

/**
 * Persist portfolio content to the CMS backend.
 * @example await saveCmsContent(content) // { ok: true, data: { content } }
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
