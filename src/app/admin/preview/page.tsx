"use client";

// External dependencies
import { useEffect, useState } from "react";
import { Cormorant_Garamond, Space_Mono, Waiting_for_the_Sunrise } from "next/font/google";

// Application services & types
import type { ContentData } from "@/content/types";
import { themeCss } from "@/lib/theme";
import {
  CMS_PREVIEW_READY,
  isCmsPreviewHello,
  isCmsPreviewPayload,
  type PreviewSection,
  type PreviewThemeMode,
} from "@/components/cms/preview/preview-messages";
import { SectionPreview } from "@/components/cms/preview/sectionPreviews";

import "@/app/memory-jar/jar-of-stars.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

const sunrise = Waiting_for_the_Sunrise({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-sunrise",
  display: "swap",
  fallback: ["cursive"],
  adjustFontFallback: false,
});

type PreviewState = {
  content: ContentData;
  themeMode: PreviewThemeMode;
  section: PreviewSection;
};

/**
 * Isolated CMS live-preview host (loaded inside PreviewFrame iframes).
 * @example default export for /admin/preview
 */
export default function AdminPreviewPage() {
  const [preview, setPreview] = useState<PreviewState | null>(null);

  useEffect(() => {
    /**
     * Announces readiness to the parent CMS frame.
     * @example announceReady() // void
     */
    function announceReady() {
      window.parent.postMessage({ type: CMS_PREVIEW_READY }, window.location.origin);
    }

    /**
     * Applies draft content + theme from the parent CMS frame.
     * @example onMessage(event) // void
     */
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (isCmsPreviewHello(event.data)) {
        announceReady();
        return;
      }
      if (!isCmsPreviewPayload(event.data)) return;
      const { content, themeMode, section } = event.data;
      document.documentElement.setAttribute("data-theme", themeMode);
      document.documentElement.classList.add("cms-live-preview");
      setPreview({ content, themeMode, section });
    }

    window.addEventListener("message", onMessage);
    announceReady();
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (!preview) return;
    document.documentElement.setAttribute("data-theme", preview.themeMode);
  }, [preview]);

  const jarFonts =
    preview?.section === "memories"
      ? `${cormorant.variable} ${spaceMono.variable} ${sunrise.variable}`
      : "";

  return (
    <div className={`cms-live-preview min-h-full bg-background text-foreground ${jarFonts}`.trim()}>
      {preview ? (
        <>
          <style dangerouslySetInnerHTML={{ __html: themeCss(preview.content.theme) }} />
          <main id="cms-preview-main" tabIndex={-1}>
            <SectionPreview section={preview.section} content={preview.content} />
          </main>
        </>
      ) : (
        <p className="p-6 text-sm text-muted">Waiting for preview data…</p>
      )}
    </div>
  );
}
