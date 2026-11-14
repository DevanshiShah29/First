"use client";

// External dependencies
import { useId, useState } from "react";

// Application services & types
import type { SkillItem } from "@/content/types";

// UI components
import { ConfirmButton } from "./components/ConfirmDialog";
import { PublishStatusControl } from "./components/PublishStatusControl";
import { HexColorInput, TextInput } from "./fields";

// Icons
import { isSvgIconSrc, SkillMark } from "@/components/icons";

type IconSourceKind = "none" | "svg" | "image" | "invalid";

/**
 * Classifies a custom icon URL so the editor knows whether color applies.
 * @example iconSource("https://cdn.test/react.svg") // { kind: "svg", src: "…" }
 */
function iconSource(raw: string): { kind: IconSourceKind; src?: string } {
  const src = raw.trim();
  if (!src) return { kind: "none" };
  if (!/^(https?:\/\/|\/|data:)/i.test(src)) return { kind: "invalid" };
  return { kind: isSvgIconSrc(src) ? "svg" : "image", src };
}

const ICON_SOURCE_LABELS: Record<IconSourceKind, string> = {
  none: "None",
  svg: "SVG",
  image: "Image",
  invalid: "Check URL",
};

/**
 * Explains how the selected color affects this icon.
 * @example iconHint("svg", true) // "Tinted with the color above…"
 */
function iconHint(kind: IconSourceKind, hasColor: boolean): string {
  switch (kind) {
    case "svg":
      return hasColor
        ? "Tinted with the color above. Black or white adapts to light and dark themes. If the host blocks tinting, the original icon still shows."
        : "Showing the SVG's own colors. Add a color to tint it; black or white adapts to light and dark themes.";
    case "image":
      return "Keeps its original colors — the color field only applies to SVG icons. Paste an SVG link to use a tint.";
    case "invalid":
      return "Use a full https:// URL, a path starting with /, or a data:image/svg+xml URL.";
    default:
      return "Upload an image or paste an SVG/image URL. The color field only applies to SVG icons.";
  }
}

/**
 * Renders one skill/technology row with an expandable custom-icon editor.
 * @example <SkillItemRow item={item} index={0} total={3} … />
 */
