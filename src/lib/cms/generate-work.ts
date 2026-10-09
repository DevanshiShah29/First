import type { ContentData, SkillIcon } from "@/content/types";
import type { ApiResponse } from "@/lib/api-response";

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
