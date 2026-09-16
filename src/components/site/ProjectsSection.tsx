"use client";

import { useLayoutEffect, useRef } from "react";
import type { ProjectItem } from "@/content/types";
import { NewTabHint } from "@/components/a11y";
import { Fade } from "@/components/Fade";
import { IconCode, IconExternal } from "@/components/icons";

/**
 * Renders the projects grid with GitHub/demo links.
 * @example <ProjectsSection projects={items} />
 */
export function ProjectsSection({ projects }: { projects: ProjectItem[] }) {
  const gridRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    /**
     * Sets every project card min-height to the tallest card so rows match.
     * @example equalize() // all cards share max height
     */
    const equalize = () => {
      const cards = [...grid.querySelectorAll<HTMLElement>(".project-card")];
      cards.forEach((card) => {
        card.style.minHeight = "";
      });
      const max = Math.max(0, ...cards.map((card) => card.getBoundingClientRect().height));
      if (max > 0) {
        cards.forEach((card) => {
          card.style.minHeight = `${max}px`;
        });
      }
    };

    equalize();
    const frame = requestAnimationFrame(equalize);
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(equalize);
    });
    observer.observe(grid);
    window.addEventListener("resize", equalize);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", equalize);
    };
  }, [projects]);

  return (
    <section id="projects" tabIndex={-1} aria-labelledby="projects-heading" className="py-16 sm:py-24">
      <div className="section-shell">
        <Fade y={24}>
          <h2 id="projects-heading" className="text-3xl font-semibold text-foreground sm:text-4xl">
            Projects
          </h2>
          <div className="accent-underline mt-3 h-1 w-28 rounded" />
        </Fade>
        <div ref={gridRef} className="mt-10 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
          {projects.map((project, i) => (
            <Fade key={project.id} y={28} delay={0.08 * (i % 3)} className="h-full">
              <article className="project-card card-surface card-lift group flex h-full flex-col rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-foreground">{project.name}</h3>
                <p className="mt-3 min-h-12 text-sm leading-6 text-muted">{project.blurb}</p>
                <div className="mt-auto pt-5">
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-brand/25 bg-brand/10 px-3 py-1 text-xs text-accent-text"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-6 flex items-center gap-3">
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted transition-colors hover:text-accent-text"
                    >
                      <IconCode />
                      GitHub
                      <span className="sr-only"> source for {project.name}</span>
                      <NewTabHint />
                    </a>
                    {project.demo ? (
                      <a
                        href={project.demo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-muted transition-colors hover:text-accent-text"
                      >
                        <IconExternal />
                        Live Demo
                        <span className="sr-only"> of {project.name}</span>
                        <NewTabHint />
                      </a>
                    ) : null}
                  </div>
                </div>
              </article>
            </Fade>
          ))}
        </div>
      </div>
    </section>
  );
}
