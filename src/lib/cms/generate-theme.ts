import type { ContentData } from "@/content/types";
import type { ApiResponse } from "@/lib/api-response";

export type GeneratedThemeResult = {
  name: string;
  description: string;
  brandFrom: string;
  brandTo: string;
  light: ContentData["theme"]["light"];
  dark: ContentData["theme"]["dark"];
};

/**
 * Generate a full light+dark theme palette from a mood prompt.
 * @example await generateThemePalette({ prompt: "warm vintage" })
 */
export async function generateThemePalette(input: {
  prompt: string;
  seedLight?: ContentData["theme"]["light"];
  seedDark?: ContentData["theme"]["dark"];
}): Promise<ApiResponse<GeneratedThemeResult>> {
  try {
    const res = await fetch("/api/cms/generate-theme", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      theme?: GeneratedThemeResult;
    };

    if (!res.ok || !body.theme) {
      return {
        ok: false,
        error: body.error || "Could not generate theme.",
      };
    }

    return { ok: true, data: body.theme };
  } catch {
    return {
      ok: false,
      error: "Could not generate theme. Network error.",
    };
  }
}

export type ImproveThemeResult = {
  issues: {
    id: string;
    field: keyof ContentData["theme"]["light"];
    message: string;
    current: string;
    suggested: string;
  }[];
  light: ContentData["theme"]["light"];
  dark: ContentData["theme"]["dark"];
  summary: string;
};

/**
 * Check/improve a theme palette via AI (+ local contrast fallback).
 * @example await improveThemePalette({ light, dark, mode: "light" })
 */
export async function improveThemePalette(input: {
  light: ContentData["theme"]["light"];
  dark: ContentData["theme"]["dark"];
  mode: "light" | "dark";
}): Promise<ApiResponse<ImproveThemeResult>> {
  try {
    const res = await fetch("/api/cms/improve-theme", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      issues?: ImproveThemeResult["issues"];
      light?: ContentData["theme"]["light"];
      dark?: ContentData["theme"]["dark"];
      summary?: string;
    };

    if (!res.ok || !body.light || !body.dark) {
      return {
        ok: false,
        error: body.error || "Could not check palette.",
      };
    }

    return {
      ok: true,
      data: {
        issues: Array.isArray(body.issues) ? body.issues : [],
        light: body.light,
        dark: body.dark,
        summary: body.summary || "Palette checked.",
      },
    };
  } catch {
    return {
      ok: false,
      error: "Could not check palette. Network error.",
    };
  }
}
