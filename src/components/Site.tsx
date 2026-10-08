"use client";

// External dependencies
import { useEffect, type MouseEvent } from "react";

// Application services & types
import { sectionEnabled, type PublicContentData } from "@/content/types";
import { useReducedMotion } from "@/hooks/reduced-motion";
import { scrollToHash } from "@/lib/scroll";

// UI components
import { SkipLink } from "./a11y";
import { Cursor } from "./Cursor";
import { Hero } from "./hero/Hero";
import { AboutSection } from "./site/AboutSection";
import { ContactSection } from "./site/ContactSection";
import { ExperienceSection } from "./site/ExperienceSection";
import { ProjectsSection } from "./site/ProjectsSection";
import { SkillsSection } from "./site/SkillsSection";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

/**
 * Renders the full public homepage from CMS content.
 * @example <Site content={data} />
 */
export function Site({ content }: { content: PublicContentData }) {
  const {
    site,
    experience,
    projects,
    skills: skillGroups = [],
    technologies: techGroups = [],
    craft,
  } = content;
  const reduce = useReducedMotion();
  const sections = site.sections;
  const showSkills = sectionEnabled(sections, "skills");
  const showTechnologies = sectionEnabled(sections, "technologies");

  useEffect(() => {
    if (!window.location.hash) return;
    const id = window.location.hash;
    const t = window.setTimeout(() => scrollToHash(id, Boolean(reduce)), 50);
    return () => window.clearTimeout(t);
  }, [reduce]);

  useEffect(() => {
    const revealElements = document.querySelectorAll(".rv");
    if (!revealElements.length) return;

    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("vis");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -24px 0px" },
    );

    revealElements.forEach((el) => revealObserver.observe(el));

    return () => {
      revealObserver.disconnect();
    };
  }, []);

  /**
   * Smooth-scrolls homepage section anchors.
   * @example onSectionLink(event, "#projects") // scrolled
   */
  function onSectionLink(e: MouseEvent<HTMLAnchorElement>, href: string) {
    if (!href.startsWith("#")) return;
    e.preventDefault();
    scrollToHash(href, Boolean(reduce));
    history.replaceState(null, "", href);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Cursor />
      <SkipLink />
      <SiteHeader
        name={site.name}
        site={site}
        craft={craft}
        allowToggle={content.theme.allowToggle}
        variant="home"
      />

      <main id="main-content" tabIndex={-1}>
        {sectionEnabled(sections, "hero") ? (
          <Hero site={site} onProjects={(e) => onSectionLink(e, "#projects")} />
        ) : null}
        {sectionEnabled(sections, "about") ? <AboutSection site={site} craft={craft} /> : null}
        {sectionEnabled(sections, "experience") ? (
          <ExperienceSection site={site} experience={experience} />
        ) : null}
        {sectionEnabled(sections, "projects") ? <ProjectsSection projects={projects} /> : null}
        {showSkills || showTechnologies ? (
          <SkillsSection
            skillGroups={showSkills ? skillGroups : []}
            techGroups={showTechnologies ? techGroups : []}
          />
        ) : null}
        {sectionEnabled(sections, "contact") ? <ContactSection site={site} /> : null}
      </main>

      <SiteFooter
        site={site}
        craft={craft}
        onNavigate={(e, href) => {
          if (href === "/") {
            onSectionLink(e, "#top");
            return;
          }
          if (href.startsWith("/#")) onSectionLink(e, href.slice(1));
        }}
      />
    </div>
  );
}
