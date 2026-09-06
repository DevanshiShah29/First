"use client";

import type { MouseEvent, ReactNode } from "react";
import { Fade } from "@/components/Fade";
import type { HeroTemplateId, PublicSiteContent, SiteContent } from "@/content/types";
import { HeroCtas } from "./HeroCtas";
import { Typewriter } from "./Typewriter";

export interface HeroProps {
  site: PublicSiteContent | SiteContent;
  onProjects: (e: MouseEvent<HTMLAnchorElement>) => void;
}

export function HeroCopy({
  site,
  onProjects,
  template,
}: HeroProps & { template: HeroTemplateId }) {
  if (template === "centered") {
    return (
      <div className="text-center">
        <Fade>
          <p className="kicker mb-4">{site.kicker}</p>
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
          <p className="kicker">{site.kicker}</p>
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
          <span className="inline-flex rounded-full border border-line bg-chip px-3 py-1 text-2xs uppercase tracking-kicker-tight text-accent-text">
            {site.kicker}
          </span>
        </Fade>
        <Fade delay={0.05}>
          <h1 className="mt-6 max-w-5xl text-5xl font-semibold leading-flat text-foreground sm:text-6xl lg:text-7xl">
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
        <p className="kicker mb-4">{site.kicker}</p>
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

export function ClassicHero({ site, onProjects }: HeroProps) {
  return (
    <section id="top" className="relative overflow-hidden py-20 sm:py-24">
      <div className="hero-orb-a" />
      <div className="hero-orb-b" />
      <div className="section-shell relative">
        <Fade>
          <p className="kicker mb-4">{site.kicker}</p>
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

export function CenteredHero({ site, onProjects }: HeroProps) {
  return (
    <section id="top" className="relative overflow-hidden py-24 sm:py-32">
      <div className="hero-orb-a" />
      <div className="hero-orb-b" />
      <div className="section-shell relative text-center">
        <Fade>
          <p className="kicker mb-4">{site.kicker}</p>
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

export function SplitHero({ site, onProjects }: HeroProps) {
  return (
    <section id="top" className="relative overflow-hidden py-20 sm:py-24">
      <div className="hero-orb-a" />
      <div className="hero-orb-b" />
      <div className="section-shell relative grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <Fade>
            <p className="kicker mb-4">{site.kicker}</p>
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
            <p className="kicker text-muted-soft">Currently</p>
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

export function MinimalHero({ site, onProjects }: HeroProps) {
  return (
    <section id="top" className="border-b border-line py-16 sm:py-20">
      <div className="section-shell">
        <div className="max-w-3xl border-l-2 pl-6 sm:pl-8" style={{ borderColor: "var(--brand-from)" }}>
          <Fade>
            <p className="kicker">{site.kicker}</p>
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

export function SpotlightHero({ site, onProjects }: HeroProps) {
  return (
    <section id="top" className="relative overflow-hidden py-20 sm:py-28">
      <div className="hero-orb-a" />
      <div className="hero-orb-b" />
      <div className="section-shell relative">
        <Fade>
          <span className="inline-flex rounded-full border border-line bg-chip px-3 py-1 text-2xs uppercase tracking-kicker-tight text-accent-text">
            {site.kicker}
          </span>
        </Fade>
        <Fade delay={0.05}>
          <h1 className="mt-6 max-w-5xl text-5xl font-semibold leading-flat text-foreground sm:text-6xl lg:text-7xl">
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

export const HERO_TEMPLATES_MAP: Record<
  Exclude<HeroTemplateId, "world" | "nook" | "studio">,
  (props: HeroProps) => ReactNode
> = {
  classic: ClassicHero,
  centered: CenteredHero,
  split: SplitHero,
  minimal: MinimalHero,
  spotlight: SpotlightHero,
};
