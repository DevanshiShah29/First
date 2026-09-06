"use client";

// External dependencies
import type { MouseEvent } from "react";
import dynamic from "next/dynamic";

// Application services & types
import type { PublicSiteContent, SiteContent } from "@/content/types";

// UI components
import { hasMedia, HeroMediaView } from "./HeroMediaView";
import { ClassicHero, HERO_TEMPLATES_MAP, HeroCopy } from "./templates";

const WorldHero = dynamic(() => import("./WorldHero").then((m) => m.WorldHero), {
  ssr: true,
  loading: () => <div className="world-hero" aria-hidden />,
});

const NookHero = dynamic(() => import("./NookHero").then((m) => m.NookHero), {
  ssr: true,
  loading: () => <div className="world-hero is-nook" aria-hidden />,
});

const StudioHero = dynamic(() => import("./StudioHero").then((m) => m.StudioHero), {
  ssr: true,
  loading: () => <div className="world-hero is-studio" aria-hidden />,
});

interface HeroProps {
  site: PublicSiteContent | SiteContent;
  onProjects: (e: MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * Renders the configured hero template (world/nook/studio or copy layouts).
 * @example <Hero site={site} onProjects={fn} />
 */
export function Hero({ site, onProjects }: HeroProps) {
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
      <section id="top" className="hero-viewport-min relative flex items-center overflow-hidden py-20 sm:py-28">
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
      <div className="relative min-h-64 sm:min-h-88 lg:min-h-112 overflow-hidden rounded-2xl border border-line bg-chip">
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

  const TemplateComponent = HERO_TEMPLATES_MAP[template] ?? ClassicHero;
  return <TemplateComponent site={site} onProjects={onProjects} />;
}
