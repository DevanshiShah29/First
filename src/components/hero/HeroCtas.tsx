"use client";

// External dependencies
import type { MouseEvent } from "react";

// Application services & types
import { resumeDownloadProps } from "@/lib/resume";

// Icons
import { IconArrowRight, IconDownload } from "@/components/icons";

interface HeroCtasProps {
  resume: string;
  name: string;
  align?: "start" | "center";
  showProjects?: boolean;
  onProjects: (e: MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * Renders View Work + Resume CTAs.
 * @example <HeroCtas resume={url} name="Devanshi" onProjects={fn} />
 */
export function HeroCtas({
  resume,
  name,
  align = "start",
  showProjects = true,
  onProjects,
}: HeroCtasProps) {
  const download = resumeDownloadProps(resume, name);
  if (!showProjects && !download) return null;
  return (
    <div
      className={`mt-9 flex flex-col gap-4 sm:flex-row ${align === "center" ? "items-center justify-center" : ""}`}
    >
      {showProjects ? (
        <a
          href="#projects"
          onClick={onProjects}
          className="btn-primary inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-foreground hover:-translate-y-0.5"
        >
          View My Work
          <IconArrowRight />
        </a>
      ) : null}
      {download ? (
        <a
          href={download.href}
          download={download.download}
          target={download.target}
          rel={download.rel}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-line px-6 py-3 text-sm font-semibold text-foreground transition hover:border-brand/40 hover:text-accent-text"
        >
          Download Resume
          <IconDownload />
        </a>
      ) : null}
    </div>
  );
}
