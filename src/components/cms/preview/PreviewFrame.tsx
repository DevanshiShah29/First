"use client";

// External dependencies
import { useCallback, useEffect, useRef } from "react";

// Application services & types
import type { ContentData } from "@/content/types";
import {
  CMS_PREVIEW_HELLO,
  CMS_PREVIEW_MESSAGE,
  isCmsPreviewReady,
  type PreviewSection,
  type PreviewThemeMode,
} from "./preview-messages";

/**
 * Posts live CMS draft into an isolated preview iframe.
 * @example <PreviewFrame content={data} section="hero" themeMode="dark" />
 */
export function PreviewFrame({
  content,
  section,
  themeMode,
  viewport,
  title,
}: {
  content: ContentData;
  section: PreviewSection;
  themeMode: PreviewThemeMode;
  viewport: "desktop" | "mobile";
  title: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const readyRef = useRef(false);

  /**
   * Sends the current draft payload to the preview iframe.
   * @example postDraft() // void
   */
  const postDraft = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win || !readyRef.current) return;
    win.postMessage(
      {
        type: CMS_PREVIEW_MESSAGE,
        content,
        themeMode,
        section,
      },
      window.location.origin,
    );
  }, [content, section, themeMode]);

  useEffect(() => {
    /**
     * Marks the iframe ready after the handshake, then posts draft.
     * @example onMessage(event) // void
     */
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (!isCmsPreviewReady(event.data)) return;
      readyRef.current = true;
      postDraft();
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [postDraft]);

  useEffect(() => {
    postDraft();
  }, [postDraft]);

  return (
    <iframe
      ref={iframeRef}
      className={`wp-live-frame is-${viewport}`}
      title={title}
      src="/admin/preview"
      onLoad={() => {
        readyRef.current = false;
        iframeRef.current?.contentWindow?.postMessage(
          { type: CMS_PREVIEW_HELLO },
          window.location.origin,
        );
        postDraft();
      }}
    />
  );
}
