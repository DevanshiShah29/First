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
import {
  readPreviewSummary,
  samePreviewSummary,
  type PreviewSeasonSummary,
  type PreviewViewport,
} from "./preview-summary";

/**
 * Posts live CMS draft into an isolated preview iframe and reports what it rendered.
 * @example <PreviewFrame content={data} section="hero" themeMode="dark" viewport="desktop" />
 */
export function PreviewFrame({
  content,
  section,
  themeMode,
  viewport,
  title,
  onRendered,
}: {
  content: ContentData;
  section: PreviewSection;
  themeMode: PreviewThemeMode;
  viewport: PreviewViewport;
  title: string;
  onRendered?: (summary: PreviewSeasonSummary) => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const readyRef = useRef(false);
  const observerRef = useRef<MutationObserver | null>(null);
  const frameRef = useRef(0);
  const lastSummaryRef = useRef<PreviewSeasonSummary | null>(null);
  const viewportRef = useRef(viewport);
  const onRenderedRef = useRef(onRendered);

  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

  useEffect(() => {
    onRenderedRef.current = onRendered;
  }, [onRendered]);

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

  /**
   * Watches the preview document for layout changes and reports the rendered summary.
   * @example startObserving() // void
   */
  const startObserving = useCallback(() => {
    if (!onRenderedRef.current) return;
    const doc = iframeRef.current?.contentDocument;
    if (!doc?.body) return;

    observerRef.current?.disconnect();
    if (frameRef.current) cancelAnimationFrame(frameRef.current);

    /**
     * Reads counts after mutations settle so a hidden row reports its final state.
     * @example collect() // onRendered(...)
     */
    const collect = () => {
      frameRef.current = 0;
      const next = readPreviewSummary(doc, viewportRef.current);
      if (!samePreviewSummary(lastSummaryRef.current, next)) {
        lastSummaryRef.current = next;
        onRenderedRef.current?.(next);
      }
    };

    const schedule = () => {
      if (frameRef.current) return;
      frameRef.current = requestAnimationFrame(collect);
    };

    const observer = new MutationObserver(schedule);
    observer.observe(doc.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        "data-season",
        "data-visible-count",
        "data-broken-count",
        "data-total-count",
        "data-position",
        "data-edges",
        "data-hidden-group-ids",
        "data-placement-visibility",
      ],
    });
    observerRef.current = observer;
    schedule();
  }, []);

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

  useEffect(
    () => () => {
      observerRef.current?.disconnect();
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  return (
    <iframe
      ref={iframeRef}
      className={`wp-live-frame is-${viewport}`}
      title={title}
      src="/admin/preview"
      onLoad={() => {
        readyRef.current = false;
        lastSummaryRef.current = null;
        iframeRef.current?.contentWindow?.postMessage(
          { type: CMS_PREVIEW_HELLO },
          window.location.origin,
        );
        postDraft();
        startObserving();
      }}
    />
  );
}
