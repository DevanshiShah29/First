import type { ExperienceItem, PublicSiteContent } from "@/content/types";
import { Fade } from "@/components/Fade";

/**
 * Renders the experience timeline.
 * @example <ExperienceSection site={site} experience={jobs} />
 */
export function ExperienceSection({
  site,
  experience,
}: {
  site: PublicSiteContent;
  experience: ExperienceItem[];
}) {
  return (
    <section
      id="experience"
      tabIndex={-1}
      aria-labelledby="experience-heading"
      className="py-16 sm:py-24"
    >
      <div className="section-shell">
        <Fade y={24}>
          <h2 id="experience-heading" className="text-3xl font-semibold text-foreground sm:text-4xl">
            Experience
          </h2>
          <div className="accent-underline mt-3 h-1 w-28 rounded" />
          <p className="mt-4 max-w-2xl text-muted">{site.experienceIntro}</p>
        </Fade>
        <div className="relative mt-10 pl-8 sm:pl-12">
          <div className="timeline-line absolute bottom-0 left-3 top-0 w-px sm:left-4" />
          <div className="flex flex-col gap-6 sm:gap-8">
            {experience.map((job, i) => (
              <Fade key={job.id} y={24} delay={0.08 * Math.min(i, 3)} className="w-full">
                <article className="card-surface relative rounded-2xl p-6 transition duration-300 hover:-translate-y-1">
                  <span className="timeline-dot" />
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs uppercase tracking-kicker-tight text-accent-text">{job.when}</p>
                    {job.current ? (
                      <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-badge">
                        Current
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-2 text-2xl font-semibold text-foreground">{job.role}</h3>
                  <p className="company-grad mt-1 text-sm">{job.company}</p>
                  <p className="mt-4 leading-7 text-muted">{job.summary}</p>
                  <ul className="mt-4 list-disc space-y-2 pl-5">
                    {job.bullets.map((b) => (
                      <li key={b} className="text-sm text-muted">
                        {b}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {job.stack.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-line bg-chip px-3 py-1 text-xs text-muted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
              </Fade>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
