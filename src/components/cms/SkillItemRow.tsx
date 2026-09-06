"use client";

// Application services & types
import type { SkillItem } from "@/content/types";

// UI components
import { HexColorInput, TextInput } from "./fields";

// Icons
import { SkillMark } from "@/components/icons";

function previewableIconUrl(raw: string) {
  const src = raw.trim();
  if (!src) return undefined;
  if (/^(https?:\/\/|\/|data:)/i.test(src)) return src;
  return undefined;
}

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
  const customUrl = item.iconUrl ?? "";
  const label = noun[0].toUpperCase() + noun.slice(1);
  const previewSrc = previewableIconUrl(customUrl);

  return (
    <div className="wp-skill-row">
      <div className="wp-skill-preview" title={previewSrc ? "Custom icon" : "No icon yet"}>
        <SkillMark icon={item.icon} color={item.color} src={previewSrc} />
        <span className="wp-skill-preview-name">{item.name || label}</span>
      </div>
      <div className="wp-skill-fields">
        <div className="wp-skill-fields-top">
          <TextInput
            value={item.name}
            placeholder={`${label} name`}
            onChange={(name) => onChange({ ...item, name })}
          />
          <HexColorInput
            value={item.color ?? ""}
            placeholder="#A78BFA"
            onChange={(color) => onChange({ ...item, color: color || undefined })}
          />
        </div>
        <div className="wp-skill-icon-source">
          <label className="wp-skill-file">
            <span className="wp-btn">{uploading ? "Uploading…" : "Upload icon"}</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,.png,.jpg,.jpeg,.webp,.gif"
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
            placeholder="or paste PNG/WebP URL: https://…"
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
        <p className="wp-description" style={{ marginTop: 0 }}>
          Upload an SVG or paste an image URL. Icons render at the same size as the public Skills &amp; Technologies
          tiles.
        </p>
      </div>
      <div className="wp-skill-actions">
        <button
          type="button"
          className="wp-btn"
          disabled={index === 0}
          title={`Move ${noun} up`}
          aria-label={`Move ${noun} up`}
          onClick={() => onMove(-1)}
          style={{ padding: "0 8px" }}
        >
          ↑
        </button>
        <button
          type="button"
          className="wp-btn"
          disabled={index === total - 1}
          title={`Move ${noun} down`}
          aria-label={`Move ${noun} down`}
          onClick={() => onMove(1)}
          style={{ padding: "0 8px" }}
        >
          ↓
        </button>
        <button type="button" className="wp-btn" onClick={onRemove}>
          Remove
        </button>
      </div>
    </div>
  );
}
