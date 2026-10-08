"use client";

// External dependencies
import type { MouseEvent } from "react";

// Application services & types
import {
  EMPTY_CRAFT,
  isPublished,
  sectionEnabled,
  toPublicContent,
  type ContentData,
  type SiteSectionId,
} from "@/content/types";

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
 * Tells the editor a section is saved as hidden on the public site.
 * @example <HiddenBanner label="Hero" />
 */
function HiddenBanner({ label }: { label: string }) {
  return (
    <p className="bg-chip px-4 py-2 text-center text-xs text-muted">
      {label} is hidden on the live site. Turn it on from the Dashboard, then save.
    </p>
  );
}

/**
 * True when this preview's section is turned off.
 * @example isHidden(data, "hero") // false
 */
function isHidden(content: ContentData, id: SiteSectionId) {
  return !sectionEnabled(content.site.sections, id);
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
          {isHidden(content, "hero") ? <HiddenBanner label="Hero" /> : null}
          <Hero site={site} onProjects={noopProjects} />
        </div>
      );
    case "about":
      return (
        <div className="bg-background text-foreground">
          {isHidden(content, "about") ? <HiddenBanner label="About" /> : null}
          <AboutSection site={site} craft={craft} />
        </div>
      );
    case "experience":
      return (
        <div className="bg-background text-foreground">
          {isHidden(content, "experience") ? <HiddenBanner label="Experience" /> : null}
          <ExperienceSection site={site} experience={experience} />
        </div>
      );
    case "projects":
      return (
        <div className="bg-background text-foreground">
          {isHidden(content, "projects") ? <HiddenBanner label="Projects" /> : null}
          <ProjectsSection projects={projects} />
        </div>
      );
    case "skills":
      return (
        <div className="bg-background text-foreground">
          {isHidden(content, "skills") ? <HiddenBanner label="Skills" /> : null}
          <SkillsSection skillGroups={skills} techGroups={technologies} />
        </div>
      );
    case "technologies":
      return (
        <div className="bg-background text-foreground">
          {isHidden(content, "technologies") ? <HiddenBanner label="Technologies" /> : null}
          <SkillsSection skillGroups={skills} techGroups={technologies} />
        </div>
      );
    case "contact":
      return (
        <div className="bg-background text-foreground">
          {isHidden(content, "contact") ? <HiddenBanner label="Contact" /> : null}
          <ContactSection site={site} />
        </div>
      );
    case "craft":
      if (content.craft && !isPublished(content.craft.status)) {
        return (
          <div className="min-h-full bg-background p-8 text-foreground">
            <p className="text-sm text-muted">
              This page is a draft. It is hidden on the public site, including navigation, until you publish it.
            </p>
          </div>
        );
      }
      return (
        <div className="min-h-full bg-background text-foreground">
          {isHidden(content, "craft") ? <HiddenBanner label="Craft" /> : null}
          <CraftView craft={craft ?? EMPTY_CRAFT} showFooterLinks={false} />
        </div>
      );
    case "memories":
      return (
        <div className="min-h-full bg-background text-foreground">
          {isHidden(content, "memories") ? <HiddenBanner label="Memories" /> : null}
          <MemoryJarExperience content={publicContent} />
        </div>
      );
    case "appearance":
      return (
        <div className="min-h-full bg-background text-foreground">
          <SiteHeader
            name={site.name}
            site={site}
            craft={craft}
            allowToggle={false}
            variant="home"
          />
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
