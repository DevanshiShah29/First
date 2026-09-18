"use client";

// External dependencies
import { useState, type Dispatch, type SetStateAction } from "react";

// Application services & types
import type { ContentData, HeroMedia } from "@/content/types";
import { uploadCmsFile } from "@/lib/cms-client";

/**
 * Provides hero/memory/resume/skill upload helpers.
 * @example useCmsUploads(data, setData, setError, setNotice) // { uploading, uploadHeroFile }
 */
export function useCmsUploads(
  data: ContentData,
  setData: Dispatch<SetStateAction<ContentData>>,
  setError: (message: string) => void,
  setNotice: (message: string) => void,
) {
  const [uploading, setUploading] = useState(false);
  const site = data.site;

  /**
   * Merges a patch into site.heroMedia.
   * @example setHeroMedia({ kind: "image" }) // void
   */
  function setHeroMedia(patch: Partial<HeroMedia>) {
    setData({
      ...data,
      site: { ...site, heroMedia: { ...site.heroMedia, ...patch } },
    });
  }

  /**
   * Uploads a hero media file and stores its URL.
   * @example uploadHeroFile(file) // void
   */
  async function uploadHeroFile(file: File) {
    setUploading(true);
    setError("");
    const res = await uploadCmsFile(file, "hero");
    setUploading(false);
    if (!res.ok || !res.data?.url) {
      setError(res.error || "Upload failed.");
      return;
    }
    setHeroMedia({ url: res.data.url, kind: res.data.kind ?? "image" });
  }

  /**
   * Uploads a memory photo and attaches it by id.
   * @example uploadMemoryPhoto(file, id) // void
   */
  async function uploadMemoryPhoto(file: File, id: string) {
    setUploading(true);
    setError("");
    setNotice("");
    const res = await uploadCmsFile(file, "memories");
    setUploading(false);
    if (!res.ok || !res.data?.url) {
      setError(res.error || "Photo upload failed.");
      return;
    }
    const photoUrl = res.data.url;
    const memories = (data.memories ?? []).map((m) => (m.id === id ? { ...m, photoUrl } : m));
    setData({ ...data, memories });
    setNotice("Memory photo uploaded. Save changes to update.");
  }

  /**
   * Uploads a resume PDF/file into site.resume.
   * @example uploadResume(file) // void
   */
  async function uploadResume(file: File) {
    setUploading(true);
    setError("");
    setNotice("");
    const res = await uploadCmsFile(file, "resume");
    setUploading(false);
    if (!res.ok || !res.data?.url) {
      setError(res.error || "Resume upload failed.");
      return;
    }
    const resumeUrl = res.data.url;
    setData((current) => ({
      ...current,
      site: { ...current.site, resume: resumeUrl },
    }));
    setNotice("Resume uploaded. Save changes to publish the new file.");
  }

  /**
   * Uploads a skill/technology icon into a group item.
   * @example uploadSkillIcon(file, "skills", 0, 1) // void
   */
  async function uploadSkillIcon(
    file: File,
    kind: "skills" | "technologies",
    gi: number,
    ii: number,
  ) {
    setUploading(true);
    setError("");
    const res = await uploadCmsFile(file, "skills");
    setUploading(false);
    if (!res.ok || !res.data?.url) {
      setError(res.error || "Icon upload failed.");
      return;
    }
    const iconUrl = res.data.url;
    setData((current) => {
      const groups = [...(current[kind] ?? [])];
      const group = groups[gi];
      if (!group) return current;
      const items = [...group.items];
      if (!items[ii]) return current;
      items[ii] = { ...items[ii], iconUrl };
      groups[gi] = { ...group, items };
      return { ...current, [kind]: groups };
    });
  }

  /**
   * Uploads a shelf ornament image and attaches it by id.
   * @example uploadArtifactImage(file, id) // void
   */
  async function uploadArtifactImage(file: File, id: string) {
    setUploading(true);
    setError("");
    setNotice("");
    const res = await uploadCmsFile(file, "artifacts");
    setUploading(false);
    if (!res.ok || !res.data?.url) {
      setError(res.error || "Ornament upload failed.");
      return;
    }
    const imageUrl = res.data.url;
    const shelfArtifacts = (data.shelfArtifacts ?? []).map((item) =>
      item.id === id ? { ...item, imageUrl } : item,
    );
    setData({ ...data, shelfArtifacts });
    setNotice("Shelf ornament uploaded. Save changes to update.");
  }

  return {
    uploading,
    setHeroMedia,
    uploadHeroFile,
    uploadMemoryPhoto,
    uploadResume,
    uploadSkillIcon,
    uploadArtifactImage,
  };
}
