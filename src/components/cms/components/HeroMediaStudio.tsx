"use client";

// Application services & types
import {
  CURATED_HERO_ARTWORKS,
  CURATED_HERO_PRESETS,
  findCuratedArtwork,
  resolveHeroOverlay,
  type CuratedHeroArtwork,
  type CuratedHeroPreset,
} from "@/components/hero/hero-overlay";
import type { HeroMedia, HeroOverlayMode } from "@/content/types";

// UI components
import { CmsOverlay } from "./CmsOverlay";
import { overlaySummary } from "./OverlayControls";

/**
 * Metabox badge for the current hero media.
 * @example heroMediaBadge(media) // "Golden Hour Studio"
 */
export function heroMediaBadge(media: HeroMedia): string {
  if (media.kind === "none") return "none";
  const artwork = media.kind === "image" ? findCuratedArtwork(media.url) : undefined;
  if (artwork) return artwork.name;
  const place = media.place === "background" ? "background" : media.side === "left" ? "left" : "right";
  return media.kind === "video" ? `Video · ${place}` : `Custom · ${place}`;
}

/**
 * True when the current layout matches a curated preset.
 * @example presetMatches(media, preset) // false
 */
function presetMatches(media: HeroMedia, preset: CuratedHeroPreset): boolean {
  if (media.kind === "none" || !media.url.trim()) return false;
  if (media.place !== preset.settings.place) return false;
  if (preset.settings.place === "side") {
    return (media.side ?? "right") === (preset.settings.side ?? "right");
  }
  const overlay = resolveHeroOverlay(media);
  if (overlay.style !== preset.settings.overlayStyle || overlay.blur !== preset.settings.overlayBlur) {
    return false;
  }
  if (preset.settings.overlayStyle === "none") return true;
  return overlay.color === preset.settings.overlayColor && overlay.opacity === preset.settings.overlayOpacity;
}

/**
 * Status line for the media studio.
 * @example mediaStatus(media, artwork) // { title, detail }
 */
function mediaStatus(
  media: HeroMedia,
  artwork: CuratedHeroArtwork | undefined,
  preset: CuratedHeroPreset | undefined,
): { title: string; detail: string } {
  if (media.kind === "none") {
    return media.url.trim()
      ? {
          title: "File saved, not shown",
          detail: "Choose Image or Video below to put it on the hero.",
        }
      : { title: "No media yet", detail: "Pick a visual, or upload your own below." };
  }
  const title = artwork?.name ?? (media.kind === "video" ? "Custom video" : "Custom image");
  const place =
    media.place === "background" ? "Background" : media.side === "left" ? "Side, left" : "Side, right";
  if (media.place !== "background") return { title, detail: place };
  const overlay = resolveHeroOverlay(media);
  const layout = preset?.name ?? overlaySummary(overlay.style, overlay.opacity, overlay.color, overlay.blur);
  return { title, detail: `${place} · ${layout}` };
}

/**
 * Curated hero visuals and layout presets. Presets never replace a saved file.
 * @example <HeroMediaStudio media={media} themeBackground="#080808" hiddenOnSite={false} onChange={setHeroMedia} />
 */
