import type { ApiResponse } from "@/lib/api-response";

export interface ContactMessageInput {
  name: string;
  email: string;
  message: string;
  company?: string;
}

/**
 * Submit contact form message to the public API.
 * @example await sendContactMessage({ name, email, message }) // { ok: true }
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
