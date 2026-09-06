"use client";

// External dependencies
import type { ReactNode } from "react";

// Application services & types
import type { PublicContentData } from "@/content/types";

// UI components
import { SkipLink } from "./a11y";
import { Cursor } from "./Cursor";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

/**
 * Renders page chrome (header, footer, skip link) around children.
 * @example <PageShell content={data}>…</PageShell>
 */
export function PageShell({
  content,
  children,
}: {
  content: PublicContentData;
  children: ReactNode;
}) {
  const { site, craft } = content;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Cursor />
      <SkipLink />
      <SiteHeader name={site.name} allowToggle={content.theme.allowToggle} />
      <main id="main-content" tabIndex={-1} className="w-full">
        {children}
      </main>
      <SiteFooter site={site} craft={craft} />
    </div>
  );
}
