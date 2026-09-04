"use client";

import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import dynamic from "next/dynamic";
import type { HeroMedia, HeroTemplateId, SiteContent } from "@/content/types";
import { useReducedMotion } from "@/lib/reduced-motion";
import { parsePlayableMedia } from "@/lib/media-url";
import { Fade } from "@/components/Fade";
import { IconArrowRight, IconDownload } from "@/components/icons";
import { resumeDownloadProps } from "@/lib/resume";

const WorldHero = dynamic(() => import("./WorldHero").then((m) => m.WorldHero), {
  ssr: false,
  loading: () => <div className="world-hero" aria-hidden />,
});
const NookHero = dynamic(() => import("./NookHero").then((m) => m.NookHero), {
  ssr: false,
  loading: () => <div className="world-hero is-nook" aria-hidden />,
});
const StudioHero = dynamic(() => import("./StudioHero").then((m) => m.StudioHero), {
  ssr: true,
  loading: () => <div className="world-hero is-studio" aria-hidden />,
});

function Typewriter({ words }: { words: readonly string[] }) {
  const reduce = useReducedMotion();
  const list = words.filter(Boolean);
  const spoken = list.join(". ");
  if (reduce) {
    return (
      <>
        <span className="sr-only">{spoken}</span>
        <p className="inline-block text-xl font-medium text-accent-text sm:text-2xl" aria-hidden="true">
          {list.join(" · ")}
        </p>
      </>
    );
  }
  return (
    <>
      <span className="sr-only">{spoken}</span>
      <TypewriterLive words={list} />
    </>
  );
}

function TypewriterLive({ words }: { words: readonly string[] }) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState(words[0] ?? "");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[index] ?? "";
    const delay = deleting ? 40 : text === word ? 1600 : 70;
    const id = window.setTimeout(() => {
      if (!deleting) {
        const next = word.slice(0, text.length + 1);
        setText(next);
        if (next === word) setDeleting(true);
      } else {
        const next = word.slice(0, Math.max(0, text.length - 1));
        setText(next);
        if (next.length === 0) {
          setDeleting(false);
          setIndex((i) => (i + 1) % Math.max(words.length, 1));
        }
      }
    }, delay);
    return () => window.clearTimeout(id);
  }, [deleting, index, text, words]);

  return (
    <p className="inline-block text-xl font-medium text-accent-text sm:text-2xl" aria-hidden="true">
      {text}
      <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.12em] bg-accent-text align-baseline motion-safe:animate-pulse" />
    </p>
  );
}

