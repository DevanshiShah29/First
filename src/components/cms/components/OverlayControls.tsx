"use client";

// Application services & types
import type {
  HeroMedia,
  HeroOverlayBlur,
  HeroOverlayColor,
  HeroOverlayOpacity,
  HeroOverlayStyle,
} from "@/content/types";

// UI components
import { CmsOverlay } from "./CmsOverlay";

const STYLE_OPTIONS: { value: HeroOverlayStyle; label: string }[] = [
  { value: "none", label: "Off" },
  { value: "left-fade", label: "Left fade" },
  { value: "left-heavy-fade", label: "Heavy left" },
  { value: "right-fade", label: "Right" },
  { value: "top-fade", label: "Top" },
  { value: "top-left-fade", label: "Top left" },
  { value: "top-right-fade", label: "Top right" },
  { value: "bottom-fade", label: "Bottom" },
  { value: "radial-vignette", label: "Vignette" },
  { value: "radial-center", label: "Spotlight" },
  { value: "solid", label: "Solid" },
];

const TONE_OPTIONS: { value: HeroOverlayColor; label: string; color: string }[] = [
  { value: "theme", label: "Theme", color: "" },
  { value: "dark", label: "Dark", color: "#000000" },
  { value: "slate", label: "Slate", color: "#0f172a" },
  { value: "espresso", label: "Espresso", color: "#1c140e" },
  { value: "light", label: "Light", color: "#ffffff" },
  { value: "cream", label: "Cream", color: "#faf6f0" },
  { value: "peach", label: "Peach", color: "#fcefe8" },
  { value: "rose", label: "Rose", color: "#f7e8e8" },
];

const OPACITY_OPTIONS: { value: HeroOverlayOpacity; label: string }[] = [
  { value: "15", label: "15%" },
  { value: "30", label: "30%" },
  { value: "50", label: "50%" },
  { value: "70", label: "70%" },
  { value: "85", label: "85%" },
];

const BLUR_OPTIONS: { value: HeroOverlayBlur; label: string }[] = [
  { value: "none", label: "Off" },
  { value: "subtle", label: "Subtle" },
  { value: "medium", label: "Medium" },
  { value: "heavy", label: "Heavy" },
];

/**
 * Short label for the overlay currently in use.
 * @example overlaySummary("left-fade", "70", "theme", "none") // "Left fade · 70% · Theme"
 */
export function overlaySummary(
  style: HeroOverlayStyle,
  opacity: HeroOverlayOpacity,
  color: HeroOverlayColor,
  blur: HeroOverlayBlur,
): string {
  if (style === "none") return "Off";
  const styleLabel = STYLE_OPTIONS.find((option) => option.value === style)?.label ?? style;
  const toneLabel = TONE_OPTIONS.find((option) => option.value === color)?.label ?? color;
  const blurLabel = blur === "none" ? "" : ` · ${blur} blur`;
  return `${styleLabel} · ${opacity}% · ${toneLabel}${blurLabel}`;
}

/**
 * Renders a compact single-choice row using the shared segmented control.
 * @example <ChoiceRow label="Strength" name="opacity" value="70" options={opts} onChange={setOpacity} />
 */
function ChoiceRow<T extends string>({
  label,
  name,
  value,
  options,
  onChange,
}: {
  label: string;
  name: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="wp-overlay-field">
      <legend>{label}</legend>
      <div className="wp-seg">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <label key={option.value} className={selected ? "is-selected" : undefined}>
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * Visual overlay controls for a background hero. Swatches use the current image.
 * @example <OverlayControls surface="hero" style="left-fade" … />
 */
export function OverlayControls({
  surface,
  style,
  opacity,
  color,
  blur,
  imageUrl,
  themeBackground,
  onStyle,
  onOpacity,
  onColor,
  onBlur,
}: {
  surface: string;
  style: HeroOverlayStyle;
  opacity: HeroOverlayOpacity;
  color: HeroOverlayColor;
  blur: HeroOverlayBlur;
  imageUrl?: string;
  themeBackground?: string;
  onStyle: (style: HeroOverlayStyle) => void;
  onOpacity: (opacity: HeroOverlayOpacity) => void;
  onColor: (color: HeroOverlayColor) => void;
  onBlur: (blur: HeroOverlayBlur) => void;
}) {
  const sample = (nextStyle: HeroOverlayStyle): HeroMedia => ({
    kind: "image",
    url: imageUrl ?? "",
    place: "background",
    side: "right",
    overlay: nextStyle !== "none",
    overlayStyle: nextStyle,
    overlayOpacity: opacity,
    overlayColor: color,
    overlayBlur: "none",
  });

  return (
    <div className="wp-overlay-panel">
      <div className="wp-overlay-panel-h">
        <strong>Overlay</strong>
        <span>{overlaySummary(style, opacity, color, blur)}</span>
      </div>
      <p className="wp-description">
        {style === "none"
          ? "Clean image. The hero switches to dark text so it stays readable on the artwork."
          : "Covers the image so the headline stays readable. On a phone, left fades drop from the top."}
      </p>
      <fieldset className="wp-overlay-field">
        <legend>Style</legend>
        <div className="wp-overlay-styles">
          {STYLE_OPTIONS.map((option) => {
            const selected = option.value === style;
            return (
              <label
                key={option.value}
                className={`wp-overlay-style${selected ? " is-selected" : ""}`}
              >
                <input
                  type="radio"
                  name={`${surface}-overlay-style`}
                  value={option.value}
                  checked={selected}
                  onChange={() => onStyle(option.value)}
                />
                <span className="wp-overlay-swatch" aria-hidden>
                  {imageUrl ? (
                    // Curated or uploaded hero still. Decorative; the radio label names the style.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt="" />
                  ) : (
                    <span className="wp-overlay-swatch-fill" />
                  )}
                  <CmsOverlay media={sample(option.value)} themeBg={themeBackground} />
                </span>
                <span className="wp-overlay-style-label">{option.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
      {style !== "none" ? (
        <>
          <fieldset className="wp-overlay-field">
            <legend>Tone</legend>
            <div className="wp-overlay-tones">
              {TONE_OPTIONS.map((option) => {
                const selected = option.value === color;
                const swatch = option.value === "theme" ? themeBackground || "#1d2327" : option.color;
                return (
                  <label
                    key={option.value}
                    className={`wp-overlay-tone${selected ? " is-selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name={`${surface}-overlay-tone`}
                      value={option.value}
                      checked={selected}
                      onChange={() => onColor(option.value)}
                    />
                    <span className="wp-overlay-tone-swatch" style={{ background: swatch }} aria-hidden />
                    {option.label}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <ChoiceRow
            label="Strength"
            name={`${surface}-overlay-opacity`}
            value={opacity}
            options={OPACITY_OPTIONS}
            onChange={onOpacity}
          />
          <ChoiceRow
            label="Blur"
            name={`${surface}-overlay-blur`}
            value={blur}
            options={BLUR_OPTIONS}
            onChange={onBlur}
          />
        </>
      ) : null}
    </div>
  );
}
