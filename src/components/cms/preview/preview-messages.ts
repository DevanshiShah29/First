import type { ContentData } from "@/content/types";

export const CMS_PREVIEW_MESSAGE = "cms-preview" as const;
export const CMS_PREVIEW_READY = "cms-preview-ready" as const;
export const CMS_PREVIEW_HELLO = "cms-preview-hello" as const;

export type PreviewSection =
  | "hero"
  | "about"
  | "experience"
  | "projects"
  | "skills"
  | "technologies"
  | "contact"
  | "craft"
  | "memories"
  | "appearance";

export type PreviewThemeMode = "light" | "dark";

export type CmsPreviewPayload = {
  type: typeof CMS_PREVIEW_MESSAGE;
  content: ContentData;
  themeMode: PreviewThemeMode;
  section: PreviewSection;
};

export type CmsPreviewReadyPayload = {
  type: typeof CMS_PREVIEW_READY;
};

export type CmsPreviewHelloPayload = {
  type: typeof CMS_PREVIEW_HELLO;
};

/**
 * Type guard for parent→iframe hello pings.
 * @example isCmsPreviewHello(event.data) // true
 */
export function isCmsPreviewHello(value: unknown): value is CmsPreviewHelloPayload {
  return Boolean(
    value && typeof value === "object" && (value as { type?: string }).type === CMS_PREVIEW_HELLO,
  );
}

/**
 * Type guard for CMS preview draft messages.
 * @example isCmsPreviewPayload(event.data) // true
 */
export function isCmsPreviewPayload(value: unknown): value is CmsPreviewPayload {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    v.type === CMS_PREVIEW_MESSAGE &&
    typeof v.themeMode === "string" &&
    (v.themeMode === "light" || v.themeMode === "dark") &&
    typeof v.section === "string" &&
    Boolean(v.content) &&
    typeof v.content === "object"
  );
}

/**
 * Type guard for preview-frame ready handshake.
 * @example isCmsPreviewReady(event.data) // true
 */
export function isCmsPreviewReady(value: unknown): value is CmsPreviewReadyPayload {
  return Boolean(value && typeof value === "object" && (value as { type?: string }).type === CMS_PREVIEW_READY);
}
