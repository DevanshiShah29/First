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
 * Request a CMS password-reset email to the admin address.
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
 * Complete CMS password reset with a one-time email token.
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
 * Change CMS login password (requires an active session).
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
 * Generate experience summary, bullets, and tags via Gemini (CMS auth required).
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
 * Generate project description and tags from GitHub / live URLs (CMS auth required).
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
 * Generate technology groups/items from portfolio signals (CMS auth required).
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
 * Generate skill groups/items from resume, LinkedIn, and experience (CMS auth required).
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
