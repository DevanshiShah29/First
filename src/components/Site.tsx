"use client";

import { useEffect, useState, type FormEvent, type MouseEvent, type ReactNode } from "react";
import { useReducedMotion } from "@/lib/reduced-motion";
import type { ContentData } from "@/content/types";
import { resumeDownloadProps } from "@/lib/resume";
import { scrollToHash } from "@/lib/scroll";
import { NewTabHint, SkipLink } from "./a11y";
import { ContactScene } from "./ContactScene";
import { Cursor } from "./Cursor";
import { Fade } from "./Fade";
import { Hero } from "./hero/Hero";
import {
  IconCode,
  IconDownload,
  IconExternal,
  IconGitHub,
  IconLinkedIn,
  IconMail,
  SkillMark,
} from "./icons";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { sendContactMessage } from "@/lib/api-client";

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-line bg-inset px-4 py-3 text-sm text-foreground transition focus-visible:border-violet-500/60";

function CountUp({ value, suffix }: { value: number; suffix: string }) {
  return (
    <span>
      {value}
      {suffix}
    </span>
  );
}

function SocialRound({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="icon-btn rounded-full border border-line bg-chip p-3 transition-all duration-300 hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-accent-hover"
      aria-label={label}
    >
      {children}
      {external ? <NewTabHint /> : null}
    </a>
  );
}