export function SkillItemRow({
  item,
  index,
  total,
  uploading,
  noun = "skill",
  onChange,
  onMove,
  onRemove,
  onUpload,
}: {
  item: SkillItem;
  index: number;
  total: number;
  uploading?: boolean;
  noun?: string;
  onChange: (item: SkillItem) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onUpload: (file: File) => void;
}) {
  const [iconOpen, setIconOpen] = useState(() => !item.iconUrl && item.icon === "empty");
  const panelId = useId();
  const customUrl = item.iconUrl ?? "";
  const label = noun[0].toUpperCase() + noun.slice(1);
  const source = iconSource(customUrl);
  const hasColor = Boolean(item.color?.trim());
  const hasFallback = item.icon !== "empty";
  const sourceLabel = source.kind === "none" ? (hasFallback ? "Fallback" : "None") : ICON_SOURCE_LABELS[source.kind];
  const summaryLabel =
    source.kind === "invalid"
      ? "Check icon URL"
      : source.kind === "none"
        ? hasFallback
          ? "Fallback icon"
          : "No icon"
        : source.kind === "svg"
          ? "SVG link"
          : "Custom image";
  const colorMeta = source.kind === "image" ? "original colors" : hasColor ? item.color : "theme accent";
  const previewTitle =
    source.kind === "invalid"
      ? "Icon URL is not valid"
      : source.kind === "svg"
        ? "SVG icon"
        : source.kind === "image"
          ? "Custom image icon"
          : hasFallback
            ? "Fallback icon"
            : "No icon";

  return (
    <div className={`wp-skill-row${iconOpen ? " is-expanded" : ""}`}>
      <div className="wp-skill-preview" title={previewTitle}>
        <SkillMark icon={item.icon} color={item.color} src={source.src} />
      </div>
      <div className="wp-skill-summary">
        <TextInput
          value={item.name}
          placeholder={`${label} name`}
          aria-label={`${label} name`}
          onChange={(name) => onChange({ ...item, name })}
        />
        <p className={`wp-skill-summary-meta${source.kind === "invalid" ? " is-invalid" : ""}`}>
          <span>{summaryLabel}</span>
          {source.kind === "svg" || source.kind === "image" ? (
            <>
              <span className="wp-skill-meta-sep" aria-hidden="true">
                ·
              </span>
              <span>{colorMeta}</span>
            </>
          ) : null}
        </p>
      </div>
      <div className="wp-skill-actions">
        <PublishStatusControl
          compact
          status={item.status}
          label={`Publish status for ${item.name || noun}`}
          onChange={(status) => onChange({ ...item, status })}
        />
        <button
          type="button"
          className="wp-btn wp-btn-small"
          title="Add or replace the custom icon"
          aria-expanded={iconOpen}
          aria-controls={panelId}
          onClick={() => setIconOpen((open) => !open)}
        >
          {iconOpen ? "Hide options" : "Change icon"}
        </button>
        <button
          type="button"
          className="wp-btn wp-btn-small wp-skill-move"
          disabled={index === 0}
          title={`Move ${noun} up`}
          aria-label={`Move ${noun} up`}
          onClick={() => onMove(-1)}
        >
          ↑
        </button>
        <button
          type="button"
          className="wp-btn wp-btn-small wp-skill-move"
          disabled={index === total - 1}
          title={`Move ${noun} down`}
          aria-label={`Move ${noun} down`}
          onClick={() => onMove(1)}
        >
          ↓
        </button>
        <ConfirmButton
          className="wp-btn wp-btn-small wp-btn-danger-outline"
          title={`Remove this ${noun}?`}
          confirmLabel="Remove"
          onConfirm={onRemove}
        >
          Remove
        </ConfirmButton>
      </div>

      {iconOpen ? (
        <div
          id={panelId}
          className={`wp-skill-icon-panel${source.kind !== "svg" ? " is-single" : ""}`}
        >
          <div className="wp-skill-icon-panel-section">
            <span className="wp-skill-field-label">Custom image</span>
            <div className="wp-skill-icon-source">
              <label className="wp-skill-file">
                <span
                  className="wp-btn"
                  title="Upload a PNG, JPG, WebP, GIF, or HEIC image. Paste SVG links in the URL field."
                >
                  {uploading ? "Uploading…" : "Upload image"}
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/heic,image/heif,.png,.jpg,.jpeg,.webp,.gif,.heic,.heif"
                  disabled={uploading}
                  aria-label={`Upload icon image for ${item.name || noun}`}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onUpload(file);
                    e.target.value = "";
                  }}
                />
              </label>
              <TextInput
                value={customUrl}
                placeholder="or paste an SVG/image URL: https://…"
                aria-label={`${label} icon URL`}
                onChange={(iconUrl) => onChange({ ...item, iconUrl: iconUrl || undefined })}
              />
              <button
                type="button"
                className="wp-btn-link"
                disabled={!customUrl}
                style={{ visibility: customUrl ? "visible" : "hidden" }}
                onClick={() => onChange({ ...item, iconUrl: undefined })}
              >
                Clear icon
              </button>
            </div>
          </div>

          {source.kind === "svg" ? (
            <div className="wp-skill-icon-panel-section">
              <span className="wp-skill-field-label">Icon color</span>
              <HexColorInput
                value={item.color ?? ""}
                placeholder="#A78BFA"
                onChange={(color) => onChange({ ...item, color: color || undefined })}
              />
            </div>
          ) : null}

          <p className={`wp-skill-icon-hint is-${source.kind}`} aria-live="polite">
            <span className="wp-skill-source-badge">{sourceLabel}</span>
            <span>{iconHint(source.kind, hasColor)}</span>
          </p>
        </div>
      ) : null}
    </div>
  );
}
