import type { ContentData, SkillIcon } from "@/content/types";
import type { ApiResponse } from "@/lib/api-response";

export interface UploadFileResponse {
  url: string;
  kind?: "image" | "video";
}

/**
 * Authenticate CMS session.
 * @example await cmsLogin("secret") // { ok: true }
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
 * @example await cmsLogout() // undefined
 */
export async function cmsLogout(): Promise<void> {
  await fetch("/api/cms/logout", { method: "POST" });
}

/**
 * Request a CMS password-reset email.
 * @example await cmsForgotPassword() // { ok: true, data: { message } }
 */
export async function cmsForgotPassword(): Promise<ApiResponse<{ message?: string }>> {
  try {
    const res = await fetch("/api/cms/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const body = (await res.json().catch(() => ({}))) as { error?: string; message?: string };

    if (!res.ok) {
      return {
        ok: false,
        error: body.error || "Could not send reset email.",
      };
    }

    return { ok: true, data: { message: body.message } };
  } catch {
    return {
      ok: false,
      error: "Could not send reset email. Network error.",
    };
  }
}

/**
 * Complete CMS password reset with a one-time token.
 * @example await cmsResetPassword({ token, newPassword, confirmPassword }) // { ok: true }
 */
export async function cmsResetPassword(input: {
  token: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<ApiResponse> {
  try {
    const res = await fetch("/api/cms/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const body = (await res.json().catch(() => ({}))) as { error?: string };

    if (!res.ok) {
      return {
        ok: false,
        error: body.error || "Could not reset password.",
      };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Could not reset password. Network error.",
    };
  }
}

/**
 * Change CMS login password (requires session).
 * @example await cmsChangePassword({ currentPassword, newPassword, confirmPassword }) // { ok: true }
 */
export async function cmsChangePassword(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<ApiResponse> {
  try {
    const res = await fetch("/api/cms/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const body = (await res.json().catch(() => ({}))) as { error?: string };

    if (!res.ok) {
      return {
        ok: false,
        error: body.error || "Could not change password.",
      };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Could not change password. Network error.",
    };
  }
}

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

export interface GenerateExperienceInput {
  role: string;
  company: string;
  when: string;
  current: boolean;
  existingSummary?: string;
  existingBullets?: string[];
  existingTags?: string[];
  linkedin?: string;
  resume?: string;
}

export interface GenerateExperienceResult {
  summary: string;
  bullets: string[];
  tags: string[];
}

/**
 * Generate experience summary, bullets, and tags via Gemini.
 * @example await generateExperienceCopy(input) // { ok: true, data: { summary, bullets, tags } }
 */
export async function generateExperienceCopy(
  input: GenerateExperienceInput,
): Promise<ApiResponse<GenerateExperienceResult>> {
  try {
    const res = await fetch("/api/cms/generate-experience", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      summary?: string;
      bullets?: string[];
      tags?: string[];
    };

    if (!res.ok || !body.summary || !Array.isArray(body.bullets) || !Array.isArray(body.tags)) {
      return {
        ok: false,
        error: body.error || "Could not generate copy.",
      };
    }

    return {
      ok: true,
      data: {
        summary: body.summary,
        bullets: body.bullets,
        tags: body.tags,
      },
    };
  } catch {
    return {
      ok: false,
      error: "Could not generate copy. Network error.",
    };
  }
}

export interface GenerateProjectInput {
  name: string;
  github: string;
  demo: string;
  existingBlurb?: string;
  existingTags?: string[];
}

export interface GenerateProjectResult {
  blurb: string;
  tags: string[];
}

/**
 * Generate project blurb and tags from GitHub/demo URLs.
 * @example await generateProjectCopy(input) // { ok: true, data: { blurb, tags } }
 */
export async function generateProjectCopy(
  input: GenerateProjectInput,
): Promise<ApiResponse<GenerateProjectResult>> {
  try {
    const res = await fetch("/api/cms/generate-project", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      blurb?: string;
      tags?: string[];
    };

    if (!res.ok || !body.blurb || !Array.isArray(body.tags)) {
      return {
        ok: false,
        error: body.error || "Could not generate copy.",
      };
    }

    return {
      ok: true,
      data: {
        blurb: body.blurb,
        tags: body.tags,
      },
    };
  } catch {
    return {
      ok: false,
      error: "Could not generate copy. Network error.",
    };
  }
}

export interface GenerateTechnologiesInput {
  siteTitle: string;
  siteRoles: string[];
  experienceStacks: string[];
  projectTags: string[];
  existingGroups: ContentData["technologies"];
  linkedin?: string;
  resume?: string;
  excludeNames?: string[];
}

export interface GenerateSkillsInput {
  siteTitle: string;
  siteRoles: string[];
  experienceStacks: string[];
  experienceSummaries: string[];
  existingGroups: ContentData["skills"];
  linkedin?: string;
  resume?: string;
  excludeNames?: string[];
}

export type SkillOrTechSuggestion = {
  name: string;
  groupTitle: string;
  icon: SkillIcon;
  color?: string;
  isNewGroup: boolean;
};

export interface GenerateSkillsResult {
  suggestion: SkillOrTechSuggestion;
}

export interface GenerateTechnologiesResult {
  suggestion: SkillOrTechSuggestion;
}

/**
 * Suggest one technology to append from portfolio signals.
 * @example await generateTechnologiesCopy(input) // { ok: true, data: { suggestion } }
 */
export async function generateTechnologiesCopy(
  input: GenerateTechnologiesInput,
): Promise<ApiResponse<GenerateTechnologiesResult>> {
  try {
    const res = await fetch("/api/cms/generate-technologies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      suggestion?: SkillOrTechSuggestion;
    };

    if (!res.ok || !body.suggestion?.name || !body.suggestion.groupTitle) {
      return {
        ok: false,
        error: body.error || "Could not generate technologies.",
      };
    }

    return {
      ok: true,
      data: { suggestion: body.suggestion },
    };
  } catch {
    return {
      ok: false,
      error: "Could not generate technologies. Network error.",
    };
  }
}

/**
 * Suggest one skill to append from resume, LinkedIn, and experience.
 * @example await generateSkillsCopy(input) // { ok: true, data: { suggestion } }
 */
export async function generateSkillsCopy(
  input: GenerateSkillsInput,
): Promise<ApiResponse<GenerateSkillsResult>> {
  try {
    const res = await fetch("/api/cms/generate-skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      suggestion?: SkillOrTechSuggestion;
    };

    if (!res.ok || !body.suggestion?.name || !body.suggestion.groupTitle) {
      return {
        ok: false,
        error: body.error || "Could not generate skills.",
      };
    }

    return {
      ok: true,
      data: { suggestion: body.suggestion },
    };
  } catch {
    return {
      ok: false,
      error: "Could not generate skills. Network error.",
    };
  }
}

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

export type CmsAnalyticsReport = {
  days: number;
  summary: {
    pageViews: number;
    uniqueVisitors: number;
    todayViews: number;
    todayVisitors: number;
  };
  topPages: { path: string; views: number }[];
  daily: { date: string; views: number; visitors: number }[];
  recentVisitors: {
    id: string;
    firstSeenAt: string;
    lastSeenAt: string;
    viewCount: number;
    userAgent: string;
    recentPaths: { path: string; createdAt: string }[];
  }[];
};

/**
 * Load CMS analytics (visitors + page views) for the last N days.
 * @example await fetchCmsAnalytics(30) // { ok: true, data: { report } }
 */
export async function fetchCmsAnalytics(
  days = 30,
): Promise<ApiResponse<{ report: CmsAnalyticsReport }>> {
  try {
    const res = await fetch(`/api/cms/analytics?days=${encodeURIComponent(String(days))}`, {
      method: "GET",
      credentials: "same-origin",
    });
    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      report?: CmsAnalyticsReport;
    };
    if (!res.ok || !body.report) {
      return {
        ok: false,
        error: body.error || "Could not load analytics.",
      };
    }
    return { ok: true, data: { report: body.report } };
  } catch {
    return {
      ok: false,
      error: "Could not load analytics. Network error.",
    };
  }
}

/**
 * Upload a CMS asset (hero, memory, skill icon, or resume).
 * @example await uploadCmsFile(file, "hero") // { ok: true, data: { url, kind } }
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
