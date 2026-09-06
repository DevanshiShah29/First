"use client";

// External dependencies
import { useState, type Dispatch, type SetStateAction } from "react";

// Application services & types
import type { ContentData, HeroMedia } from "@/content/types";
import { uploadCmsFile } from "@/lib/cms-client";

export function useCmsUploads(
  data: ContentData,
  setData: Dispatch<SetStateAction<ContentData>>,
  setError: (message: string) => void,
  setNotice: (message: string) => void,
) {
  const [uploading, setUploading] = useState(false);
  const site = data.site;

  function setHeroMedia(patch: Partial<HeroMedia>) {
    setData({
      ...data,
      site: { ...site, heroMedia: { ...site.heroMedia, ...patch } },
    });
  }

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

  return {
    uploading,
    setHeroMedia,
    uploadHeroFile,
    uploadMemoryPhoto,
    uploadResume,
    uploadSkillIcon,
  };
}
