"use client";

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DEFAULT_HERO_MEDIA,
  DEFAULT_THEME,
  HERO_TEMPLATES,
  SKILL_ICONS,
  THEME_PALETTE_FIELDS,
  type ContentData,
  type HeroMedia,
  type HeroTemplateId,
  type SiteContent,
  type SkillIcon,
  type ThemeContent,
  type ThemeMode,
} from "@/content/types";
import { LogoMark } from "@/components/Logo";
import { goodreadsUserId } from "@/lib/goodreads";
import { mediaHint, parsePlayableMedia, youtubeVideoId } from "@/lib/media-url";
import { Field, HexColorInput, StringList, TextArea, TextInput } from "./fields";
import {
  IconAppearance,
  IconDash,
  IconHero,
  IconHome,
  IconJar,
  IconMenu,
  IconPages,
  IconPin,
  IconPlus,
  IconSettings,
  IconStar,
} from "./wp-icons";

type Screen =
  | "dashboard"
  | "site"
  | "hero"
  | "appearance"
  | "experience"
  | "experience-edit"
  | "projects"
  | "projects-edit"
  | "skills"
  | "memories"
  | "memories-edit";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function move<T>(list: T[], index: number, dir: -1 | 1) {
  const next = [...list];
  const j = index + dir;
  if (j < 0 || j >= next.length) return next;
  [next[index], next[j]] = [next[j], next[index]];
  return next;
}

function newId() {
  return crypto.randomUUID();
}

function goodreadsHint(url: string) {
  const trimmed = url.trim();
  if (!trimmed) {
    return "Leave blank to rest the books. The 3D World piano-desk book pulls this profile when tapped.";
  }
  if (goodreadsUserId(trimmed)) {
    return "Goodreads profile detected — the books object will load this shelf.";
  }
  return "Could not find a Goodreads user ID. Paste a profile URL like https://www.goodreads.com/user/show/123-name";
}

function pianoMusicHint(url: string) {
  const trimmed = url.trim();
  if (!trimmed) {
    return "Leave blank to rest the piano. Playback starts only when someone taps the piano — never on page load.";
  }
  if (youtubeVideoId(trimmed)) {
    return "YouTube video detected — the piano will play this track inside the 3D world.";
  }
  return "Could not find a YouTube video ID. Use a watch, share, Shorts, or embed URL.";
}

