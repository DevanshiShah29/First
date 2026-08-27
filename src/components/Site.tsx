"use client";

import { useEffect, useRef, useState, type FormEvent, type MouseEvent, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { ContentData } from "@/content/types";
import { Cursor } from "./Cursor";
import { Fade } from "./Fade";
import { Hero } from "./hero/Hero";
import { Logo } from "./Logo";
import { SiteFooter } from "./SiteFooter";
import { ThemeToggle } from "./ThemeToggle";
import {
  IconClose,
  IconCode,
  IconExternal,
  IconGitHub,
  IconLinkedIn,
  IconMail,
  IconMenu,
  SkillMark,
} from "./icons";

const nav = [
  { href: "#about", label: "About" },
  { href: "#projects", label: "Projects" },
  { href: "#skills", label: "Skills" },
  { href: "#contact", label: "Contact" },
] as const;

const fieldClass =
  "w-full rounded-lg border border-line bg-inset px-4 py-3 text-sm text-foreground outline-none transition focus:border-violet-500/60 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.1)]";

function CountUp({ value, suffix }: { value: number; suffix: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(reduce ? value : 0);

  useEffect(() => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / 900);
          setN(Math.round((1 - (1 - t) ** 3) * value));
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [reduce, value]);

  return (
    <span ref={ref}>
      {n}
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
      className="rounded-full border border-line bg-chip p-3 transition-all duration-300 hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-accent-hover"
      aria-label={label}
    >
      {children}
    </a>
  );
}

function sectionTop(el: HTMLElement) {
  let y = 0;
  let node: HTMLElement | null = el;
  while (node) {
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return y;
}

function scrollToHash(hash: string, instant = false) {
  if (hash === "#top" || hash === "#") {
    window.scrollTo({ top: 0, behavior: instant ? "auto" : "smooth" });
    return;
  }
  const el = document.getElementById(hash.replace(/^#/, ""));
  if (!el) return;
  const header = document.getElementById("site-header");
  const offset = (header?.getBoundingClientRect().height ?? 72) + 12;
  window.scrollTo({
    top: Math.max(0, sectionTop(el) - offset),
    behavior: instant ? "auto" : "smooth",
  });
}

export function Site({ content }: { content: ContentData }) {
  const { site, experience, projects, skills: skillGroups } = content;
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "sent">("idle");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!window.location.hash) return;
    const id = window.location.hash;
    const t = window.setTimeout(() => scrollToHash(id, Boolean(reduce)), 50);
    return () => window.clearTimeout(t);
  }, [reduce]);

  function onSectionLink(e: MouseEvent<HTMLAnchorElement>, href: string) {
    if (!href.startsWith("#")) return;
    e.preventDefault();
    const menuOpen = open;
    setOpen(false);
    window.setTimeout(
      () => {
        scrollToHash(href, Boolean(reduce));
        history.replaceState(null, "", href);
      },
      menuOpen ? 80 : 0,
    );
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const subject = encodeURIComponent(`Portfolio note from ${name || "someone"}`);
    const body = encodeURIComponent(`${message}\n\n— ${name} <${email}>`);
    window.location.href = `mailto:${site.email}?subject=${subject}&body=${body}`;
    setStatus("sent");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Cursor />
      <a href="#about" className="skip" onClick={(e) => onSectionLink(e, "#about")}>
        Skip to content
      </a>

      <motion.header
        id="site-header"
        className="sticky top-0 z-50 border-b border-line bg-header backdrop-blur-xl"
        initial={reduce ? false : { opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <nav className="section-shell flex h-18 items-center justify-between">
          <a
            href="#top"
            className="group inline-flex items-center"
            onClick={(e) => onSectionLink(e, "#top")}
          >
            <Logo name={site.name} />
          </a>
          <div className="flex items-center gap-3">
            <ul className="hidden items-center gap-8 md:flex">
              {nav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="nav-link text-sm"
                    onClick={(e) => onSectionLink(e, item.href)}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            {content.theme.allowToggle ? <ThemeToggle /> : null}
            <button
              type="button"
              className="inline-flex rounded-md border border-line p-2 text-foreground md:hidden"
              aria-label={open ? "Close navigation menu" : "Toggle navigation menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <IconClose /> : <IconMenu />}
            </button>
          </div>
        </nav>
        {open ? (
          <ul className="section-shell flex flex-col gap-3 border-t border-line py-4 md:hidden">
            {nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="block py-1 text-sm text-muted transition hover:text-accent-hover"
                  onClick={(e) => onSectionLink(e, item.href)}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </motion.header>

      <main>
        <Hero site={site} onProjects={(e) => onSectionLink(e, "#projects")} />

        <section className="py-16 sm:py-24">
          <div className="section-shell">
            <Fade y={28} className="grid gap-10 lg:grid-cols-2 lg:gap-16">
              <div>
                <h2 id="about" className="text-3xl font-semibold text-foreground sm:text-4xl">
                  About Me
                </h2>
                <p className="mt-6 text-base leading-8 text-muted">{site.about}</p>
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
              <Fade y={24} delay={0.1}>
                <div className="card-surface relative rounded-2xl p-8">
                  <div className="philosophy-wash absolute inset-0 rounded-2xl" />
                  <div className="relative">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-soft">
                      {site.philosophyKicker}
                    </p>
                    <h3 className="mt-4 text-2xl font-semibold text-foreground">
                      {site.philosophyTitle}
                    </h3>
                    <p className="mt-4 leading-7 text-muted">{site.philosophy}</p>
                  </div>
                </div>
              </Fade>
            </Fade>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="section-shell">
            <Fade y={22}>
              <h2 id="experience" className="text-3xl font-semibold text-foreground sm:text-4xl">
                Experience
              </h2>
              <div className="accent-underline mt-3 h-1 w-28 rounded" />
              <p className="mt-4 max-w-2xl text-muted">{site.experienceIntro}</p>
            </Fade>
            <div className="relative mt-10 pl-8 sm:pl-12">
              <div className="timeline-line absolute bottom-0 left-3 top-0 w-px sm:left-4" />
              {experience.map((job, i) => (
                <Fade key={job.id} delay={0.06 * i}>
                  <article className="card-surface relative mb-6 rounded-2xl p-6 transition duration-300 last:mb-0 hover:-translate-y-1">
                    <span className="absolute -left-[2.2rem] top-8 h-4 w-4 rounded-full bg-violet-600 ring-4 ring-violet-500/30 sm:-left-[2.65rem]" />
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs uppercase tracking-[0.18em] text-accent-text">{job.when}</p>
                      {job.current ? (
                        <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-badge">
                          Current
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-2 text-2xl font-semibold text-foreground">{job.role}</h3>
                    <p className="company-grad mt-1 text-sm">{job.company}</p>
                    <p className="mt-4 leading-7 text-muted">{job.summary}</p>
                    <ul className="mt-4 space-y-2">
                      {job.bullets.map((b) => (
                        <li key={b} className="text-sm text-muted">
                          • {b}
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
        </section>

        <section className="py-16 sm:py-24">
          <div className="section-shell">
            <Fade y={28}>
              <h2 id="projects" className="text-3xl font-semibold text-foreground sm:text-4xl">
                Projects
              </h2>
              <div className="accent-underline mt-3 h-1 w-28 rounded" />
            </Fade>
            <div className="mt-10 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
              {projects.map((project, i) => (
                <Fade key={project.id} delay={0.08 * i} className="h-full">
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
                          aria-label={`View ${project.name} source code`}
                          className="flex items-center gap-2 text-sm text-muted transition-colors hover:text-accent-hover"
                        >
                          <IconCode />
                          GitHub
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

        <section className="py-16 sm:py-24">
          <div className="section-shell">
            <Fade y={22}>
              <h2 id="skills" className="text-3xl font-semibold text-foreground sm:text-4xl">
                Skills &amp; Technologies
              </h2>
              <div className="accent-underline mt-3 h-1 w-48 rounded" />
            </Fade>
            <div className="mt-10 grid gap-8 lg:grid-cols-2">
              {skillGroups.map((group, gi) => (
                <Fade key={group.title} y={18} delay={0.08 * gi}>
                  <div className="card-surface rounded-2xl p-6">
                    <h3 className="text-xl font-semibold text-foreground">{group.title}</h3>
                    <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                      {group.items.map((item, ii) => (
                        <Fade key={item.name} y={10} delay={0.03 * ii}>
                          <div className="group flex cursor-default flex-col items-center gap-2 rounded-xl border border-line bg-chip p-4 text-muted transition-all hover:border-violet-500/40 hover:text-foreground">
                            <SkillMark
                              icon={item.icon}
                              color={item.color}
                              className="opacity-75 transition-all group-hover:opacity-100 group-hover:brightness-125"
                            />
                            <span className="text-center text-xs font-medium transition-colors group-hover:text-foreground">
                              {item.name}
                            </span>
                          </div>
                        </Fade>
                      ))}
                    </div>
                  </div>
                </Fade>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="section-shell">
            <Fade>
              <div className="card-surface grid gap-8 rounded-2xl p-6 sm:p-8 lg:grid-cols-[1.2fr_0.8fr]">
                <div>
                  <h2 id="contact" className="text-3xl font-semibold text-foreground sm:text-4xl">
                    Let&apos;s Work Together
                  </h2>
                  <p className="mt-3 text-muted">{site.contactLine}</p>
                  <form className="mt-8 space-y-4" onSubmit={onSubmit}>
                    <input
                      type="text"
                      name="name"
                      placeholder="Name"
                      required
                      autoComplete="name"
                      className={fieldClass}
                    />
                    <input
                      type="email"
                      name="email"
                      placeholder="Email"
                      required
                      autoComplete="email"
                      className={fieldClass}
                    />
                    <textarea
                      name="message"
                      placeholder="Message"
                      rows={5}
                      required
                      className={`${fieldClass} resize-none`}
                    />
                    <button
                      type="submit"
                      className="btn-primary inline-flex items-center rounded-lg px-5 py-3 text-sm font-semibold text-[#f8f8f8] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                      {status === "sent" ? "Opening email…" : "Send Message"}
                    </button>
                  </form>
                </div>
                <div className="rounded-xl border border-line bg-inset p-6">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-soft">Contact</p>
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
