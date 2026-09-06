import type { ProjectItem } from "@/content/types";
import { NewTabHint } from "@/components/a11y";
import { Fade } from "@/components/Fade";
import { IconCode, IconExternal } from "@/components/icons";

export function ProjectsSection({ projects }: { projects: ProjectItem[] }) {
  return (
    <section id="projects" tabIndex={-1} aria-labelledby="projects-heading" className="py-16 sm:py-24">
      <div className="section-shell">
        <Fade y={24}>
          <h2 id="projects-heading" className="text-3xl font-semibold text-foreground sm:text-4xl">
            Projects
          </h2>
          <div className="accent-underline mt-3 h-1 w-28 rounded" />
        </Fade>
        <div className="mt-10 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
          {projects.map((project, i) => (
            <Fade key={project.id} y={28} delay={0.08 * (i % 3)} className="h-full">
              <article className="card-surface group flex h-full flex-col rounded-2xl p-6 transition duration-300 hover:-translate-y-1">
                <h3 className="text-xl font-semibold text-foreground">{project.name}</h3>
                <p className="mt-3 text-sm leading-6 text-muted">{project.blurb}</p>
                <div className="mt-auto pt-5">
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-xs text-accent-text"
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
                      className="flex items-center gap-2 text-sm text-muted transition-colors hover:text-accent-hover"
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
                        className="flex items-center gap-2 text-sm text-muted transition-colors hover:text-accent-hover"
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
