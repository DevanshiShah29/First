import type { ApiResponse } from "@/lib/api-response";

export type HeroCopyVariant = {
  kicker: string;
  greeting: string;
  roles: string[];
  line: string;
};

/**
 * Generate 2–3 polished hero copy variants.
 * @example await generateHeroCopy({ greeting, line, roles, kicker })
 */
export async function generateHeroCopy(input: {
  kicker: string;
  greeting: string;
  roles: string[];
  line: string;
}): Promise<ApiResponse<{ variants: HeroCopyVariant[] }>> {
  try {
    const res = await fetch("/api/cms/generate-hero", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      variants?: HeroCopyVariant[];
    };
    if (!res.ok || !Array.isArray(body.variants) || body.variants.length < 2) {
      return { ok: false, error: body.error || "Could not generate hero copy." };
    }
    return { ok: true, data: { variants: body.variants } };
  } catch {
    return { ok: false, error: "Could not generate hero copy. Network error." };
  }
}

export type AboutCopyVariant = {
  about: string;
  philosophyKicker: string;
  philosophyTitle: string;
  philosophy: string;
  experienceIntro: string;
};

/**
 * Generate 2–3 About section packages.
 * @example await generateAboutCopy({ about, linkedin, resume, experienceSummaries })
 */
export async function generateAboutCopy(input: {
  about: string;
  philosophyKicker: string;
  philosophyTitle: string;
  philosophy: string;
  experienceIntro: string;
  experienceSummaries: string[];
  linkedin?: string;
  resume?: string;
}): Promise<ApiResponse<{ variants: AboutCopyVariant[] }>> {
  try {
    const res = await fetch("/api/cms/generate-about", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      variants?: AboutCopyVariant[];
    };
    if (!res.ok || !Array.isArray(body.variants) || body.variants.length < 2) {
      return { ok: false, error: body.error || "Could not generate about copy." };
    }
    return { ok: true, data: { variants: body.variants } };
  } catch {
    return { ok: false, error: "Could not generate about copy. Network error." };
  }
}

export type CraftPageVariant = {
  kicker: string;
  title: string;
  intro: string;
  footnote: string;
};

/**
 * Generate 2–3 Craft page copy packages.
 * @example await generateCraftPageCopy({ kicker, title, intro, footnote, siteName })
 */
export async function generateCraftPageCopy(input: {
  kicker: string;
  title: string;
  intro: string;
  footnote: string;
  siteName: string;
  siteRoles: string[];
  about: string;
}): Promise<ApiResponse<{ variants: CraftPageVariant[] }>> {
  try {
    const res = await fetch("/api/cms/generate-craft-page", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      variants?: CraftPageVariant[];
    };
    if (!res.ok || !Array.isArray(body.variants) || body.variants.length < 2) {
      return { ok: false, error: body.error || "Could not generate craft page copy." };
    }
    return { ok: true, data: { variants: body.variants } };
  } catch {
    return { ok: false, error: "Could not generate craft page copy. Network error." };
  }
}

export type CraftGroupVariant = {
  intro: string;
  items: { title: string; why: string }[];
};

/**
 * Generate 2–3 Craft group packages (intro + items).
 * @example await generateCraftGroupCopy({ groupTitle, groupIntro, items })
 */
export async function generateCraftGroupCopy(input: {
  groupTitle: string;
  groupIntro: string;
  items: { title: string; why: string }[];
  siteName: string;
  siteRoles: string[];
  about: string;
}): Promise<ApiResponse<{ variants: CraftGroupVariant[] }>> {
  try {
    const res = await fetch("/api/cms/generate-craft-group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      variants?: CraftGroupVariant[];
    };
    if (!res.ok || !Array.isArray(body.variants) || body.variants.length < 2) {
      return { ok: false, error: body.error || "Could not generate craft group copy." };
    }
    return { ok: true, data: { variants: body.variants } };
  } catch {
    return { ok: false, error: "Could not generate craft group copy. Network error." };
  }
}

export type MemoryCopyVariant = {
  title: string;
  note: string;
  category: string;
  color: string;
};

/**
 * Generate 2–3 Memory Jar entry packages.
 * @example await generateMemoryCopy({ title, note, category, date, color })
 */
export async function generateMemoryCopy(input: {
  title: string;
  note: string;
  category: string;
  date: string;
  color: string;
}): Promise<ApiResponse<{ variants: MemoryCopyVariant[] }>> {
  try {
    const res = await fetch("/api/cms/generate-memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      variants?: MemoryCopyVariant[];
    };
    if (!res.ok || !Array.isArray(body.variants) || body.variants.length < 2) {
      return { ok: false, error: body.error || "Could not generate memory copy." };
    }
    return { ok: true, data: { variants: body.variants } };
  } catch {
    return { ok: false, error: "Could not generate memory copy. Network error." };
  }
}
