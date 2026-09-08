"use client";

// External dependencies
import type { MouseEvent } from "react";

// Application services & types
import { EMPTY_CRAFT, toPublicContent, type ContentData } from "@/content/types";

// UI components
import { CraftView } from "@/components/craft/CraftView";
import { Hero } from "@/components/hero/Hero";
import { MemoryJarExperience } from "@/components/MemoryJarExperience";
import { AboutSection } from "@/components/site/AboutSection";
import { ContactSection } from "@/components/site/ContactSection";
import { ExperienceSection } from "@/components/site/ExperienceSection";
import { ProjectsSection } from "@/components/site/ProjectsSection";
import { SkillsSection } from "@/components/site/SkillsSection";
import { SiteHeader } from "@/components/SiteHeader";

import type { PreviewSection } from "./preview-messages";

/**
 * No-op for in-preview project CTA / hash links.
 * @example noopProjects(event) // prevented
 */
function noopProjects(e: MouseEvent<HTMLAnchorElement>) {
  e.preventDefault();
}

/**
 * Renders the public section matching a CMS preview key.
 * @example <SectionPreview section="hero" content={data} />
 */
export function SectionPreview({
  section,
  content,
}: {
  section: PreviewSection;
  content: ContentData;
}) {
  const publicContent = toPublicContent(content);
  const { site, experience, projects, skills, technologies, craft } = publicContent;

  switch (section) {
    case "hero":
      return (
        <div className="bg-background text-foreground">
          <Hero site={site} onProjects={noopProjects} />
        </div>
      );
    case "about":
      return (
        <div className="bg-background text-foreground">
          <AboutSection site={site} craft={craft} />
        </div>
      );
    case "experience":
      return (
        <div className="bg-background text-foreground">
          <ExperienceSection site={site} experience={experience} />
        </div>
      );
    case "projects":
      return (
        <div className="bg-background text-foreground">
          <ProjectsSection projects={projects} />
        </div>
      );
    case "skills":
      return (
        <div className="bg-background text-foreground">
          <SkillsSection skillGroups={skills} techGroups={technologies} />
        </div>
      );
    case "technologies":
      return (
        <div className="bg-background text-foreground">
          <SkillsSection skillGroups={skills} techGroups={technologies} />
        </div>
      );
    case "contact":
      return (
        <div className="bg-background text-foreground">
          <ContactSection site={site} />
        </div>
      );
    case "craft":
      return (
        <div className="min-h-full bg-background text-foreground">
          <CraftView craft={craft ?? EMPTY_CRAFT} showFooterLinks={false} />
        </div>
      );
    case "memories":
      return (
        <div className="min-h-full bg-background text-foreground">
          <MemoryJarExperience content={publicContent} />
        </div>
      );
    case "appearance":
      return (
        <div className="min-h-full bg-background text-foreground">
          <SiteHeader name={site.name} allowToggle={false} variant="home" />
          <Hero site={site} onProjects={noopProjects} />
          <AboutSection site={site} craft={craft} />
        </div>
      );
    default: {
      const _exhaustive: never = section;
      return _exhaustive;
    }
  }
}