function HeroCtas({
  resume,
  name,
  align = "start",
  onProjects,
}: {
  resume: string;
  name: string;
  align?: "start" | "center";
  onProjects: (e: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const download = resumeDownloadProps(resume, name);
  return (
    <div
      className={`mt-9 flex flex-col gap-4 sm:flex-row ${align === "center" ? "items-center justify-center" : ""}`}
    >
      <a
        href="#projects"
        onClick={onProjects}
        className="btn-primary inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-[#f8f8f8] hover:-translate-y-0.5"
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

type HeroProps = {
  site: SiteContent;
  onProjects: (e: MouseEvent<HTMLAnchorElement>) => void;
};

function hasMedia(media: HeroMedia) {
  return media.kind !== "none" && media.url.trim().length > 0;
}

function HeroMediaView({
  media,
  className,
  alt,
  decorative,
}: {
  media: HeroMedia;
  className?: string;
  alt: string;
  decorative?: boolean;
}) {
  const reduce = useReducedMotion();
  const playable = parsePlayableMedia(media.url, media.kind === "image" ? "image" : "video");
  if (playable.type === "iframe") {
    const src = reduce
      ? playable.src.replace(/autoplay=1/g, "autoplay=0").replace(/controls=0/g, "controls=1")
      : playable.src;
    return (
      <iframe
        src={src}
        className={`${className ?? ""} border-0`}
        title={alt || "Hero video"}
        allow={`${reduce ? "" : "autoplay; "}encrypted-media; picture-in-picture`}
        allowFullScreen
      />
    );
  }
  if (playable.type === "file" && playable.kind === "video") {
    return (
      <video
        className={className}
        src={playable.src}
        autoPlay={!reduce}
        muted
        loop
        playsInline
        controls
        title={alt || "Hero video"}
      />
    );
  }
  if (playable.type === "file") {
    return (
      // Hero media can be a local upload or an external URL.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={playable.src} alt={decorative ? "" : alt} className={className} />
    );
  }
  return <div className={className} />;
}

function HeroCopy({
  site,
  onProjects,
  template,
}: HeroProps & { template: HeroTemplateId }) {
  if (template === "centered") {
    return (
      <div className="text-center">
        <Fade>
          <p className="mb-4 text-[0.7rem] uppercase tracking-[0.2em] text-accent-text">{site.kicker}</p>
        </Fade>
        <Fade delay={0.05}>
          <h1 className="mx-auto max-w-3xl text-4xl font-semibold leading-tight text-foreground sm:text-5xl lg:text-6xl">
            {site.greeting}
          </h1>
        </Fade>
        <Fade className="mt-5 min-h-10" y={20} delay={0.1}>
          <Typewriter words={site.roles} />
        </Fade>
        <Fade delay={0.16}>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-muted sm:text-lg">{site.line}</p>
        </Fade>
        <Fade delay={0.22}>
          <HeroCtas resume={site.resume} name={site.name} align="center" onProjects={onProjects} />
        </Fade>
      </div>
    );
  }
  if (template === "minimal") {
    return (
      <div className="max-w-3xl border-l-2 pl-6 sm:pl-8" style={{ borderColor: "var(--brand-from)" }}>
        <Fade>
          <p className="text-[0.7rem] uppercase tracking-[0.2em] text-accent-text">{site.kicker}</p>
        </Fade>
        <Fade delay={0.05}>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">{site.greeting}</h1>
        </Fade>
        <Fade className="mt-4" delay={0.1}>
          <Typewriter words={site.roles} />
        </Fade>
        <Fade delay={0.16}>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted">{site.line}</p>
        </Fade>
        <Fade delay={0.22}>
          <HeroCtas resume={site.resume} name={site.name} onProjects={onProjects} />
        </Fade>
      </div>
    );
  }
  if (template === "spotlight") {
    return (
      <div>
        <Fade>
          <span className="inline-flex rounded-full border border-line bg-chip px-3 py-1 text-[0.7rem] uppercase tracking-[0.18em] text-accent-text">
            {site.kicker}
          </span>
        </Fade>
        <Fade delay={0.05}>
          <h1 className="mt-6 max-w-5xl text-5xl font-semibold leading-[1.05] text-foreground sm:text-6xl lg:text-7xl">
            {site.greeting}
          </h1>
        </Fade>
        <Fade className="mt-6" delay={0.12}>
          <span className="inline-flex rounded-lg border border-violet-500/25 bg-violet-500/10 px-3 py-1.5">
            <Typewriter words={site.roles} />
          </span>
        </Fade>
        <Fade delay={0.18}>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">{site.line}</p>
        </Fade>
        <Fade delay={0.24}>
          <HeroCtas resume={site.resume} name={site.name} onProjects={onProjects} />
        </Fade>
      </div>
    );
  }
  return (
    <div>
      <Fade>
        <p className="mb-4 text-[0.7rem] uppercase tracking-[0.2em] text-accent-text">{site.kicker}</p>
      </Fade>
      <Fade delay={0.05}>
        <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-foreground sm:text-5xl lg:text-6xl">
          {site.greeting}
        </h1>
      </Fade>
      <Fade className="mt-5 min-h-10" y={20} delay={0.1}>
        <Typewriter words={site.roles} />
      </Fade>
      <Fade delay={0.16}>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">{site.line}</p>
      </Fade>
      <Fade delay={0.22}>
        <HeroCtas resume={site.resume} name={site.name} onProjects={onProjects} />
      </Fade>
    </div>
  );
}

function Classic({ site, onProjects }: HeroProps) {
  return (
    <section id="top" className="relative overflow-hidden py-20 sm:py-24">
      <div className="hero-orb-a" />
      <div className="hero-orb-b" />
      <div className="section-shell relative">
        <Fade>
          <p className="mb-4 text-[0.7rem] uppercase tracking-[0.2em] text-accent-text">{site.kicker}</p>
        </Fade>
        <Fade delay={0.05}>
          <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-foreground sm:text-5xl lg:text-6xl">
            {site.greeting}
          </h1>
        </Fade>
        <Fade className="mt-5 min-h-10" y={20} delay={0.1}>
          <Typewriter words={site.roles} />
        </Fade>
        <Fade delay={0.16}>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">{site.line}</p>
        </Fade>
        <Fade delay={0.22}>
          <HeroCtas resume={site.resume} name={site.name} onProjects={onProjects} />
        </Fade>
      </div>
    </section>
  );
}

function Centered({ site, onProjects }: HeroProps) {
  return (
    <section id="top" className="relative overflow-hidden py-24 sm:py-32">
      <div className="hero-orb-a" />
      <div className="hero-orb-b" />
      <div className="section-shell relative text-center">
        <Fade>
          <p className="mb-4 text-[0.7rem] uppercase tracking-[0.2em] text-accent-text">{site.kicker}</p>
        </Fade>
        <Fade delay={0.05}>
          <h1 className="mx-auto max-w-3xl text-4xl font-semibold leading-tight text-foreground sm:text-5xl lg:text-6xl">
            {site.greeting}
          </h1>
        </Fade>
        <Fade className="mt-5 min-h-10" y={20} delay={0.1}>
          <Typewriter words={site.roles} />
        </Fade>
        <Fade delay={0.16}>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-muted sm:text-lg">{site.line}</p>
        </Fade>
        <Fade delay={0.22}>
          <HeroCtas resume={site.resume} name={site.name} align="center" onProjects={onProjects} />
        </Fade>
      </div>
    </section>
  );
}

function Split({ site, onProjects }: HeroProps) {
  return (
    <section id="top" className="relative overflow-hidden py-20 sm:py-24">
      <div className="hero-orb-a" />
      <div className="section-shell relative grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <Fade>
            <p className="mb-4 text-[0.7rem] uppercase tracking-[0.2em] text-accent-text">{site.kicker}</p>
          </Fade>
          <Fade delay={0.05}>
            <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-5xl">{site.greeting}</h1>
          </Fade>
          <Fade delay={0.12}>
            <p className="mt-5 text-base leading-7 text-muted sm:text-lg">{site.line}</p>
          </Fade>
          <Fade delay={0.2}>
            <HeroCtas resume={site.resume} name={site.name} onProjects={onProjects} />
          </Fade>
        </div>
        <Fade delay={0.1}>
          <div className="card-surface rounded-2xl p-8">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-soft">Currently</p>
            <div className="mt-4 min-h-10">
              <Typewriter words={site.roles} />
            </div>
            <ul className="mt-6 space-y-2 border-t border-line pt-6">
              {site.roles.map((role) => (
                <li key={role} className="text-sm text-muted">
                  {role}
                </li>
              ))}
            </ul>
            {site.stats.length ? (
              <div className="mt-8 grid grid-cols-3 gap-3">
                {site.stats.slice(0, 3).map((stat) => (
                  <div key={stat.label}>
                    <p className="text-xl font-semibold text-foreground">
                      {stat.value}
                      {stat.suffix}
                    </p>
                    <p className="mt-1 text-xs text-muted">{stat.label}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </Fade>
      </div>
    </section>
  );
}

function Minimal({ site, onProjects }: HeroProps) {
  return (
    <section id="top" className="border-b border-line py-16 sm:py-20">
      <div className="section-shell">
        <div className="max-w-3xl border-l-2 pl-6 sm:pl-8" style={{ borderColor: "var(--brand-from)" }}>
          <Fade>
            <p className="text-[0.7rem] uppercase tracking-[0.2em] text-accent-text">{site.kicker}</p>
          </Fade>
          <Fade delay={0.05}>
            <h1 className="mt-3 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">{site.greeting}</h1>
          </Fade>
          <Fade className="mt-4" delay={0.1}>
            <Typewriter words={site.roles} />
          </Fade>
          <Fade delay={0.16}>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted">{site.line}</p>
          </Fade>
          <Fade delay={0.22}>
            <HeroCtas resume={site.resume} name={site.name} onProjects={onProjects} />
          </Fade>
        </div>
      </div>
    </section>
  );
}

function Spotlight({ site, onProjects }: HeroProps) {
  return (
    <section id="top" className="relative overflow-hidden py-20 sm:py-28">
      <div className="hero-orb-a" />
      <div className="hero-orb-b" />
      <div className="section-shell relative">
        <Fade>
          <span className="inline-flex rounded-full border border-line bg-chip px-3 py-1 text-[0.7rem] uppercase tracking-[0.18em] text-accent-text">
            {site.kicker}
          </span>
        </Fade>
        <Fade delay={0.05}>
          <h1 className="mt-6 max-w-5xl text-5xl font-semibold leading-[1.05] text-foreground sm:text-6xl lg:text-7xl">
            {site.greeting}
          </h1>
        </Fade>
        <Fade className="mt-6" delay={0.12}>
          <span className="inline-flex rounded-lg border border-violet-500/25 bg-violet-500/10 px-3 py-1.5">
            <Typewriter words={site.roles} />
          </span>
        </Fade>
        <Fade delay={0.18}>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">{site.line}</p>
        </Fade>
        <Fade delay={0.24}>
          <HeroCtas resume={site.resume} name={site.name} onProjects={onProjects} />
        </Fade>
        {site.stats.length ? (
          <Fade delay={0.3}>
            <div className="mt-14 grid max-w-2xl grid-cols-3 gap-6 border-t border-line pt-8">
              {site.stats.slice(0, 3).map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-semibold text-foreground">
                    {stat.value}
                    {stat.suffix}
                  </p>
                  <p className="mt-1 text-sm text-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          </Fade>
        ) : null}
      </div>
    </section>
  );
}

const templates: Record<Exclude<HeroTemplateId, "world" | "nook" | "studio">, (props: HeroProps) => ReactNode> = {
  classic: Classic,
  centered: Centered,
  split: Split,
  minimal: Minimal,
  spotlight: Spotlight,
};

export function Hero({
  site,
  onProjects,
}: {
  site: SiteContent;
  onProjects: (e: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const media = site.heroMedia;
  const template = site.heroTemplate;
  if (template === "world") {
    return <WorldHero site={site} />;
  }
  if (template === "nook") {
    return <NookHero site={site} />;
  }
  if (template === "studio") {
    return <StudioHero site={site} />;
  }
  const copy = <HeroCopy site={site} onProjects={onProjects} template={template} />;

  if (hasMedia(media) && media.place === "background") {
    return (
      <section id="top" className="relative flex min-h-[78vh] items-center overflow-hidden py-20 sm:py-28">
        <div className="absolute inset-0">
          <HeroMediaView
            media={media}
            className="h-full w-full object-cover"
            alt=""
            decorative
          />
          <div className="absolute inset-0 bg-background/70" />
        </div>
        <div className="section-shell relative z-10 w-full">{copy}</div>
      </section>
    );
  }

  if (hasMedia(media) && media.place === "side") {
    const frame = (
      <div className="relative min-h-[16rem] overflow-hidden rounded-2xl border border-line bg-chip sm:min-h-[22rem] lg:min-h-[28rem]">
        <HeroMediaView
          media={media}
          className="absolute inset-0 h-full w-full object-cover"
          alt={`${site.name} portrait or featured media`}
        />
      </div>
    );
    return (
      <section id="top" className="relative overflow-hidden py-20 sm:py-24">
        {template !== "minimal" ? (
          <>
            <div className="hero-orb-a" />
            <div className="hero-orb-b" />
          </>
        ) : null}
        <div className="section-shell relative grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {media.side === "left" ? frame : copy}
          {media.side === "left" ? copy : frame}
        </div>
      </section>
    );
  }

  const Template = templates[template] ?? Classic;
  return <Template site={site} onProjects={onProjects} />;
}
