"use client";

// External dependencies
import type { CSSProperties } from "react";

// Application services & types
import type {
  HeroMedia,
  HeroTemplateId,
  SiteContent,
  ThemeContent,
} from "@/content/types";
import { parsePlayableMedia } from "@/lib/media-url";

/**
 * Renders a decorative mini nav for hero thumbnails.
 * @example <MiniNav />
 */
export function MiniNav() {
  return (
    <div className="wp-mini-nav" aria-hidden>
      <span className="wp-mini-logo" />
      <span className="wp-mini-links" />
    </div>
  );
}

/**
 * Renders decorative CTA pills in hero thumbnails.
 * @example <MiniBtns align="center" />
 */
export function MiniBtns({ align = "start" }: { align?: "start" | "center" }) {
  return (
    <div className={`wp-mini-btns${align === "center" ? " is-center" : ""}`} aria-hidden>
      <i />
      <i className="ghost" />
    </div>
  );
}

/**
 * Maps theme colors to CSS variables for previews.
 * @example themeSkin(theme) // CSSProperties
 */
export function themeSkin(theme: ThemeContent): CSSProperties {
  const pal = theme.dark;
  return {
    "--p-bg": pal.background,
    "--p-fg": pal.foreground,
    "--p-card": pal.card,
    "--p-chip": pal.chip,
    "--p-accent": pal.accentText,
    "--p-from": theme.brandFrom,
    "--p-to": theme.brandTo,
  } as CSSProperties;
}

/**
 * Renders hero media as image/video/iframe.
 * @example <MediaVisual media={heroMedia} compact />
 */
export function MediaVisual({ media, compact = false }: { media: HeroMedia; compact?: boolean }) {
  const playable = parsePlayableMedia(media.url, media.kind === "image" ? "image" : "video");
  if (playable.type === "unsupported") {
    return <div className="wp-media-missing">{playable.reason}</div>;
  }
  if (playable.type === "iframe") {
    const src = compact ? playable.src : playable.src.replace("controls=0", "controls=1");
    return (
      <iframe
        src={src}
        title="Hero media preview"
        allow="autoplay; encrypted-media; picture-in-picture"
        tabIndex={compact ? -1 : undefined}
      />
    );
  }
  if (playable.kind === "video") {
    return <video src={playable.src} muted playsInline loop controls={!compact} />;
  }
  return (
    // Uploaded or remote hero media.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={playable.src} alt="" />
  );
}

/**
 * Renders hero copy layout for a template.
 * @example <MediaCopy site={site} template="classic" />
 */
export function MediaCopy({ site, template }: { site: SiteContent; template: HeroTemplateId }) {
  const kicker = site.kicker || "Kicker";
  const title = site.greeting || "Hello";
  const role = site.roles[0] || "Role";
  if (template === "centered") {
    return (
      <div className="wp-mini-copy is-center">
        <span className="wp-mini-kicker">{kicker}</span>
        <strong>{title}</strong>
        <span className="wp-mini-role">{role}</span>
        <MiniBtns align="center" />
      </div>
    );
  }
  if (template === "minimal") {
    return (
      <div className="wp-mini-copy is-rail">
        <span className="wp-mini-kicker">{kicker}</span>
        <strong>{title}</strong>
        <span className="wp-mini-role">{role}</span>
        <MiniBtns />
      </div>
    );
  }
  if (template === "spotlight") {
    return (
      <div className="wp-mini-copy">
        <span className="wp-mini-chip">{kicker}</span>
        <strong className="is-huge">{title}</strong>
        <span className="wp-mini-role is-chip">{role}</span>
        <MiniBtns />
      </div>
    );
  }
  return (
    <div className="wp-mini-copy">
      <span className="wp-mini-kicker">{kicker}</span>
      <strong>{title}</strong>
      <span className="wp-mini-role">{role}</span>
      <MiniBtns />
    </div>
  );
}

/**
 * Renders live hero media placement preview.
 * @example <MediaLayoutPreview site={site} theme={theme} media={media} />
 */
