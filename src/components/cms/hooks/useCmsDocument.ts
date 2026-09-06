"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ContentData } from "@/content/types";
import { saveCmsContent } from "@/lib/cms-client";
import { clone } from "../types";

export function useCmsDocument(initial: ContentData) {
  const router = useRouter();
  const [data, setData] = useState(() => clone(initial));
  const [saved, setSaved] = useState(() => JSON.stringify(initial));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [sectionState, setSectionState] = useState<Record<string, boolean>>({});

  const dirty = useMemo(() => JSON.stringify(data) !== saved, [data, saved]);

  const save = useCallback(async () => {
    setStatus("saving");
    setError("");
    const res = await saveCmsContent(data);
    if (!res.ok || !res.data?.content) {
      setStatus("error");
      setError(res.error || "Save failed.");
      return;
    }
    const next = clone(res.data.content);
    setData(next);
    setSaved(JSON.stringify(next));
    setStatus("saved");
    setNotice("Content updated.");
    router.refresh();
  }, [data, router]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (dirty) void save();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dirty, save]);

  useEffect(() => {
    function onLeave(e: BeforeUnloadEvent) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  function expandAll(ids: string[]) {
    setSectionState((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        next[id] = true;
        try {
          localStorage.setItem(`wp_metabox_${id}`, "true");
        } catch {
          // Ignore storage failures
        }
      });
      return next;
    });
  }

  function collapseAll(ids: string[]) {
    setSectionState((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        next[id] = false;
        try {
          localStorage.setItem(`wp_metabox_${id}`, "false");
        } catch {
          // Ignore storage failures
        }
      });
      return next;
    });
  }

  return {
    data,
    setData,
    dirty,
    status,
    error,
    setError,
    notice,
    setNotice,
    sectionState,
    expandAll,
    collapseAll,
    save,
  };
}
