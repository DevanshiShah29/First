"use client";

import type { ReactNode } from "react";
import type { ContentData } from "@/content/types";
import { SkipLink } from "./a11y";
import { Cursor } from "./Cursor";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function PageShell({
  content,
  children,
}: {
  content: ContentData;
  children: ReactNode;
}) {
  const { site } = content;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Cursor />
      <SkipLink />
      <SiteHeader name={site.name} allowToggle={content.theme.allowToggle} />
      <main id="main-content" tabIndex={-1} className="w-full">
        {children}
      </main>
      <SiteFooter site={site} />
    </div>
  );
}