export function MediaLayoutPreview({
  site,
  theme,
  media,
}: {
  site: SiteContent;
  theme: ThemeContent;
  media: HeroMedia;
}) {
  const template =
    site.heroTemplate === "world" || site.heroTemplate === "nook" || site.heroTemplate === "studio"
      ? "classic"
      : site.heroTemplate;
  const copy = <MediaCopy site={site} template={template} />;

  if (media.kind === "none") {
    return (
      <div className="wp-media-layout is-empty">
        <p>No media selected</p>
      </div>
    );
  }

  if (!media.url.trim()) {
    return (
      <div className="wp-media-layout is-empty">
        <p>Add a {media.kind} to preview</p>
      </div>
    );
  }

  const visual = <MediaVisual media={media} compact />;
  const placeLabel = media.place === "background" ? "Background" : media.side === "left" ? "Left" : "Right";
  const showOrbs = template !== "minimal";

  if (media.place === "background") {
    return (
      <div className="wp-media-layout is-bg" style={themeSkin(theme)}>
        <div className="wp-media-fill">{visual}</div>
        <div className="wp-media-veil" />
        <MiniNav />
        {copy}
        <span className="wp-media-badge">{placeLabel}</span>
      </div>
    );
  }

  const mediaPane = <div className="wp-media-pane">{visual}</div>;
  return (
    <div className="wp-media-layout is-side" style={themeSkin(theme)}>
      <MiniNav />
      {showOrbs ? <span className="wp-mini-orb a" /> : null}
      <div className="wp-media-split">
        {media.side === "left" ? mediaPane : copy}
        {media.side === "left" ? copy : mediaPane}
      </div>
      <span className="wp-media-badge">{placeLabel}</span>
    </div>
  );
}

/**
 * Renders a selectable hero template thumbnail.
 * @example <HeroThumb id="world" site={site} theme={theme} />
 */
export function HeroThumb({
  id,
  site,
  theme,
}: {
  id: HeroTemplateId;
  site: SiteContent;
  theme: ThemeContent;
}) {
  const pal = theme.dark;
  const skin = {
    "--p-bg": pal.background,
    "--p-fg": pal.foreground,
    "--p-card": pal.card,
    "--p-chip": pal.chip,
    "--p-accent": pal.accentText,
    "--p-from": theme.brandFrom,
    "--p-to": theme.brandTo,
  } as CSSProperties;
  const kicker = site.kicker || "Kicker";
  const title = site.greeting || "Hello";
  const role = site.roles[0] || "Role";
  const line = site.line || "";

  if (id === "world") {
    return (
      <div className="wp-template-preview is-world">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/hero-world.jpg" alt="" />
      </div>
    );
  }
  if (id === "nook") {
    return (
      <div className="wp-template-preview is-world">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/hero-nook.jpg" alt="" />
      </div>
    );
  }
  if (id === "studio") {
    return (
      <div className="wp-template-preview is-world">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/hero-studio.jpg?v=studio1" alt="" />
      </div>
    );
  }

  if (id === "centered") {
    return (
      <div className="wp-template-preview is-centered" style={skin}>
        <MiniNav />
        <span className="wp-mini-orb a" />
        <span className="wp-mini-orb b" />
        <div className="wp-mini-copy is-center">
          <span className="wp-mini-kicker">{kicker}</span>
          <strong>{title}</strong>
          <span className="wp-mini-role">{role}</span>
          <MiniBtns align="center" />
        </div>
      </div>
    );
  }

  if (id === "split") {
    return (
      <div className="wp-template-preview is-split" style={skin}>
        <MiniNav />
        <div className="wp-mini-split">
          <div className="wp-mini-copy">
            <span className="wp-mini-kicker">{kicker}</span>
            <strong>{title}</strong>
            <span className="wp-mini-line">{line}</span>
            <MiniBtns />
          </div>
          <div className="wp-mini-card">
            <span className="wp-mini-kicker">Currently</span>
            <span className="wp-mini-role">{role}</span>
            <span className="wp-mini-bar" />
            <span className="wp-mini-bar is-short" />
          </div>
        </div>
      </div>
    );
  }

  if (id === "minimal") {
    return (
      <div className="wp-template-preview is-minimal" style={skin}>
        <MiniNav />
        <div className="wp-mini-copy is-rail">
          <span className="wp-mini-kicker">{kicker}</span>
          <strong>{title}</strong>
          <span className="wp-mini-role">{role}</span>
          <MiniBtns />
        </div>
      </div>
    );
  }

  if (id === "spotlight") {
    return (
      <div className="wp-template-preview is-spotlight" style={skin}>
        <MiniNav />
        <span className="wp-mini-orb a" />
        <div className="wp-mini-copy">
          <span className="wp-mini-chip">{kicker}</span>
          <strong className="is-huge">{title}</strong>
          <span className="wp-mini-role is-chip">{role}</span>
          <MiniBtns />
          <div className="wp-mini-stats" aria-hidden>
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wp-template-preview is-classic" style={skin}>
      <MiniNav />
      <span className="wp-mini-orb a" />
      <span className="wp-mini-orb b" />
      <div className="wp-mini-copy">
        <span className="wp-mini-kicker">{kicker}</span>
        <strong>{title}</strong>
        <span className="wp-mini-role">{role}</span>
        <span className="wp-mini-line">{line}</span>
        <MiniBtns />
      </div>
    </div>
  );
}
