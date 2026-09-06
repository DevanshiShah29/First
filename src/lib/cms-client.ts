import type { ContentData } from "@/content/types";
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
}

export interface GenerateSkillsInput {
  siteTitle: string;
  siteRoles: string[];
  experienceStacks: string[];
  experienceSummaries: string[];
  existingGroups: ContentData["skills"];
  linkedin?: string;
  resume?: string;
}

export interface GenerateSkillsResult {
  groups: ContentData["skills"];
}

export interface GenerateTechnologiesResult {
  groups: NonNullable<ContentData["technologies"]>;
}

/**
 * Generate technology groups from portfolio signals.
 * @example await generateTechnologiesCopy(input) // { ok: true, data: { groups } }
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
      groups?: NonNullable<ContentData["technologies"]>;
    };

    if (!res.ok || !Array.isArray(body.groups) || body.groups.length === 0) {
      return {
        ok: false,
        error: body.error || "Could not generate technologies.",
      };
    }

    return {
      ok: true,
      data: { groups: body.groups },
    };
  } catch {
    return {
      ok: false,
      error: "Could not generate technologies. Network error.",
    };
  }
}

/**
 * Generate skill groups from resume, LinkedIn, and experience.
 * @example await generateSkillsCopy(input) // { ok: true, data: { groups } }
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
      groups?: ContentData["skills"];
    };

    if (!res.ok || !Array.isArray(body.groups) || body.groups.length === 0) {
      return {
        ok: false,
        error: body.error || "Could not generate skills.",
      };
    }

    return {
      ok: true,
      data: { groups: body.groups },
    };
  } catch {
    return {
      ok: false,
      error: "Could not generate skills. Network error.",
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
