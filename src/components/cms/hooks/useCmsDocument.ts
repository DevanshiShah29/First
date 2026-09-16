"use client";

// External dependencies
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Application services & types
import type { ContentData } from "@/content/types";
import { saveCmsContent } from "@/lib/cms-client";
import { clone } from "../types";

/**
 * Owns CMS document state, dirty tracking, and save.
 * @example useCmsDocument(initial) // { data, setData, save, dirty }
 */
export function useCmsDocument(initial: ContentData) {
  const router = useRouter();
  const [data, setData] = useState(() => clone(initial));
  const [saved, setSaved] = useState(() => JSON.stringify(initial));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const savingRef = useRef(false);

  const dirty = useMemo(() => JSON.stringify(data) !== saved, [data, saved]);

  /**
   * Persists current CMS content to the server.
   * @example save() // void
   */
  const save = useCallback(async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setStatus("saving");
    setError("");
    try {
      const snapshot = clone(data);
      const res = await saveCmsContent(snapshot);
      if (!res.ok) {
        setStatus("error");
        setError(res.error || "Save failed.");
        return;
      }
      // Trust the payload we just saved — avoids waiting on a full content round-trip reshape.
      const next = clone(res.data?.content ?? snapshot);
      setData(next);
      setSaved(JSON.stringify(next));
      setStatus("saved");
      setNotice("Content updated.");
      // Refresh public RSC tree in the background; don't block the save UI on it.
      void router.refresh();
    } finally {
      savingRef.current = false;
    }
  }, [data, router]);

  useEffect(() => {
    /**
     * Saves on Cmd/Ctrl+S when the document is dirty.
     * @example onKey(event) // void
     */
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (dirty && !savingRef.current) void save();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dirty, save]);

  useEffect(() => {
    /**
     * Warns before unload when unsaved CMS edits exist.
     * @example onLeave(event) // void
     */
    function onLeave(e: BeforeUnloadEvent) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  return {
    data,
    setData,
    dirty,
    status,
    error,
    setError,
    notice,
    setNotice,
    save,
  };
}