function Metabox({
  title,
  children,
  defaultOpen = true,
  isOpen: controlledOpen,
  badge,
  actions,
  id,
  className = "",
}: {
  title: string | ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  isOpen?: boolean;
  badge?: ReactNode;
  actions?: ReactNode;
  id?: string;
  className?: string;
}) {
  const storageKey = useMemo(() => {
    if (id) return `wp_metabox_${id}`;
    if (typeof title === "string") return `wp_metabox_${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
    return null;
  }, [id, title]);

  const [internalOpen, setInternalOpen] = useState(() => {
    if (typeof window === "undefined" || !storageKey) return defaultOpen;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) return stored === "true";
    } catch {
      // Ignore
    }
    return defaultOpen;
  });

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const toggle = () => {
    const next = !open;
    setInternalOpen(next);
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, String(next));
      } catch {
        // Ignore
      }
    }
  };

  const titleString = typeof title === "string" ? title : "";

  return (
    <section className={`wp-metabox${!open ? " is-collapsed" : ""}${className ? ` ${className}` : ""}`}>
      <div
        className="wp-metabox-h"
        onClick={toggle}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        }}
      >
        <div className="wp-metabox-h-title">
          <h2 className="wp-metabox-title-text">{title}</h2>
          {badge ? <span className="wp-metabox-badge">{badge}</span> : null}
        </div>
        <div className="wp-metabox-h-actions" onClick={(e) => e.stopPropagation()}>
          {actions}
          <button
            type="button"
            className="wp-metabox-toggle"
            aria-label={open ? `Collapse ${titleString || "section"}` : `Expand ${titleString || "section"}`}
            title={open ? "Click to collapse" : "Click to expand"}
            onClick={(e) => {
              e.stopPropagation();
              toggle();
            }}
          >
            <svg
              className={`wp-metabox-toggle-icon${!open ? " is-collapsed" : ""}`}
              viewBox="0 0 20 20"
              width="20"
              height="20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </button>
        </div>
      </div>
      <div className="wp-metabox-b" hidden={!open}>
        {children}
      </div>
    </section>
  );
}

function SectionTools({
  onExpandAll,
  onCollapseAll,
}: {
  onExpandAll: () => void;
  onCollapseAll: () => void;
}) {
  return (
    <div className="wp-section-tools">
      <span>Sections:</span>
      <button type="button" onClick={onExpandAll}>
        Expand all
      </button>
      <span>·</span>
      <button type="button" onClick={onCollapseAll}>
        Collapse all
      </button>
    </div>
  );
}

type BreadcrumbItem = {
  label: string;
  onClick?: () => void;
  current?: boolean;
};

function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null;

  return (
    <nav className="wp-breadcrumbs" aria-label="Breadcrumbs">
      <ol className="wp-breadcrumbs-list">
        {items.map((item, i) => {
          const isLast = i === items.length - 1 || item.current;
          return (
            <li key={i} className={`wp-breadcrumbs-item${isLast ? " is-current" : ""}`}>
              {isLast || !item.onClick ? (
                <span aria-current={isLast ? "page" : undefined}>{item.label}</span>
              ) : (
                <button type="button" onClick={item.onClick} className="wp-breadcrumbs-link">
                  {item.label}
                </button>
              )}
              {!isLast ? <span className="wp-breadcrumbs-sep" aria-hidden>›</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function MiniNav() {
  return (
    <div className="wp-mini-nav" aria-hidden>
      <span className="wp-mini-logo" />
      <span className="wp-mini-links" />
    </div>
  );
}

function MiniBtns({ align = "start" }: { align?: "start" | "center" }) {
  return (
    <div className={`wp-mini-btns${align === "center" ? " is-center" : ""}`} aria-hidden>
      <i />
      <i className="ghost" />
    </div>
  );
}

function themeSkin(theme: ThemeContent) {
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

function MediaVisual({ media, compact = false }: { media: HeroMedia; compact?: boolean }) {
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

function MediaCopy({ site, template }: { site: SiteContent; template: HeroTemplateId }) {
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

function MediaLayoutPreview({
  site,
  theme,
  media,
}: {
  site: SiteContent;
  theme: ThemeContent;
  media: HeroMedia;
}) {
  const template =
    site.heroTemplate === "world" || site.heroTemplate === "nook" ? "classic" : site.heroTemplate;
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

function HeroThumb({
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

function AppearancePreview({
  theme,
  site,
}: {
  theme: ThemeContent;
  site: SiteContent;
}) {
  const [viewMode, setViewMode] = useState<"split" | "dark" | "light" | "mobile">("split");
  const [mobileMode, setMobileMode] = useState<"dark" | "light">("dark");
  const [hoveredToken, setHoveredToken] = useState<string | null>(null);

  const isHighlighted = (token: string) => hoveredToken === token;

  const renderMockup = (mode: "dark" | "light", isMobile = false) => {
    const palette = theme[mode];
    const isDark = mode === "dark";
    const brandGradient = `linear-gradient(135deg, ${theme.brandFrom}, ${theme.brandTo})`;

    return (
      <div
        className={`wp-mockup-frame${isMobile ? " is-mobile" : ""}`}
        style={{
          background: palette.background,
          color: palette.foreground,
          borderColor: isDark ? "#2d2d30" : "#d0d0d5",
          boxShadow: isDark
            ? "0 12px 32px -4px rgba(0,0,0,0.65), 0 2px 6px rgba(0,0,0,0.4)"
            : "0 12px 32px -4px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.06)",
        }}
      >
        {/* Browser Mockup Top Bar */}
        <div
          className="wp-mockup-bar"
          style={{
            background: isDark ? "#16161a" : "#f0f0f4",
            borderBottomColor: isDark ? "#28282e" : "#dcdcde",
            color: isDark ? "#888890" : "#666670",
          }}
        >
          <div className="wp-mockup-dots">
            <span className="dot red" />
            <span className="dot yellow" />
            <span className="dot green" />
          </div>
          <div
            className="wp-mockup-address"
            style={{
              background: isDark ? "#0c0c0e" : "#ffffff",
              color: isDark ? "#a0a0aa" : "#52525b",
              border: `1px solid ${isDark ? "#222226" : "#e4e4e7"}`,
            }}
          >
            🔒 {site.name ? site.name.toLowerCase().replace(/[^a-z0-9]/g, "") : "portfolio"}.dev
          </div>
          <span
            className="wp-mockup-badge"
            style={{
              background: palette.badge,
              color: palette.background,
              boxShadow: isHighlighted("badge") ? "0 0 0 2px #388bfd" : undefined,
            }}
          >
            {mode.toUpperCase()}
          </span>
        </div>

        {/* Browser Mockup Body */}
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            padding: isMobile ? "14px 12px" : "18px 16px",
          }}
        >
          {/* Ambient Glow Orbs */}
          <div
            style={{
              position: "absolute",
              top: "-25px",
              left: "-25px",
              width: "150px",
              height: "150px",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${theme.brandFrom}45 0%, transparent 70%)`,
              filter: "blur(22px)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-25px",
              right: "-25px",
              width: "130px",
              height: "130px",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${theme.brandTo}35 0%, transparent 70%)`,
              filter: "blur(20px)",
              pointerEvents: "none",
            }}
          />

          {/* Navigation Bar */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
              paddingBottom: 10,
              borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
              position: "relative",
              zIndex: 1,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  display: "inline-block",
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  background: brandGradient,
                  boxShadow: isHighlighted("brand") ? "0 0 0 2px #fff, 0 0 0 4px #388bfd" : undefined,
                }}
              />
              <span style={{ fontWeight: 700, fontSize: 13, letterSpacing: "-0.01em" }}>
                {site.name || "Devanshi Shah"}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12, fontSize: 11, opacity: 0.8 }}>
              {!isMobile && (
                <>
                  <span>About</span>
                  <span>Projects</span>
                  <span>Skills</span>
                </>
              )}
              <span
                style={{
                  display: "inline-block",
                  padding: "2px 7px",
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 600,
                  background: palette.badge,
                  color: palette.background,
                  boxShadow: isHighlighted("badge") ? "0 0 0 2px #388bfd" : undefined,
                }}
              >
                Available
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 20,
                  height: 20,
                  borderRadius: 999,
                  background: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.07)",
                  fontSize: 11,
                }}
              >
                {isDark ? "🌙" : "☀️"}
              </span>
            </div>
          </nav>

          {/* Hero Section */}
          <div style={{ position: "relative", zIndex: 1, marginBottom: 16 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "2px 8px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 500,
                background: palette.chip,
                color: palette.accentText,
                border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"}`,
                marginBottom: 8,
                boxShadow: isHighlighted("chip") || isHighlighted("accentText") ? "0 0 0 2px #388bfd" : undefined,
              }}
            >
              <span>✨</span>
              <span>{site.kicker || "Product Manager"}</span>
            </div>

            <h2
              style={{
                fontSize: isMobile ? 18 : 22,
                fontWeight: 800,
                lineHeight: 1.2,
                margin: "0 0 6px",
                letterSpacing: "-0.02em",
              }}
            >
              {site.greeting || "Hi, I'm"}{" "}
              <span
                style={{
                  background: brandGradient,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  boxShadow: isHighlighted("brand") ? "0 0 0 2px #388bfd" : undefined,
                }}
              >
                {site.name || "Devanshi"}
              </span>
            </h2>

            <p
              style={{
                fontSize: 12,
                lineHeight: 1.45,
                margin: "0 0 12px",
                opacity: 0.75,
                maxWidth: "92%",
              }}
            >
              {site.line || "Building products people love with thoughtful systems & craft."}
            </p>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <button
                type="button"
                style={{
                  padding: "5px 12px",
                  borderRadius: 6,
                  border: 0,
                  fontSize: 11,
                  fontWeight: 600,
                  background: brandGradient,
                  color: "#ffffff",
                  cursor: "default",
                  boxShadow: isHighlighted("brand") ? "0 0 0 2px #388bfd" : "0 2px 6px rgba(0,0,0,0.2)",
                }}
              >
                View Projects →
              </button>
              <button
                type="button"
                style={{
                  padding: "5px 10px",
                  borderRadius: 6,
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"}`,
                  fontSize: 11,
                  fontWeight: 500,
                  background: palette.card,
                  color: palette.accentText,
                  cursor: "default",
                  boxShadow: isHighlighted("card") || isHighlighted("accentText") ? "0 0 0 2px #388bfd" : undefined,
                }}
              >
                Contact Me
              </button>
            </div>
          </div>

          {/* Cards Showcase Preview */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: 10,
            }}
          >
            {/* Project Card Mockup */}
            <div
              className="wp-mockup-card"
              style={{
                background: palette.card,
                border: `1px solid ${isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)"}`,
                borderRadius: 8,
                padding: 10,
                transition: "all 0.15s ease",
                boxShadow: isHighlighted("card") ? "0 0 0 2px #388bfd" : undefined,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = palette.cardHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = palette.card;
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 12 }}>Interactive App</span>
                <span style={{ color: palette.accentText, fontSize: 11, fontWeight: 600 }}>Live ↗</span>
              </div>
              <p style={{ fontSize: 11, opacity: 0.7, margin: "0 0 8px", lineHeight: 1.35 }}>
                Interactive web app built with Next.js and custom themes.
              </p>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {["Next.js", "Tailwind", "Design"].map((tag) => (
                  <span
                    key={tag}
                    style={{
                      background: palette.chip,
                      color: palette.foreground,
                      padding: "1px 6px",
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 500,
                      opacity: 0.9,
                      boxShadow: isHighlighted("chip") ? "0 0 0 1px #388bfd" : undefined,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Experience Card Mockup */}
            <div
              className="wp-mockup-card"
              style={{
                background: palette.card,
                border: `1px solid ${isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)"}`,
                borderRadius: 8,
                padding: 10,
                transition: "all 0.15s ease",
                boxShadow: isHighlighted("card") ? "0 0 0 2px #388bfd" : undefined,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = palette.cardHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = palette.card;
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                <span style={{ color: palette.accentText, fontWeight: 700, fontSize: 12 }}>Product Lead</span>
                <span
                  style={{
                    background: palette.badge,
                    color: palette.background,
                    padding: "1px 5px",
                    borderRadius: 4,
                    fontSize: 9,
                    fontWeight: 700,
                  }}
                >
                  Current
                </span>
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.85, marginBottom: 4 }}>Company · 2023 - Present</div>
              <div style={{ fontSize: 10.5, opacity: 0.7, lineHeight: 1.35 }}>
                Drove roadmap and delivered user-centric core experiences.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Top Controls Toolbar */}
      <div className="wp-preview-toolbar">
        <div className="wp-preview-modes">
          <button
            type="button"
            className={`wp-preview-mode-btn${viewMode === "split" ? " is-active" : ""}`}
            onClick={() => setViewMode("split")}
            title="Side-by-side comparison of dark and light palettes"
          >
            <span>🌓</span> Side-by-Side
          </button>
          <button
            type="button"
            className={`wp-preview-mode-btn${viewMode === "dark" ? " is-active" : ""}`}
            onClick={() => setViewMode("dark")}
            title="Dark mode preview"
          >
            <span>🌙</span> Dark Mode
          </button>
          <button
            type="button"
            className={`wp-preview-mode-btn${viewMode === "light" ? " is-active" : ""}`}
            onClick={() => setViewMode("light")}
            title="Light mode preview"
          >
            <span>☀️</span> Light Mode
          </button>
          <button
            type="button"
            className={`wp-preview-mode-btn${viewMode === "mobile" ? " is-active" : ""}`}
            onClick={() => setViewMode("mobile")}
            title="Smartphone mockup preview"
          >
            <span>📱</span> Mobile
          </button>
        </div>

        {/* Live Token Legend */}
        <div className="wp-preview-tokens">
          <span
            className={`wp-token-pill${isHighlighted("brand") ? " is-active" : ""}`}
            onMouseEnter={() => setHoveredToken("brand")}
            onMouseLeave={() => setHoveredToken(null)}
            title="Brand gradient used for logo, primary buttons, and hero title"
          >
            <span
              className="wp-token-dot"
              style={{ background: `linear-gradient(90deg, ${theme.brandFrom}, ${theme.brandTo})` }}
            />
            Brand
          </span>
          <span
            className={`wp-token-pill${isHighlighted("card") ? " is-active" : ""}`}
            onMouseEnter={() => setHoveredToken("card")}
            onMouseLeave={() => setHoveredToken(null)}
            title="Card background color"
          >
            <span className="wp-token-dot" style={{ background: theme.dark.card }} />
            Cards
          </span>
          <span
            className={`wp-token-pill${isHighlighted("accentText") ? " is-active" : ""}`}
            onMouseEnter={() => setHoveredToken("accentText")}
            onMouseLeave={() => setHoveredToken(null)}
            title="Accent text and link highlights"
          >
            <span className="wp-token-dot" style={{ background: theme.dark.accentText }} />
            Accent
          </span>
          <span
            className={`wp-token-pill${isHighlighted("badge") ? " is-active" : ""}`}
            onMouseEnter={() => setHoveredToken("badge")}
            onMouseLeave={() => setHoveredToken(null)}
            title="Status badges"
          >
            <span className="wp-token-dot" style={{ background: theme.dark.badge }} />
            Badge
          </span>
          <span
            className={`wp-token-pill${isHighlighted("chip") ? " is-active" : ""}`}
            onMouseEnter={() => setHoveredToken("chip")}
            onMouseLeave={() => setHoveredToken(null)}
            title="Chips and tech stack tags"
          >
            <span className="wp-token-dot" style={{ background: theme.dark.chip }} />
            Chips
          </span>
        </div>
      </div>

      {/* Mockup Container */}
      {viewMode === "split" && (
        <div className="wp-mockup-grid is-split">
          <div>{renderMockup("dark")}</div>
          <div>{renderMockup("light")}</div>
        </div>
      )}

      {viewMode === "dark" && (
        <div className="wp-mockup-grid is-single">
          <div>{renderMockup("dark")}</div>
        </div>
      )}

      {viewMode === "light" && (
        <div className="wp-mockup-grid is-single">
          <div>{renderMockup("light")}</div>
        </div>
      )}

      {viewMode === "mobile" && (
        <div className="wp-mockup-grid is-mobile-view">
          <div style={{ textAlign: "center", marginBottom: 10 }}>
            <div style={{ display: "inline-flex", gap: 6, marginBottom: 12 }}>
              <button
                type="button"
                className={`wp-btn${mobileMode === "dark" ? " wp-btn-primary" : ""}`}
                onClick={() => setMobileMode("dark")}
                style={{ fontSize: 11, padding: "2px 8px" }}
              >
                🌙 Dark
              </button>
              <button
                type="button"
                className={`wp-btn${mobileMode === "light" ? " wp-btn-primary" : ""}`}
                onClick={() => setMobileMode("light")}
                style={{ fontSize: 11, padding: "2px 8px" }}
              >
                ☀️ Light
              </button>
            </div>
            <div>{renderMockup(mobileMode, true)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminApp({ initial }: { initial: ContentData }) {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [editId, setEditId] = useState<string | null>(null);
  const [data, setData] = useState(() => clone(initial));
  const [saved, setSaved] = useState(() => JSON.stringify(initial));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sectionState, setSectionState] = useState<Record<string, boolean>>({});

  function expandAll(ids: string[]) {
    setSectionState((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        next[id] = true;
        try {
          localStorage.setItem(`wp_metabox_${id}`, "true");
        } catch {
          // Ignore
        }
      });
      return next;
    });
  }

  function collapseAll(ids: string[]) {
    setSectionState((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        next[id] = false;
        try {
          localStorage.setItem(`wp_metabox_${id}`, "false");
        } catch {
          // Ignore
        }
      });
      return next;
    });
  }

  const dirty = useMemo(() => JSON.stringify(data) !== saved, [data, saved]);
  const site = data.site;
  const heroMedia = site.heroMedia ?? DEFAULT_HERO_MEDIA;
  const firstName = site.name.split(" ")[0] || site.name;

  useEffect(() => {
    function onLeave(e: BeforeUnloadEvent) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  async function save() {
    setStatus("saving");
    setError("");
    const res = await fetch("/api/cms/content", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: data }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string; content?: ContentData };
    if (!res.ok) {
      setStatus("error");
      setError(body.error || "Save failed.");
      return;
    }
    const next = body.content ? clone(body.content) : data;
    setData(next);
    setSaved(JSON.stringify(next));
    setStatus("saved");
    setNotice("Content updated.");
    router.refresh();
  }

  async function logout() {
    await fetch("/api/cms/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  function setHeroMedia(patch: Partial<HeroMedia>) {
    setData({
      ...data,
      site: { ...site, heroMedia: { ...heroMedia, ...patch } },
    });
  }

  async function uploadHeroFile(file: File) {
    setUploading(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/cms/upload", { method: "POST", body: form });
    const body = (await res.json().catch(() => ({}))) as { error?: string; url?: string; kind?: "image" | "video" };
    setUploading(false);
    if (!res.ok || !body.url) {
      setError(body.error || "Upload failed.");
      return;
    }
    setHeroMedia({ url: body.url, kind: body.kind ?? "image" });
  }

  function go(next: Screen, id: string | null = null) {
    setScreen(next);
    setEditId(id);
    setMenuOpen(false);
    setNotice("");
  }

  function addExperience() {
    const id = newId();
    setData({
      ...data,
      experience: [
        ...data.experience,
        {
          id,
          when: "",
          current: false,
          role: "New role",
          company: "",
          summary: "",
          bullets: [""],
          stack: [],
        },
      ],
    });
    go("experience-edit", id);
  }

  function addProject() {
    const id = newId();
    setData({
      ...data,
      projects: [
        ...data.projects,
        { id, name: "New project", blurb: "", tags: [], github: "", demo: "" },
      ],
    });
    go("projects-edit", id);
  }

  function addMemory() {
    const id = newId();
    const memories = data.memories ?? [];
    setData({
      ...data,
      memories: [
        ...memories,
        {
          id,
          title: "New memory",
          note: "",
          date: "",
          category: "Tiny Joy",
          icon: "✨",
          photoUrl: "",
          color: "#A78BFA",
        },
      ],
    });
    go("memories-edit", id);
  }

  async function uploadMemoryPhoto(file: File, id: string) {
    setUploading(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/cms/upload", { method: "POST", body: form });
    const body = (await res.json().catch(() => ({}))) as { error?: string; url?: string };
    setUploading(false);
    if (!res.ok || !body.url) {
      setError(body.error || "Photo upload failed.");
      return;
    }
    const memories = (data.memories ?? []).map((m) => (m.id === id ? { ...m, photoUrl: body.url } : m));
    setData({ ...data, memories });
  }

  const expIndex = data.experience.findIndex((j) => j.id === editId);
  const job = expIndex >= 0 ? data.experience[expIndex] : null;
  const projIndex = data.projects.findIndex((p) => p.id === editId);
  const project = projIndex >= 0 ? data.projects[projIndex] : null;
  const memoriesList = data.memories ?? [];
  const memIndex = memoriesList.findIndex((m) => m.id === editId);
  const memory = memIndex >= 0 ? memoriesList[memIndex] : null;

  const menu = [
    { id: "dashboard" as const, label: "Dashboard", icon: <IconDash />, match: screen === "dashboard" },
    { id: "experience" as const, label: "Experience", icon: <IconPin />, match: screen.startsWith("experience") },
    { id: "projects" as const, label: "Projects", icon: <IconPages />, match: screen.startsWith("projects") },
    { id: "skills" as const, label: "Skills", icon: <IconStar />, match: screen === "skills" },
    { id: "memories" as const, label: "Memories", icon: <IconJar />, match: screen.startsWith("memories") },
    { id: "hero" as const, label: "Hero", icon: <IconHero />, match: screen === "hero" },
    { id: "appearance" as const, label: "Appearance", icon: <IconAppearance />, match: screen === "appearance" },
    { id: "site" as const, label: "Settings", icon: <IconSettings />, match: screen === "site" },
  ];

  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => {
    switch (screen) {
      case "dashboard":
        return [{ label: "Dashboard", current: true }];
      case "site":
        return [
          { label: "Dashboard", onClick: () => go("dashboard") },
          { label: "General Settings", current: true },
        ];
      case "hero":
        return [
          { label: "Dashboard", onClick: () => go("dashboard") },
          { label: "Hero", current: true },
        ];
      case "appearance":
        return [
          { label: "Dashboard", onClick: () => go("dashboard") },
          { label: "Appearance", current: true },
        ];
      case "experience":
        return [
          { label: "Dashboard", onClick: () => go("dashboard") },
          { label: "Experience", current: true },
        ];
      case "experience-edit":
        return [
          { label: "Dashboard", onClick: () => go("dashboard") },
          { label: "Experience", onClick: () => go("experience") },
          {
            label: job ? (job.role === "New role" ? "Add New Experience" : job.role || "Untitled Role") : "Edit Experience",
            current: true,
          },
        ];
      case "projects":
        return [
          { label: "Dashboard", onClick: () => go("dashboard") },
          { label: "Projects", current: true },
        ];
      case "projects-edit":
        return [
          { label: "Dashboard", onClick: () => go("dashboard") },
          { label: "Projects", onClick: () => go("projects") },
          {
            label: project ? (project.name === "New project" ? "Add New Project" : project.name || "Untitled Project") : "Edit Project",
            current: true,
          },
        ];
      case "skills":
        return [
          { label: "Dashboard", onClick: () => go("dashboard") },
          { label: "Skills", current: true },
        ];
      case "memories":
        return [
          { label: "Dashboard", onClick: () => go("dashboard") },
          { label: "Memory Jar", current: true },
        ];
      case "memories-edit":
        return [
          { label: "Dashboard", onClick: () => go("dashboard") },
          { label: "Memory Jar", onClick: () => go("memories") },
          {
            label: memory ? (memory.title === "New memory" ? "Add New Memory" : memory.title || "Untitled Memory") : "Edit Memory",
            current: true,
          },
        ];
      default:
        return [{ label: "Dashboard", current: true }];
    }
  }, [screen, job, project, memory]);

  return (
    <div className={`wp-app${menuOpen ? " is-menu-open" : ""}`}>
      <header className="wp-bar">
        <div className="wp-bar-left">
          <button
            type="button"
            className="wp-bar-item wp-bar-fold"
            aria-label="Menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <IconMenu />
          </button>
          <Link href="/" className="wp-bar-item" title="View site">
            <LogoMark className="h-5 w-5" />
            <span>{site.name}</span>
          </Link>
          <Link href="/" className="wp-bar-item">
            <IconHome className="wp-menu-icon" />
            <span>Visit Site</span>
          </Link>
          <div className="wp-drop">
            <button type="button" className="wp-bar-item">
              <IconPlus />
              New
            </button>
            <div className="wp-drop-menu">
              <button type="button" onClick={addExperience}>
                Experience
              </button>
              <button type="button" onClick={addProject}>
                Project
              </button>
              <button type="button" onClick={addMemory}>
                Memory
              </button>
            </div>
          </div>
        </div>
        <div className="wp-bar-right">
          <button type="button" className="wp-bar-item" onClick={() => void save()} disabled={!dirty || status === "saving"}>
            {status === "saving" ? "Updating…" : dirty ? "Update" : "Updated"}
          </button>
          <span className="wp-bar-item">Howdy, {firstName}</span>
          <button type="button" className="wp-bar-item" onClick={() => void logout()}>
            Log Out
          </button>
        </div>
      </header>

      <div className="wp-layout">
        <aside className="wp-menu">
          <ul className="wp-menu-list">
            {menu.map((item) => (
              <li key={item.id} className={item.match ? "is-current" : undefined}>
                <button type="button" onClick={() => go(item.id)}>
                  {item.icon}
                  {item.label}
                </button>
              </li>
            ))}
            <li className="wp-menu-sep" />
            <li>
              <Link href="/memories" target="_blank">
                <IconJar />
                Memory Jar
              </Link>
            </li>
            <li>
              <Link href="/">
                <IconHome />
                View Site
              </Link>
            </li>
          </ul>
        </aside>

        <main className="wp-content">
          <Breadcrumbs items={breadcrumbs} />
          {error ? <div className="wp-notice is-error">{error}</div> : null}
          {notice && !error ? <div className="wp-notice is-success">{notice}</div> : null}

          {screen === "dashboard" ? (
            <>
              <h1 className="wp-screen-title">Dashboard</h1>
              <p className="wp-sub">Welcome to your portfolio admin.</p>
              <div className="wp-widgets">
                <Metabox id="dash_glance" title="At a Glance">
                  <ul className="wp-glance">
                    <li>
                      <button type="button" onClick={() => go("experience")}>
                        {data.experience.length} Experience
                      </button>
                    </li>
                    <li>
                      <button type="button" onClick={() => go("projects")}>
                        {data.projects.length} Projects
                      </button>
                    </li>
                    <li>
                      <button type="button" onClick={() => go("skills")}>
                        {data.skills.reduce((n, g) => n + g.items.length, 0)} Skills
                      </button>
                    </li>
                    <li>
                      <button type="button" onClick={() => go("memories")}>
                        {memoriesList.length} Memories
                      </button>
                    </li>
                    <li>
                      <button type="button" onClick={() => go("hero")}>
                        Hero
                      </button>
                    </li>
                    <li>
                      <button type="button" onClick={() => go("appearance")}>
                        Appearance
                      </button>
                    </li>
                  </ul>
                </Metabox>
                <Metabox id="dash_identity" title="Site identity">
                  <p>
                    <strong>{site.name}</strong>
                    <br />
                    {site.title}
                  </p>
                  <p style={{ marginTop: 12 }}>
                    <button type="button" className="wp-btn wp-btn-primary" onClick={() => go("site")}>
                      Edit settings
                    </button>
                  </p>
                </Metabox>
                <Metabox id="dash_draft" title="Quick draft">
                  <p className="wp-sub" style={{ marginBottom: 12 }}>
                    Add a new role, project, or memory without leaving the dashboard.
                  </p>
                  <button type="button" className="wp-btn" onClick={addExperience} style={{ marginRight: 8 }}>
                    Add experience
                  </button>
                  <button type="button" className="wp-btn" onClick={addProject} style={{ marginRight: 8 }}>
                    Add project
                  </button>
                  <button type="button" className="wp-btn" onClick={addMemory}>
                    Add memory
                  </button>
                </Metabox>
              </div>
            </>
          ) : null}

          {screen === "site" ? (
            <>
              <h1 className="wp-screen-title">General Settings</h1>
              <p className="wp-sub">These fields appear on the public portfolio.</p>
              <SectionTools
                onExpandAll={() =>
                  expandAll(["site_identity", "site_hero", "site_about", "site_stats", "site_contact"])
                }
                onCollapseAll={() =>
                  collapseAll(["site_identity", "site_hero", "site_about", "site_stats", "site_contact"])
                }
              />
              <Metabox id="site_identity" title="Identity" isOpen={sectionState["site_identity"]}>
                <table className="wp-form-table">
                  <tbody>
                    <Field label="Site title">
                      <TextInput value={site.name} onChange={(name) => setData({ ...data, site: { ...site, name } })} />
                    </Field>
                    <Field label="Initials">
                      <TextInput
                        value={site.initials}
                        onChange={(initials) => setData({ ...data, site: { ...site, initials } })}
                      />
                    </Field>
                    <Field label="Browser title">
                      <TextInput value={site.title} onChange={(title) => setData({ ...data, site: { ...site, title } })} />
                    </Field>
                    <Field label="Tagline" wide>
                      <TextArea
                        value={site.description}
                        onChange={(description) => setData({ ...data, site: { ...site, description } })}
                        rows={3}
                      />
                    </Field>
                  </tbody>
                </table>
              </Metabox>
              <Metabox
                id="site_hero"
                title="Hero"
                badge={HERO_TEMPLATES.find((t) => t.id === site.heroTemplate)?.name}
                isOpen={sectionState["site_hero"]}
              >
                <p style={{ margin: "0 0 12px" }}>
                  Live template: <strong>{HERO_TEMPLATES.find((t) => t.id === site.heroTemplate)?.name}</strong>
                  {" · "}
                  <button type="button" className="wp-add" onClick={() => go("hero")}>
                    Change layout
                  </button>
                </p>
                <table className="wp-form-table">
                  <tbody>
                    <Field label="Kicker">
                      <TextInput value={site.kicker} onChange={(kicker) => setData({ ...data, site: { ...site, kicker } })} />
                    </Field>
                    <Field label="Greeting">
                      <TextInput
                        value={site.greeting}
                        onChange={(greeting) => setData({ ...data, site: { ...site, greeting } })}
                      />
                    </Field>
                    <Field label="Typed roles" wide>
                      <StringList
                        values={site.roles}
                        onChange={(roles) => setData({ ...data, site: { ...site, roles } })}
                        addLabel="Add role"
                        placeholder="Product Manager"
                      />
                    </Field>
                    <Field label="One-liner" wide>
                      <TextArea value={site.line} onChange={(line) => setData({ ...data, site: { ...site, line } })} rows={3} />
                    </Field>
                    <Field
                      label="Piano Music YouTube URL"
                      wide
                      hint={pianoMusicHint(site.pianoYoutubeUrl ?? "")}
                    >
                      <TextInput
                        value={site.pianoYoutubeUrl ?? ""}
                        onChange={(pianoYoutubeUrl) =>
                          setData({ ...data, site: { ...site, pianoYoutubeUrl } })
                        }
                        placeholder="https://www.youtube.com/watch?v=…"
                      />
                    </Field>
                    <Field label="Goodreads profile URL" wide hint={goodreadsHint(site.goodreadsUrl ?? "")}>
                      <TextInput
                        value={site.goodreadsUrl ?? ""}
                        onChange={(goodreadsUrl) => setData({ ...data, site: { ...site, goodreadsUrl } })}
                        placeholder="https://www.goodreads.com/user/show/…"
                      />
                    </Field>
                  </tbody>
                </table>
              </Metabox>
              <Metabox id="site_about" title="About" isOpen={sectionState["site_about"]}>
                <table className="wp-form-table">
                  <tbody>
                    <Field label="About" wide>
                      <TextArea value={site.about} onChange={(about) => setData({ ...data, site: { ...site, about } })} rows={6} />
                    </Field>
                    <Field label="Philosophy kicker">
                      <TextInput
                        value={site.philosophyKicker}
                        onChange={(philosophyKicker) => setData({ ...data, site: { ...site, philosophyKicker } })}
                      />
                    </Field>
                    <Field label="Philosophy title">
                      <TextInput
                        value={site.philosophyTitle}
                        onChange={(philosophyTitle) => setData({ ...data, site: { ...site, philosophyTitle } })}
                      />
                    </Field>
                    <Field label="Philosophy" wide>
                      <TextArea
                        value={site.philosophy}
                        onChange={(philosophy) => setData({ ...data, site: { ...site, philosophy } })}
                        rows={4}
                      />
                    </Field>
                    <Field label="Experience intro" wide>
                      <TextArea
                        value={site.experienceIntro}
                        onChange={(experienceIntro) => setData({ ...data, site: { ...site, experienceIntro } })}
                        rows={3}
                      />
                    </Field>
                  </tbody>
                </table>
              </Metabox>
              <Metabox
                id="site_stats"
                title="Stats"
                badge={`${site.stats.length} ${site.stats.length === 1 ? "stat" : "stats"}`}
                isOpen={sectionState["site_stats"]}
              >
                {site.stats.map((stat, i) => (
                  <div key={i} className="row" style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <input
                      type="number"
                      min={0}
                      value={stat.value}
                      className="wp-input wp-input-small"
                      onChange={(e) => {
                        const stats = [...site.stats];
                        stats[i] = { ...stat, value: Number(e.target.value) };
                        setData({ ...data, site: { ...site, stats } });
                      }}
                    />
                    <TextInput
                      value={stat.suffix}
                      placeholder="+"
                      small
                      onChange={(suffix) => {
                        const stats = [...site.stats];
                        stats[i] = { ...stat, suffix };
                        setData({ ...data, site: { ...site, stats } });
                      }}
                    />
                    <TextInput
                      value={stat.label}
                      onChange={(label) => {
                        const stats = [...site.stats];
                        stats[i] = { ...stat, label };
                        setData({ ...data, site: { ...site, stats } });
                      }}
                    />
                    <button
                      type="button"
                      className="wp-btn"
                      disabled={i === 0}
                      title="Move stat up"
                      onClick={() => {
                        const stats = move(site.stats, i, -1);
                        setData({ ...data, site: { ...site, stats } });
                      }}
                      style={{ padding: "0 8px" }}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="wp-btn"
                      disabled={i === site.stats.length - 1}
                      title="Move stat down"
                      onClick={() => {
                        const stats = move(site.stats, i, 1);
                        setData({ ...data, site: { ...site, stats } });
                      }}
                      style={{ padding: "0 8px" }}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="wp-btn"
                      onClick={() =>
                        setData({ ...data, site: { ...site, stats: site.stats.filter((_, j) => j !== i) } })
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="wp-add"
                  onClick={() =>
                    setData({
                      ...data,
                      site: { ...site, stats: [...site.stats, { value: 0, suffix: "+", label: "New stat" }] },
                    })
                  }
                >
                  + Add stat
                </button>
              </Metabox>
              <Metabox id="site_contact" title="Contact" isOpen={sectionState["site_contact"]}>
                <table className="wp-form-table">
                  <tbody>
                    <Field label="Contact line">
                      <TextInput
                        value={site.contactLine}
                        onChange={(contactLine) => setData({ ...data, site: { ...site, contactLine } })}
                      />
                    </Field>
                    <Field label="Email">
                      <TextInput
                        type="email"
                        value={site.email}
                        onChange={(email) => setData({ ...data, site: { ...site, email } })}
                      />
                    </Field>
                    <Field label="Resume URL">
                      <TextInput value={site.resume} onChange={(resume) => setData({ ...data, site: { ...site, resume } })} />
                    </Field>
                    <Field label="LinkedIn">
                      <TextInput
                        value={site.linkedin}
                        onChange={(linkedin) => setData({ ...data, site: { ...site, linkedin } })}
                      />
                    </Field>
                    <Field label="GitHub">
                      <TextInput value={site.github} onChange={(github) => setData({ ...data, site: { ...site, github } })} />
                    </Field>
                  </tbody>
                </table>
              </Metabox>
              <p>
                <button type="button" className="wp-btn wp-btn-primary wp-btn-large" onClick={() => void save()} disabled={!dirty}>
                  Save Changes
                </button>
              </p>
            </>
          ) : null}

          {screen === "hero" ? (
            <>
              <h1 className="wp-screen-title">Hero</h1>
              <p className="wp-sub">
                Pick one template. Only the live layout appears on the public site. Copy is shared across all of them.{" "}
                <a href="/" target="_blank" rel="noreferrer">
                  Preview site
                </a>
              </p>
              <SectionTools
                onExpandAll={() => expandAll(["hero_templates", "hero_media", "hero_world", "hero_copy"])}
                onCollapseAll={() => collapseAll(["hero_templates", "hero_media", "hero_world", "hero_copy"])}
              />
              <Metabox
                id="hero_templates"
                title="Templates"
                badge={HERO_TEMPLATES.find((t) => t.id === site.heroTemplate)?.name}
                isOpen={sectionState["hero_templates"]}
              >
                <div className="wp-template-grid">
                  {HERO_TEMPLATES.map((tpl) => {
                    const live = site.heroTemplate === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        className={`wp-template-card${live ? " is-live" : ""}`}
                        onClick={() =>
                          setData({ ...data, site: { ...site, heroTemplate: tpl.id } })
                        }
                      >
                        <HeroThumb id={tpl.id} site={site} theme={data.theme} />
                        <div className="wp-template-meta">
                          <h3>{tpl.name}</h3>
                          <p>{tpl.description}</p>
                          {live ? (
                            <span className="wp-live-badge">Live</span>
                          ) : (
                            <span className="wp-btn wp-btn-primary">Activate</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Metabox>
              <Metabox
                id="hero_media"
                title="Media"
                badge={heroMedia.kind !== "none" ? `${heroMedia.kind} (${heroMedia.place})` : "none"}
                isOpen={sectionState["hero_media"]}
              >
                <MediaLayoutPreview site={site} theme={data.theme} media={heroMedia} />
                {(site.heroTemplate === "world" || site.heroTemplate === "nook") && heroMedia.kind !== "none" ? (
                  <p className="wp-description" style={{ margin: "0 0 12px" }}>
                    A 3D hero is live, so this media is hidden on the public site until you activate another
                    template.
                  </p>
                ) : null}
                <table className="wp-form-table">
                  <tbody>
                    <tr>
                      <th scope="row">Type</th>
                      <td>
                        {(["none", "image", "video"] as const).map((kind) => (
                          <label key={kind} className="wp-check">
                            <input
                              type="radio"
                              name="heroMediaKind"
                              checked={heroMedia.kind === kind}
                              onChange={() => setHeroMedia({ kind })}
                            />
                            {kind === "none" ? "None" : kind === "image" ? "Image" : "Video"}
                          </label>
                        ))}
                      </td>
                    </tr>
                    {heroMedia.kind !== "none" ? (
                      <>
                        <tr>
                          <th scope="row">Placement</th>
                          <td>
                            <label className="wp-check">
                              <input
                                type="radio"
                                name="heroMediaPlace"
                                checked={heroMedia.place === "side"}
                                onChange={() => setHeroMedia({ place: "side" })}
                              />
                              Side
                            </label>
                            <label className="wp-check">
                              <input
                                type="radio"
                                name="heroMediaPlace"
                                checked={heroMedia.place === "background"}
                                onChange={() => setHeroMedia({ place: "background" })}
                              />
                              Background
                            </label>
                          </td>
                        </tr>
                        {heroMedia.place === "side" ? (
                          <tr>
                            <th scope="row">Side</th>
                            <td>
                              <label className="wp-check">
                                <input
                                  type="radio"
                                  name="heroMediaSide"
                                  checked={heroMedia.side === "left"}
                                  onChange={() => setHeroMedia({ side: "left" })}
                                />
                                Left
                              </label>
                              <label className="wp-check">
                                <input
                                  type="radio"
                                  name="heroMediaSide"
                                  checked={heroMedia.side === "right"}
                                  onChange={() => setHeroMedia({ side: "right" })}
                                />
                                Right
                              </label>
                            </td>
                          </tr>
                        ) : null}
                        <Field label="File" hint="JPG, PNG, WebP, GIF, MP4, or WebM. Max 25MB.">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/ogg"
                            disabled={uploading}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) void uploadHeroFile(file);
                              e.target.value = "";
                            }}
                          />
                          {uploading ? <span className="wp-description">Uploading…</span> : null}
                        </Field>
                        <Field
                          label="URL"
                          hint={
                            mediaHint(heroMedia.url) ||
                            "YouTube, Vimeo, a Pexels video page, a direct .mp4, or an uploaded file."
                          }
                        >
                          <TextInput
                            value={heroMedia.url}
                            onChange={(url) => setHeroMedia({ url })}
                            placeholder="https://www.pexels.com/video/…"
                          />
                        </Field>
                        {heroMedia.url ? (
                          <tr>
                            <th scope="row">Asset</th>
                            <td>
                              <div className="wp-media-preview">
                                <MediaVisual media={heroMedia} />
                              </div>
                              <p style={{ marginTop: 8 }}>
                                <button
                                  type="button"
                                  className="wp-btn-link"
                                  onClick={() => setHeroMedia({ kind: "none", url: "" })}
                                >
                                  Remove media
                                </button>
                              </p>
                            </td>
                          </tr>
                        ) : null}
                      </>
                    ) : null}
                  </tbody>
                </table>
              </Metabox>
              <Metabox id="hero_world" title="3D World" isOpen={sectionState["hero_world"]}>
                <p style={{ margin: "0 0 12px" }}>
                  Used when a 3D hero is live. The piano plays this track in the page — visitors never leave the
                  site. Books open the reading page.
                </p>
                <table className="wp-form-table">
                  <tbody>
                    <Field label="Piano Music YouTube URL" wide hint={pianoMusicHint(site.pianoYoutubeUrl ?? "")}>
                      <TextInput
                        value={site.pianoYoutubeUrl ?? ""}
                        onChange={(pianoYoutubeUrl) =>
                          setData({ ...data, site: { ...site, pianoYoutubeUrl } })
                        }
                        placeholder="https://www.youtube.com/watch?v=…"
                      />
                    </Field>
                    <Field label="Goodreads profile URL" wide hint={goodreadsHint(site.goodreadsUrl ?? "")}>
                      <TextInput
                        value={site.goodreadsUrl ?? ""}
                        onChange={(goodreadsUrl) => setData({ ...data, site: { ...site, goodreadsUrl } })}
                        placeholder="https://www.goodreads.com/user/show/…"
                      />
                    </Field>
                  </tbody>
                </table>
              </Metabox>
              <Metabox id="hero_copy" title="Hero copy" isOpen={sectionState["hero_copy"]}>
                <table className="wp-form-table">
                  <tbody>
                    <Field label="Kicker">
                      <TextInput
                        value={site.kicker}
                        onChange={(kicker) => setData({ ...data, site: { ...site, kicker } })}
                      />
                    </Field>
                    <Field label="Greeting">
                      <TextInput
                        value={site.greeting}
                        onChange={(greeting) => setData({ ...data, site: { ...site, greeting } })}
                      />
                    </Field>
                    <Field label="Typed roles" wide>
                      <StringList
                        values={site.roles}
                        onChange={(roles) => setData({ ...data, site: { ...site, roles } })}
                        addLabel="Add role"
                        placeholder="Product Manager"
                      />
                    </Field>
                    <Field label="One-liner" wide>
                      <TextArea
                        value={site.line}
                        onChange={(line) => setData({ ...data, site: { ...site, line } })}
                        rows={3}
                      />
                    </Field>
                  </tbody>
                </table>
              </Metabox>
              <p>
                <button
                  type="button"
                  className="wp-btn wp-btn-primary wp-btn-large"
                  onClick={() => void save()}
                  disabled={!dirty}
                >
                  Save Changes
                </button>
              </p>
            </>
          ) : null}

          {screen === "appearance" ? (
            <>
              <h1 className="wp-screen-title">Appearance</h1>
              <p className="wp-sub">Colors and light/dark behavior for the public site. Each hex field shows a live preview.</p>
              <SectionTools
                onExpandAll={() =>
                  expandAll(["app_preview", "app_options", "app_brand", "app_palette_dark", "app_palette_light"])
                }
                onCollapseAll={() =>
                  collapseAll(["app_preview", "app_options", "app_brand", "app_palette_dark", "app_palette_light"])
                }
              />
              <Metabox id="app_preview" title="Live Preview" isOpen={sectionState["app_preview"]}>
                <AppearancePreview theme={data.theme} site={site} />
              </Metabox>
              <Metabox
                id="app_options"
                title="Theme options"
                badge={data.theme.defaultMode}
                isOpen={sectionState["app_options"]}
              >
                <table className="wp-form-table">
                  <tbody>
                    <tr>
                      <th scope="row">Default theme</th>
                      <td>
                        {(["system", "dark", "light"] as ThemeMode[]).map((mode) => (
                          <label key={mode} className="wp-check">
                            <input
                              type="radio"
                              name="defaultMode"
                              checked={data.theme.defaultMode === mode}
                              onChange={() =>
                                setData({ ...data, theme: { ...data.theme, defaultMode: mode } })
                              }
                            />
                            {mode === "system" ? "Match the visitor’s system" : mode === "dark" ? "Dark" : "Light"}
                          </label>
                        ))}
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">Visitor toggle</th>
                      <td>
                        <label className="wp-check">
                          <input
                            type="checkbox"
                            checked={data.theme.allowToggle}
                            onChange={(e) =>
                              setData({ ...data, theme: { ...data.theme, allowToggle: e.target.checked } })
                            }
                          />
                          Show light/dark toggle in the header
                        </label>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Metabox>
              <Metabox id="app_brand" title="Brand colors" isOpen={sectionState["app_brand"]}>
                <table className="wp-form-table">
                  <tbody>
                    <Field label="Brand from" hint="Logo, buttons, timeline start">
                      <HexColorInput
                        value={data.theme.brandFrom}
                        onChange={(brandFrom) => setData({ ...data, theme: { ...data.theme, brandFrom } })}
                      />
                    </Field>
                    <Field label="Brand to" hint="Gradient end">
                      <HexColorInput
                        value={data.theme.brandTo}
                        onChange={(brandTo) => setData({ ...data, theme: { ...data.theme, brandTo } })}
                      />
                    </Field>
                  </tbody>
                </table>
              </Metabox>
              {(["dark", "light"] as const).map((mode) => (
                <Metabox
                  key={mode}
                  id={`app_palette_${mode}`}
                  title={mode === "dark" ? "Dark palette" : "Light palette"}
                  badge={mode}
                  isOpen={sectionState[`app_palette_${mode}`]}
                >
                  <table className="wp-form-table">
                    <tbody>
                      {THEME_PALETTE_FIELDS.map((field) => (
                        <Field key={field.key} label={field.label}>
                          <HexColorInput
                            value={data.theme[mode][field.key]}
                            onChange={(value) =>
                              setData({
                                ...data,
                                theme: {
                                  ...data.theme,
                                  [mode]: { ...data.theme[mode], [field.key]: value },
                                },
                              })
                            }
                          />
                        </Field>
                      ))}
                    </tbody>
                  </table>
                </Metabox>
              ))}
              <p>
                <button
                  type="button"
                  className="wp-btn wp-btn-primary wp-btn-large"
                  onClick={() => void save()}
                  disabled={!dirty}
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  className="wp-btn"
                  style={{ marginLeft: 8 }}
                  onClick={() => setData({ ...data, theme: structuredClone(DEFAULT_THEME) })}
                >
                  Reset to defaults
                </button>
              </p>
            </>
          ) : null}

          {screen === "experience" ? (
            <>
              <h1 className="wp-screen-title">
                Experience
                <button type="button" className="wp-btn wp-btn-primary" onClick={addExperience}>
                  Add New
                </button>
              </h1>
              <table className="wp-list-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Company</th>
                    <th>Status</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {data.experience.map((item, i) => (
                    <tr key={item.id}>
                      <td>
                        <button type="button" className="row-title" onClick={() => go("experience-edit", item.id)}>
                          {item.role || "(no title)"}
                        </button>
                        <div className="wp-row-actions">
                          <button type="button" onClick={() => go("experience-edit", item.id)}>
                            Edit
                          </button>
                          {" | "}
                          <button
                            type="button"
                            onClick={() => setData({ ...data, experience: move(data.experience, i, -1) })}
                            disabled={i === 0}
                          >
                            Up
                          </button>
                          {" | "}
                          <button
                            type="button"
                            onClick={() => setData({ ...data, experience: move(data.experience, i, 1) })}
                            disabled={i === data.experience.length - 1}
                          >
                            Down
                          </button>
                          {" | "}
                          <button
                            type="button"
                            className="trash"
                            onClick={() =>
                              setData({ ...data, experience: data.experience.filter((_, j) => j !== i) })
                            }
                          >
                            Trash
                          </button>
                        </div>
                      </td>
                      <td>{item.company}</td>
                      <td>
                        <span className={`wp-status${item.current ? " is-publish" : ""}`}>
                          {item.current ? "Current" : "Past"}
                        </span>
                      </td>
                      <td>{item.when}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : null}

          {screen === "experience-edit" && job ? (
            <>
              <h1 className="wp-screen-title">{job.role === "New role" ? "Add New Experience" : "Edit Experience"}</h1>
              <div className="wp-edit">
                <div>
                  <input
                    className="wp-title-input"
                    value={job.role}
                    placeholder="Enter title here"
                    onChange={(e) => {
                      const experience = [...data.experience];
                      experience[expIndex] = { ...job, role: e.target.value };
                      setData({ ...data, experience });
                    }}
                  />
                  <Metabox id="exp_details" title="Role details" badge={job.company || undefined}>
                    <table className="wp-form-table">
                      <tbody>
                        <Field label="Company">
                          <TextInput
                            value={job.company}
                            onChange={(company) => {
                              const experience = [...data.experience];
                              experience[expIndex] = { ...job, company };
                              setData({ ...data, experience });
                            }}
                          />
                        </Field>
                        <Field label="When">
                          <TextInput
                            value={job.when}
                            onChange={(when) => {
                              const experience = [...data.experience];
                              experience[expIndex] = { ...job, when };
                              setData({ ...data, experience });
                            }}
                          />
                        </Field>
                        <Field label="Summary" wide>
                          <TextArea
                            value={job.summary}
                            onChange={(summary) => {
                              const experience = [...data.experience];
                              experience[expIndex] = { ...job, summary };
                              setData({ ...data, experience });
                            }}
                          />
                        </Field>
                        <Field label="Bullets" wide>
                          <StringList
                            values={job.bullets}
                            onChange={(bullets) => {
                              const experience = [...data.experience];
                              experience[expIndex] = { ...job, bullets };
                              setData({ ...data, experience });
                            }}
                            addLabel="Add bullet"
                          />
                        </Field>
                        <Field label="Tags" wide>
                          <StringList
                            values={job.stack}
                            onChange={(stack) => {
                              const experience = [...data.experience];
                              experience[expIndex] = { ...job, stack };
                              setData({ ...data, experience });
                            }}
                            addLabel="Add tag"
                          />
                        </Field>
                      </tbody>
                    </table>
                  </Metabox>
                </div>
                <Metabox id="exp_publish" title="Publish" badge={job.current ? "Current" : "Past"}>
                  <div className="wp-publish-misc">
                    <p>
                      Status:{" "}
                      <strong>{job.current ? "Current" : "Past"}</strong>
                    </p>
                    <label className="wp-check">
                      <input
                        type="checkbox"
                        checked={job.current}
                        onChange={(e) => {
                          const experience = [...data.experience];
                          experience[expIndex] = { ...job, current: e.target.checked };
                          setData({ ...data, experience });
                        }}
                      />
                      Current role
                    </label>
                  </div>
                  <div className="wp-publish-actions">
                    <button
                      type="button"
                      className="wp-btn-link"
                      onClick={() => {
                        setData({ ...data, experience: data.experience.filter((j) => j.id !== job.id) });
                        go("experience");
                      }}
                    >
                      Move to Trash
                    </button>
                    <button type="button" className="wp-btn wp-btn-primary" onClick={() => void save()} disabled={!dirty}>
                      Update
                    </button>
                  </div>
                </Metabox>
              </div>
            </>
          ) : null}

          {screen === "projects" ? (
            <>
              <h1 className="wp-screen-title">
                Projects
                <button type="button" className="wp-btn wp-btn-primary" onClick={addProject}>
                  Add New
                </button>
              </h1>
              <table className="wp-list-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Tags</th>
                    <th>Demo</th>
                  </tr>
                </thead>
                <tbody>
                  {data.projects.map((item, i) => (
                    <tr key={item.id}>
                      <td>
                        <button type="button" className="row-title" onClick={() => go("projects-edit", item.id)}>
                          {item.name || "(no title)"}
                        </button>
                        <div className="wp-row-actions">
                          <button type="button" onClick={() => go("projects-edit", item.id)}>
                            Edit
                          </button>
                          {" | "}
                          <button type="button" onClick={() => setData({ ...data, projects: move(data.projects, i, -1) })} disabled={i === 0}>
                            Up
                          </button>
                          {" | "}
                          <button
                            type="button"
                            onClick={() => setData({ ...data, projects: move(data.projects, i, 1) })}
                            disabled={i === data.projects.length - 1}
                          >
                            Down
                          </button>
                          {" | "}
                          {item.github ? (
                            <>
                              <a href={item.github} target="_blank" rel="noreferrer">
                                GitHub
                              </a>
                              {" | "}
                            </>
                          ) : null}
                          <button
                            type="button"
                            className="trash"
                            onClick={() => setData({ ...data, projects: data.projects.filter((_, j) => j !== i) })}
                          >
                            Trash
                          </button>
                        </div>
                      </td>
                      <td>{item.tags.join(", ")}</td>
                      <td>{item.demo ? "Live" : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : null}

          {screen === "projects-edit" && project ? (
            <>
              <h1 className="wp-screen-title">{project.name === "New project" ? "Add New Project" : "Edit Project"}</h1>
              <div className="wp-edit">
                <div>
                  <input
                    className="wp-title-input"
                    value={project.name}
                    placeholder="Enter title here"
                    onChange={(e) => {
                      const projects = [...data.projects];
                      projects[projIndex] = { ...project, name: e.target.value };
                      setData({ ...data, projects });
                    }}
                  />
                  <Metabox
                    id="proj_details"
                    title="Project"
                    badge={project.tags.length ? `${project.tags.length} ${project.tags.length === 1 ? "tag" : "tags"}` : undefined}
                  >
                    <table className="wp-form-table">
                      <tbody>
                        <Field label="Description" wide>
                          <TextArea
                            value={project.blurb}
                            onChange={(blurb) => {
                              const projects = [...data.projects];
                              projects[projIndex] = { ...project, blurb };
                              setData({ ...data, projects });
                            }}
                            rows={5}
                          />
                        </Field>
                        <Field label="GitHub URL">
                          <TextInput
                            value={project.github}
                            onChange={(github) => {
                              const projects = [...data.projects];
                              projects[projIndex] = { ...project, github };
                              setData({ ...data, projects });
                            }}
                          />
                        </Field>
                        <Field label="Live demo">
                          <TextInput
                            value={project.demo}
                            onChange={(demo) => {
                              const projects = [...data.projects];
                              projects[projIndex] = { ...project, demo };
                              setData({ ...data, projects });
                            }}
                          />
                        </Field>
                        <Field label="Tags" wide>
                          <StringList
                            values={project.tags}
                            onChange={(tags) => {
                              const projects = [...data.projects];
                              projects[projIndex] = { ...project, tags };
                              setData({ ...data, projects });
                            }}
                            addLabel="Add tag"
                          />
                        </Field>
                      </tbody>
                    </table>
                  </Metabox>
                </div>
                <Metabox id="proj_publish" title="Publish" badge={project.demo ? "Live Demo" : "No Demo"}>
                  <div className="wp-publish-misc">
                    <p>
                      Demo: <strong>{project.demo ? "Live" : "None"}</strong>
                    </p>
                  </div>
                  <div className="wp-publish-actions">
                    <button
                      type="button"
                      className="wp-btn-link"
                      onClick={() => {
                        setData({ ...data, projects: data.projects.filter((p) => p.id !== project.id) });
                        go("projects");
                      }}
                    >
                      Move to Trash
                    </button>
                    <button type="button" className="wp-btn wp-btn-primary" onClick={() => void save()} disabled={!dirty}>
                      Update
                    </button>
                  </div>
                </Metabox>
              </div>
            </>
          ) : null}

          {screen === "skills" ? (
            <>
              <h1 className="wp-screen-title">
                Skills
                <button
                  type="button"
                  className="wp-btn wp-btn-primary"
                  onClick={() => setData({ ...data, skills: [...data.skills, { title: "New group", items: [] }] })}
                >
                  Add New
                </button>
              </h1>
              <SectionTools
                onExpandAll={() => expandAll(data.skills.map((_, gi) => `skill_group_${gi}`))}
                onCollapseAll={() => collapseAll(data.skills.map((_, gi) => `skill_group_${gi}`))}
              />
              {data.skills.map((group, gi) => (
                <Metabox
                  key={`${group.title}-${gi}`}
                  id={`skill_group_${gi}`}
                  title={group.title || "Skill group"}
                  badge={`${group.items.length} ${group.items.length === 1 ? "skill" : "skills"}`}
                  isOpen={sectionState[`skill_group_${gi}`]}
                  actions={
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <button
                        type="button"
                        className="wp-btn"
                        onClick={() => setData({ ...data, skills: move(data.skills, gi, -1) })}
                        disabled={gi === 0}
                        title="Move group up"
                        style={{ height: 24, lineHeight: "22px", padding: "0 6px", fontSize: 11 }}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="wp-btn"
                        onClick={() => setData({ ...data, skills: move(data.skills, gi, 1) })}
                        disabled={gi === data.skills.length - 1}
                        title="Move group down"
                        style={{ height: 24, lineHeight: "22px", padding: "0 6px", fontSize: 11 }}
                      >
                        ↓
                      </button>
                    </div>
                  }
                >
                  <table className="wp-form-table">
                    <tbody>
                      <Field label="Group title">
                        <TextInput
                          value={group.title}
                          onChange={(title) => {
                            const skills = [...data.skills];
                            skills[gi] = { ...group, title };
                            setData({ ...data, skills });
                          }}
                        />
                      </Field>
                    </tbody>
                  </table>
                  {group.items.map((item, ii) => (
                    <div
                      key={`${item.name}-${ii}`}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(120px,1.1fr) minmax(110px,0.8fr) minmax(140px,1fr) auto",
                        gap: 8,
                        marginBottom: 8,
                        alignItems: "center",
                      }}
                    >
                      <TextInput
                        value={item.name}
                        onChange={(name) => {
                          const skills = [...data.skills];
                          const items = [...group.items];
                          items[ii] = { ...item, name };
                          skills[gi] = { ...group, items };
                          setData({ ...data, skills });
                        }}
                      />
                      <select
                        className="wp-select"
                        value={item.icon}
                        onChange={(e) => {
                          const skills = [...data.skills];
                          const items = [...group.items];
                          items[ii] = { ...item, icon: e.target.value as SkillIcon };
                          skills[gi] = { ...group, items };
                          setData({ ...data, skills });
                        }}
                      >
                        {SKILL_ICONS.map((icon) => (
                          <option key={icon} value={icon}>
                            {icon}
                          </option>
                        ))}
                      </select>
                      <HexColorInput
                        value={item.color ?? ""}
                        placeholder="#61DAFB"
                        onChange={(color) => {
                          const skills = [...data.skills];
                          const items = [...group.items];
                          items[ii] = { ...item, color: color || undefined };
                          skills[gi] = { ...group, items };
                          setData({ ...data, skills });
                        }}
                      />
                      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        <button
                          type="button"
                          className="wp-btn"
                          disabled={ii === 0}
                          title="Move skill up"
                          onClick={() => {
                            const skills = [...data.skills];
                            skills[gi] = { ...group, items: move(group.items, ii, -1) };
                            setData({ ...data, skills });
                          }}
                          style={{ padding: "0 8px" }}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="wp-btn"
                          disabled={ii === group.items.length - 1}
                          title="Move skill down"
                          onClick={() => {
                            const skills = [...data.skills];
                            skills[gi] = { ...group, items: move(group.items, ii, 1) };
                            setData({ ...data, skills });
                          }}
                          style={{ padding: "0 8px" }}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          className="wp-btn"
                          onClick={() => {
                            const skills = [...data.skills];
                            skills[gi] = { ...group, items: group.items.filter((_, j) => j !== ii) };
                            setData({ ...data, skills });
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  <p>
                    <button
                      type="button"
                      className="wp-add"
                      onClick={() => {
                        const skills = [...data.skills];
                        skills[gi] = { ...group, items: [...group.items, { name: "New skill", icon: "empty" }] };
                        setData({ ...data, skills });
                      }}
                    >
                      + Add skill
                    </button>
                    {" · "}
                    <button
                      type="button"
                      className="wp-add"
                      onClick={() => setData({ ...data, skills: move(data.skills, gi, -1) })}
                    >
                      Move up
                    </button>
                    {" · "}
                    <button
                      type="button"
                      className="wp-add"
                      onClick={() => setData({ ...data, skills: move(data.skills, gi, 1) })}
                    >
                      Move down
                    </button>
                    {" · "}
                    <button
                      type="button"
                      className="wp-btn-link"
                      onClick={() => setData({ ...data, skills: data.skills.filter((_, j) => j !== gi) })}
                    >
                      Trash group
                    </button>
                  </p>
                </Metabox>
              ))}
              <p>
                <button type="button" className="wp-btn wp-btn-primary wp-btn-large" onClick={() => void save()} disabled={!dirty}>
                  Save Changes
                </button>
              </p>
            </>
          ) : null}

          {screen === "memories" ? (
            <>
              <h1 className="wp-screen-title">
                Memory Jar
                <button type="button" className="wp-btn wp-btn-primary" onClick={addMemory}>
                  Add New
                </button>
                <Link href="/memories" target="_blank" className="wp-btn" style={{ marginLeft: 8 }}>
                  View Live Jar ↗
                </Link>
              </h1>
              <p className="wp-sub">
                Memories hidden inside your interactive Memory Jar. When visitors tap the jar, memories are unlocked one by one.
              </p>
              <table className="wp-list-table">
                <thead>
                  <tr>
                    <th>Memory</th>
                    <th>Category</th>
                    <th>When</th>
                    <th>Photo</th>
                  </tr>
                </thead>
                <tbody>
                  {memoriesList.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", padding: "2rem", color: "#666" }}>
                        No memories in the jar yet.{" "}
                        <button type="button" className="wp-btn wp-btn-primary" onClick={addMemory}>
                          Add your first memory
                        </button>
                      </td>
                    </tr>
                  ) : (
                    memoriesList.map((item, i) => (
                      <tr key={item.id}>
                        <td>
                          <button type="button" className="row-title" onClick={() => go("memories-edit", item.id)}>
                            <span style={{ marginRight: 6, display: "inline-block" }}>{item.icon || "✨"}</span>
                            {item.title || item.note.slice(0, 30) || "(untitled memory)"}
                          </button>
                          <div style={{ fontSize: "0.85rem", color: "#646970", marginTop: 2, maxHeight: "2.4em", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {item.note || "(empty note)"}
                          </div>
                          <div className="wp-row-actions">
                            <button type="button" onClick={() => go("memories-edit", item.id)}>
                              Edit
                            </button>
                            {" | "}
                            <button
                              type="button"
                              onClick={() => setData({ ...data, memories: move(memoriesList, i, -1) })}
                              disabled={i === 0}
                            >
                              Up
                            </button>
                            {" | "}
                            <button
                              type="button"
                              onClick={() => setData({ ...data, memories: move(memoriesList, i, 1) })}
                              disabled={i === memoriesList.length - 1}
                            >
                              Down
                            </button>
                            {" | "}
                            <button
                              type="button"
                              className="trash"
                              onClick={() =>
                                setData({ ...data, memories: memoriesList.filter((_, j) => j !== i) })
                              }
                            >
                              Trash
                            </button>
                          </div>
                        </td>
                        <td>
                          {item.category ? (
                            <span className="wp-status is-publish" style={{ fontSize: "0.75rem" }}>
                              {item.category}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>{item.date || "—"}</td>
                        <td>
                          {item.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.photoUrl}
                              alt=""
                              style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 4 }}
                            />
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </>
          ) : null}

          {screen === "memories-edit" && memory ? (
            <>
              <h1 className="wp-screen-title">
                {memory.title === "New memory" ? "Add New Memory" : `Edit Memory: ${memory.title || "Untitled"}`}
              </h1>
              <div className="wp-edit">
                <div>
                  <input
                    className="wp-title-input"
                    value={memory.title ?? ""}
                    placeholder="Enter memory title (optional)"
                    onChange={(e) => {
                      const memories = [...memoriesList];
                      memories[memIndex] = { ...memory, title: e.target.value };
                      setData({ ...data, memories });
                    }}
                  />
                  <Metabox id="mem_details" title="Memory Content" badge={memory.category || undefined}>
                    <table className="wp-form-table">
                      <tbody>
                        <Field label="Memory Note" wide hint="The story, feeling, or moment that will appear when this memory is revealed.">
                          <TextArea
                            value={memory.note}
                            rows={6}
                            placeholder="Describe this moment, what made it special, or what you learned..."
                            onChange={(note) => {
                              const memories = [...memoriesList];
                              memories[memIndex] = { ...memory, note };
                              setData({ ...data, memories });
                            }}
                          />
                        </Field>
                        <Field label="Date / When" hint="e.g. Summer 2023, Rainy Tuesday, First launch">
                          <TextInput
                            value={memory.date ?? ""}
                            placeholder="e.g. Autumn 2024"
                            onChange={(date) => {
                              const memories = [...memoriesList];
                              memories[memIndex] = { ...memory, date };
                              setData({ ...data, memories });
                            }}
                          />
                        </Field>
                        <Field label="Category">
                          <div>
                            <TextInput
                              value={memory.category ?? ""}
                              placeholder="e.g. Milestone, Tiny Joy, Craft, Life"
                              onChange={(category) => {
                                const memories = [...memoriesList];
                                memories[memIndex] = { ...memory, category };
                                setData({ ...data, memories });
                              }}
                            />
                            <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
                              {["Milestone", "Tiny Joy", "Craft", "Discovery", "Learning", "Life"].map((cat) => (
                                <button
                                  key={cat}
                                  type="button"
                                  className="wp-btn"
                                  style={{ fontSize: "0.75rem", padding: "2px 8px" }}
                                  onClick={() => {
                                    const memories = [...memoriesList];
                                    memories[memIndex] = { ...memory, category: cat };
                                    setData({ ...data, memories });
                                  }}
                                >
                                  {cat}
                                </button>
                              ))}
                            </div>
                          </div>
                        </Field>
                        <Field label="Icon / Emoji" hint="Displayed on the star capsule and card header">
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <TextInput
                              value={memory.icon ?? "✨"}
                              placeholder="✨"
                              small
                              onChange={(icon) => {
                                const memories = [...memoriesList];
                                memories[memIndex] = { ...memory, icon };
                                setData({ ...data, memories });
                              }}
                            />
                            <div style={{ display: "flex", gap: 4 }}>
                              {["✨", "⭐", "🚀", "🎹", "💡", "☕", "🌱", "🎨", "💖", "📖"].map((em) => (
                                <button
                                  key={em}
                                  type="button"
                                  className="wp-btn"
                                  style={{ padding: "4px 8px", fontSize: "1rem" }}
                                  onClick={() => {
                                    const memories = [...memoriesList];
                                    memories[memIndex] = { ...memory, icon: em };
                                    setData({ ...data, memories });
                                  }}
                                >
                                  {em}
                                </button>
                              ))}
                            </div>
                          </div>
                        </Field>
                        <Field label="Glow Accent Color" hint="Custom glow/highlight color for this memory card">
                          <HexColorInput
                            value={memory.color ?? "#A78BFA"}
                            onChange={(color) => {
                              const memories = [...memoriesList];
                              memories[memIndex] = { ...memory, color };
                              setData({ ...data, memories });
                            }}
                          />
                        </Field>
                        <Field label="Photo Attachment" hint="Optional polaroid-style image for this memory">
                          <div>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploading}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) void uploadMemoryPhoto(file, memory.id);
                                e.target.value = "";
                              }}
                            />
                            {uploading ? <span className="wp-description" style={{ marginLeft: 8 }}>Uploading…</span> : null}
                            <div style={{ marginTop: 8 }}>
                              <TextInput
                                value={memory.photoUrl ?? ""}
                                placeholder="Or enter an image URL: https://…"
                                onChange={(photoUrl) => {
                                  const memories = [...memoriesList];
                                  memories[memIndex] = { ...memory, photoUrl };
                                  setData({ ...data, memories });
                                }}
                              />
                            </div>
                            {memory.photoUrl ? (
                              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 12 }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={memory.photoUrl}
                                  alt="Memory preview"
                                  style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid #ccc" }}
                                />
                                <button
                                  type="button"
                                  className="wp-btn-link"
                                  onClick={() => {
                                    const memories = [...memoriesList];
                                    memories[memIndex] = { ...memory, photoUrl: "" };
                                    setData({ ...data, memories });
                                  }}
                                >
                                  Remove photo
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </Field>
                      </tbody>
                    </table>
                  </Metabox>
                </div>
                <Metabox id="mem_publish" title="Publish">
                  <div className="wp-publish-actions">
                    <button
                      type="button"
                      className="wp-btn-link"
                      onClick={() => {
                        setData({ ...data, memories: memoriesList.filter((m) => m.id !== memory.id) });
                        go("memories");
                      }}
                    >
                      Move to Trash
                    </button>
                    <button type="button" className="wp-btn wp-btn-primary" onClick={() => void save()} disabled={!dirty}>
                      Update
                    </button>
                  </div>
                </Metabox>
              </div>
            </>
          ) : null}

          <p className="wp-sub" style={{ marginTop: 28 }}>
            Saves to <code>src/content/data.json</code>. Commit that file when you deploy.
          </p>
        </main>
      </div>
    </div>
  );
}