export function Site({ content }: { content: ContentData }) {
  const { site, experience, projects, skills: skillGroups = [], technologies: techGroups = [] } = content;
  const reduce = useReducedMotion();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [formError, setFormError] = useState("");
  const resume = resumeDownloadProps(site.resume, site.name);

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

  function onSectionLink(e: MouseEvent<HTMLAnchorElement>, href: string) {
    if (!href.startsWith("#")) return;
    e.preventDefault();
    scrollToHash(href, Boolean(reduce));
    history.replaceState(null, "", href);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    setFormError("");
    const result = await sendContactMessage({
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      message: String(data.get("message") ?? ""),
      company: String(data.get("company") ?? ""),
    });
    if (!result.ok) {
      setStatus("error");
      setFormError(result.error || "Could not send your message. Please email me directly.");
      return;
    }
    form.reset();
    setStatus("sent");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Cursor />
      <SkipLink />
      <SiteHeader name={site.name} allowToggle={content.theme.allowToggle} variant="home" />

      <main id="main-content" tabIndex={-1}>
        <Hero site={site} onProjects={(e) => onSectionLink(e, "#projects")} />

        <section id="about" tabIndex={-1} aria-labelledby="about-heading" className="py-16 sm:py-24">
          <div className="section-shell">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
              <div>
                <Fade y={24}>
                  <h2 id="about-heading" className="text-3xl font-semibold text-foreground sm:text-4xl">
                    About Me
                  </h2>
                  <div className="accent-underline mt-3 h-1 w-24 rounded" />
                  <p className="mt-6 text-base leading-8 text-muted">{site.about}</p>
                </Fade>
                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {site.stats.map((stat, i) => (
                    <Fade key={stat.label} y={18} delay={0.08 * i}>
                      <div className="card-surface rounded-xl p-4">
                        <p className="text-2xl font-semibold text-foreground">
                          <CountUp value={stat.value} suffix={stat.suffix} />
                        </p>
                        <p className="mt-1 text-sm text-muted">{stat.label}</p>
                      </div>
                    </Fade>
                  ))}
                </div>
              </div>
              <Fade y={28} delay={0.12}>
                <div className="card-surface relative rounded-2xl p-8">
                  <div className="philosophy-wash absolute inset-0 rounded-2xl" />
                  <div className="relative">
                    <p className="kicker text-muted-soft">
                      {site.philosophyKicker}
                    </p>
                    <h3 className="mt-4 text-2xl font-semibold text-foreground">
                      {site.philosophyTitle}
                    </h3>
                    <p className="mt-4 leading-7 text-muted">{site.philosophy}</p>
                  </div>
                </div>
              </Fade>
            </div>
          </div>
        </section>

        <section id="experience" tabIndex={-1} aria-labelledby="experience-heading" className="py-16 sm:py-24">
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
                          <span className="sr-only">
                            {" "}
                            source for {project.name}
                          </span>
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
                            <span className="sr-only">
                              {" "}
                              of {project.name}
                            </span>
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

        <section id="skills" tabIndex={-1} aria-labelledby="skills-heading" className="py-16 sm:py-24">
          <div className="section-shell">
            <Fade y={24}>
              <h2 id="skills-heading" className="text-3xl font-semibold text-foreground sm:text-4xl">
                Skills &amp; Technologies
              </h2>
              <div className="accent-underline mt-3 h-1 w-48 rounded" />
            </Fade>
            <div className="mt-10 grid gap-8 lg:grid-cols-2">
              {[...techGroups, ...skillGroups].map((group, gi) => (
                <Fade key={`${group.title}-${gi}`} y={22} delay={0.08 * (gi % 2)}>
                  <div className="skill-group-card card-surface rounded-2xl p-6">
                    <h3 className="text-xl font-semibold text-foreground">{group.title}</h3>
                    <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                      {group.items.map((item) => (
                        <div
                          key={item.name}
                          className="skill-tile flex flex-col items-center gap-2 rounded-xl border border-line bg-chip p-4 text-muted"
                        >
                          <SkillMark
                            icon={item.icon}
                            color={item.color}
                            src={item.iconUrl}
                            className="skill-mark"
                          />
                          <span className="text-center text-xs font-medium text-foreground">
                            {item.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Fade>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" tabIndex={-1} aria-labelledby="contact-heading" className="py-16 sm:py-24">
          <div className="section-shell">
            <Fade y={28} duration={0.65}>
              <div className="card-surface contact-grid rounded-2xl p-6 sm:p-8">
                <div>
                  <h2 id="contact-heading" className="text-3xl font-semibold text-foreground sm:text-4xl">
                    Let&apos;s Work Together
                  </h2>
                  <p className="mt-3 text-muted">{site.contactLine}</p>
                  <form className="relative mt-8 space-y-4" action="/api/contact" method="post" onSubmit={onSubmit}>
                    <div className="sr-only" aria-hidden="true">
                      <label htmlFor="contact-company">Company</label>
                      <input
                        id="contact-company"
                        type="text"
                        name="company"
                        tabIndex={-1}
                        autoComplete="off"
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-name" className="text-sm font-medium text-foreground">
                        Name
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        name="name"
                        required
                        maxLength={100}
                        autoComplete="name"
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-email" className="text-sm font-medium text-foreground">
                        Email
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        name="email"
                        required
                        maxLength={254}
                        autoComplete="email"
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-message" className="text-sm font-medium text-foreground">
                        Message
                      </label>
                      <textarea
                        id="contact-message"
                        name="message"
                        rows={5}
                        required
                        maxLength={4000}
                        className={`${fieldClass} resize-none`}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={status === "sending"}
                      className="btn-primary inline-flex items-center rounded-lg px-5 py-3 text-sm font-semibold text-foreground hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                      {status === "sending" ? "Sending…" : "Send Message"}
                    </button>
                    <p
                      role="status"
                      aria-live="polite"
                      className={`text-sm ${status === "error" ? "text-red-500" : "text-muted"}`}
                    >
                      {status === "sent"
                        ? "Thanks — your message is on its way."
                        : status === "error"
                          ? formError
                          : ""}
                    </p>
                  </form>
                </div>
                <div className="flex min-h-96 flex-col overflow-hidden rounded-xl border border-line bg-inset">
                  <ContactScene />
                  <div className="flex flex-1 flex-col justify-end p-6 pt-1">
                    <p className="kicker text-muted-soft">Contact</p>
                    <a
                      href={`mailto:${site.email}`}
                      className="mt-4 block text-foreground transition hover:text-accent-text"
                    >
                      {site.email}
                    </a>
                    <div className="mt-6 flex items-center gap-3">
                      <SocialRound href={site.linkedin} label="LinkedIn profile">
                        <IconLinkedIn />
                      </SocialRound>
                      <SocialRound href={site.github} label="GitHub profile">
                        <IconGitHub />
                      </SocialRound>
                      <SocialRound href={`mailto:${site.email}`} label="Email contact">
                        <IconMail />
                      </SocialRound>
                    </div>
                    {resume ? (
                      <a
                        href={resume.href}
                        download={resume.download}
                        target={resume.target}
                        rel={resume.rel}
                        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-chip px-5 py-3 text-sm font-semibold text-foreground transition hover:border-violet-500/40 hover:text-accent-text"
                      >
                       Resume
                        <IconDownload />
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            </Fade>
          </div>
        </section>
      </main>

      <SiteFooter
        site={site}
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
