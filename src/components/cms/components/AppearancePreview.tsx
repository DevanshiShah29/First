"use client";

// External dependencies
import { useState } from "react";

// Application services & types
import type { SiteContent, ThemeContent } from "@/content/types";

export function AppearancePreview({
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