export function HeroMediaStudio({
  media,
  themeBackground,
  hiddenOnSite,
  onChange,
}: {
  media: HeroMedia;
  themeBackground: string;
  hiddenOnSite: boolean;
  onChange: (patch: Partial<HeroMedia>) => void;
}) {
  const artwork = media.kind === "image" ? findCuratedArtwork(media.url) : undefined;
  const activePreset = CURATED_HERO_PRESETS.find((preset) => presetMatches(media, preset));
  const shown = media.kind !== "none" && Boolean(media.url.trim());
  const status = mediaStatus(media, artwork, activePreset);
  const previewSrc = media.kind === "image" && media.url.trim() ? media.url : undefined;
  const usingOwnFile = shown && !artwork;

  /**
   * Applies a layout preset without replacing a file the editor already has.
   * @example applyPreset(preset) // void
   */
  function applyPreset(preset: CuratedHeroPreset) {
    const keepUrl = Boolean(media.url.trim());
    onChange({
      kind: keepUrl && media.kind === "video" ? "video" : "image",
      ...(keepUrl ? {} : { url: CURATED_HERO_ARTWORKS[0]?.desktopSrc ?? "" }),
      place: preset.settings.place,
      side: preset.settings.side ?? media.side ?? "right",
      overlay: preset.settings.overlayStyle !== "none",
      overlayStyle: preset.settings.overlayStyle,
      overlayOpacity: preset.settings.overlayOpacity,
      overlayColor: preset.settings.overlayColor,
      overlayBlur: preset.settings.overlayBlur,
      overlayMode: preset.settings.overlayStyle as HeroOverlayMode,
    });
  }

  return (
    <div className="wp-hero-media-studio">
      {hiddenOnSite ? (
        <div className="wp-notice is-info">
          A 3D hero is live, so this image or video stays hidden until you activate another template.
        </div>
      ) : null}
      <div className="wp-hero-media-status">
        <div>
          <strong>{status.title}</strong>
          <p>{status.detail}</p>
        </div>
        {shown ? (
          <span className={hiddenOnSite ? "wp-metabox-badge" : "wp-live-badge"}>
            {hiddenOnSite ? "Selected · hidden" : "Selected"}
          </span>
        ) : (
          <span className="wp-metabox-badge">Not shown</span>
        )}
      </div>

      <section className="wp-hero-media-section">
        <div className="wp-hero-media-section-h">
          <div>
            <h3>Visual</h3>
            <p>
              {usingOwnFile
                ? "Using your own file. Picking an artwork replaces it. Layout presets below will not."
                : "Desktop and phone use different crops. The site swaps them automatically."}
            </p>
          </div>
        </div>
        <div className="wp-hero-art-grid">
          {CURATED_HERO_ARTWORKS.map((item) => {
            const active = artwork?.id === item.id && media.kind === "image";
            return (
              <button
                key={item.id}
                type="button"
                className={`wp-hero-art-card${active ? " is-active" : ""}`}
                aria-pressed={active}
                onClick={() => {
                  const overlay = resolveHeroOverlay(media);
                  onChange({
                    kind: "image",
                    url: item.desktopSrc,
                    place: media.place || "background",
                    overlay: overlay.style !== "none",
                    overlayStyle: overlay.style,
                    overlayOpacity: overlay.opacity,
                    overlayColor: overlay.color,
                    overlayBlur: overlay.blur,
                    overlayMode: overlay.style as HeroOverlayMode,
                  });
                }}
              >
                <span className="wp-hero-art-frames">
                  <span className="wp-hero-art-frame">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.desktopSrc} alt="" />
                    <span className="wp-hero-art-label">Desktop</span>
                  </span>
                  <span className="wp-hero-art-frame">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.mobileSrc} alt="" />
                    <span className="wp-hero-art-label">Phone</span>
                  </span>
                </span>
                <span className="wp-hero-art-meta">
                  <span className="wp-hero-art-title">
                    <strong>{item.name}</strong>
                    <span className={`wp-hero-art-badge${active ? " is-active" : ""}`}>{item.badge}</span>
                  </span>
                  <span className="wp-hero-art-copy">{item.description}</span>
                  <span className="wp-hero-art-action">
                    {active ? (hiddenOnSite ? "Selected · hidden" : "In use") : "Use this artwork"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="wp-hero-media-section">
        <div className="wp-hero-media-section-h">
          <div>
            <h3>Layout</h3>
            <p>
              {shown
                ? "Changes placement and overlay only. Your file stays."
                : "Sets the layout, and uses the first artwork until you pick another or upload."}
            </p>
          </div>
          {shown && !activePreset ? <span className="wp-hero-custom-chip">Custom settings</span> : null}
        </div>
        <div className="wp-hero-preset-grid">
          {CURATED_HERO_PRESETS.map((preset) => {
            const active = activePreset?.id === preset.id;
            const previewMedia: HeroMedia = {
              kind: "image",
              url: previewSrc ?? "",
              place: preset.settings.place,
              side: preset.settings.side ?? "right",
              overlay: preset.settings.overlayStyle !== "none",
              overlayStyle: preset.settings.overlayStyle,
              overlayOpacity: preset.settings.overlayOpacity,
              overlayColor: preset.settings.overlayColor,
              overlayBlur: preset.settings.overlayBlur,
            };
            return (
              <button
                key={preset.id}
                type="button"
                className={`wp-hero-preset${active ? " is-active" : ""}`}
                aria-pressed={active}
                onClick={() => applyPreset(preset)}
              >
                <span className="wp-hero-preset-stage">
                  {previewSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewSrc} alt="" />
                  ) : (
                    <span className="wp-overlay-swatch-fill" style={{ background: preset.swatchBackground }} />
                  )}
                  {previewSrc && preset.settings.place === "background" ? (
                    <CmsOverlay media={previewMedia} themeBg={themeBackground} />
                  ) : null}
                  {previewSrc && preset.settings.place === "side" ? (
                    <span
                      className={`wp-hero-preset-split${preset.settings.side === "left" ? " is-right" : ""}`}
                      aria-hidden
                    />
                  ) : null}
                </span>
                <span className="wp-hero-art-title">
                  <strong>{preset.name}</strong>
                  <span className={`wp-hero-art-badge${active ? " is-active" : ""}`}>
                    {active ? "In use" : preset.badge}
                  </span>
                </span>
                <span className="wp-hero-art-copy">{preset.description}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
