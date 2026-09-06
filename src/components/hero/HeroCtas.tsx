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
  onProjects: (e: MouseEvent<HTMLAnchorElement>) => void;
}

export function HeroCtas({
  resume,
  name,
  align = "start",
  onProjects,
}: HeroCtasProps) {
  const download = resumeDownloadProps(resume, name);
  return (
    <div
      className={`mt-9 flex flex-col gap-4 sm:flex-row ${align === "center" ? "items-center justify-center" : ""}`}
    >
      <a
        href="#projects"
        onClick={onProjects}
        className="btn-primary inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-foreground hover:-translate-y-0.5"
      >
        View My Work
        <IconArrowRight />
      </a>
      {download ? (
        <a
          href={download.href}
          download={download.download}
          target={download.target}
          rel={download.rel}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-line px-6 py-3 text-sm font-semibold text-foreground transition hover:border-violet-500/40 hover:text-accent-text"
        >
          Download Resume
          <IconDownload />
        </a>
      ) : null}
    </div>
  );
}
