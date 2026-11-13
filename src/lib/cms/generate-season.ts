import type { SeasonPalette } from "@/content/seasons";
import type { ApiResponse } from "@/lib/api-response";

export type GeneratedSeasonLook = {
  palette: SeasonPalette;
};

/**
 * Restyles one season's palette.
 * @example await generateSeasonLook({ seasonId: "halloween", name: "Halloween", note: "", palette })
 */
export async function generateSeasonLook(input: {
  seasonId: string;
  name: string;
  note: string;
  palette: SeasonPalette;
}): Promise<ApiResponse<GeneratedSeasonLook>> {
  try {
    const res = await fetch("/api/cms/generate-season", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      palette?: SeasonPalette;
    };

    if (!res.ok || !body.palette) {
      return { ok: false, error: body.error || "Could not generate season colors." };
    }

    return { ok: true, data: { palette: body.palette } };
  } catch {
    return { ok: false, error: "Could not generate season colors. Network error." };
  }
}
