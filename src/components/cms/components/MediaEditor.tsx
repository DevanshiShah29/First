"use client";

// External dependencies
import { useState, type DragEvent, type ReactNode } from "react";

// Application services & types
import type { HeroMediaKind, HeroMediaPlace, HeroMediaSide } from "@/content/types";
import { mediaHint, parsePlayableMedia } from "@/lib/media-url";

// UI components
import { TextInput } from "../fields";

const ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif,video/mp4,video/webm,video/ogg,video/quicktime,.jpg,.jpeg,.png,.webp,.gif,.avif,.heic,.heif,.mp4,.webm,.ogv,.mov";
const MAX_BYTES = 25 * 1024 * 1024;
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|heic|heif|svg)(?:\?|#|$)/i;
const VIDEO_EXT = /\.(mp4|webm|ogg|ogv|mov|m4v)(?:\?|#|$)/i;

type KindOption = { value: HeroMediaKind; label: string };

/**
 * Rejects a file the upload route would refuse.
 * @example fileProblem(file) // "File must be 25MB or smaller." | null
 */
function fileProblem(file: File): string | null {
  if (file.size > MAX_BYTES) return "File must be 25MB or smaller.";
  const typeOk = /^(image\/(jpeg|png|webp|gif|avif|heic|heif|heic-sequence)|video\/(mp4|webm|ogg|quicktime))$/.test(file.type);
  if (!typeOk && !IMAGE_EXT.test(file.name) && !VIDEO_EXT.test(file.name)) {
    return "Use a JPG, PNG, WebP, GIF, AVIF, HEIC, MP4, WebM, or MOV file.";
  }
  return null;
}

/**
 * Short label for where a media URL comes from.
 * @example mediaSource("/uploads/hero/a.jpg") // "Uploaded file"
 */
function mediaSource(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.includes("/uploads/")) return "Uploaded file";
  try {
    return new URL(trimmed).hostname.replace(/^www\./, "");
  } catch {
    return "Custom URL";
  }
}

/**
 * Returns a URL that is safe to open in a new tab.
 * @example viewableUrl("/uploads/hero/a.jpg") // "/uploads/hero/a.jpg"
 */
function viewableUrl(url: string): string | null {
  const trimmed = url.trim();
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return trimmed;
  } catch {
    return null;
  }
  return null;
}

/**
 * Readable filename from a media URL, shortened when the slug is long.
 * @example mediaFilename("/uploads/hero/photo.jpg") // "photo.jpg"
 */
function mediaFilename(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  let base = "";
  try {
    const path = trimmed.startsWith("/") ? trimmed : new URL(trimmed).pathname;
    base = decodeURIComponent(path.split("/").filter(Boolean).pop() || "");
  } catch {
    return "";
  }
  if (base.length <= 42) return base;
  const ext = base.match(/\.[a-z0-9]{1,5}$/i)?.[0] ?? "";
  return `${base.slice(0, 32)}…${ext}`;
}

/**
 * Hint for a pasted URL, worded for the hero or the contact card.
 * @example urlHint("https://youtu.be/dQw4w9WgXcQ", "contact") // "YouTube link — will embed on the contact card."
 */
function urlHint(url: string, surface: "hero" | "contact"): string {
  const hint = mediaHint(url);
  if (!hint) {
    return surface === "hero"
      ? "YouTube, Vimeo, a Pexels video page, a direct .mp4, or an uploaded file."
      : "YouTube, Vimeo, a direct image or video file, or the uploaded file URL.";
  }
  return surface === "contact" ? hint.replace("the hero", "the contact card") : hint;
}

/**
 * Renders a segmented radio group.
 * @example <Segmented label="Type" value="image" options={opts} onChange={setKind} />
 */
function Segmented<T extends string>({
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
    <fieldset className="wp-media-choice">
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
 * Shared Hero and Contact media editor: preview, type, placement, and file or URL.
 * @example <MediaEditor surface="hero" kind="image" url="" … />
 */
export function MediaEditor({
  surface,
  kind,
  kindOptions,
  url,
  alt,
  onAlt,
  place,
  side,
  onKind,
  onUrl,
  onPlace,
  onSide,
  onFile,
  onClear,
  uploading,
  clearLabel,
  preview,
  note,
  warning,
}: {
  surface: "hero" | "contact";
  kind: HeroMediaKind;
  kindOptions: KindOption[];
  url: string;
  alt?: string;
  onAlt?: (alt: string) => void;
  place?: HeroMediaPlace;
  side?: HeroMediaSide;
  onKind: (kind: HeroMediaKind) => void;
  onUrl: (url: string) => void;
  onPlace?: (place: HeroMediaPlace) => void;
  onSide?: (side: HeroMediaSide) => void;
  onFile: (file: File) => void;
  onClear: () => void;
  uploading: boolean;
  clearLabel: string;
  preview: ReactNode;
  note?: string;
  warning?: string;
}) {
  const [dragDepth, setDragDepth] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);
  const hasFile = Boolean(url.trim());
  const openUrl = viewableUrl(url);
  const source = mediaSource(url);
  const filename = mediaFilename(url);
  const showDetails = kind !== "none";

  /**
   * Validates a dropped or chosen file, then hands it to the uploader.
   * @example takeFile(file) // void
   */
  function takeFile(file: File | undefined) {
    if (!file || uploading) return;
    const problem = fileProblem(file);
    if (problem) {
      setFileError(problem);
      return;
    }
    setFileError(null);
    onFile(file);
  }

  /**
   * Stores a pasted URL and switches type when the link is clearly an image or video.
   * @example changeUrl("https://youtu.be/dQw4w9WgXcQ") // void
   */
  function changeUrl(next: string) {
    setFileError(null);
    onUrl(next);
    const parsed = parsePlayableMedia(next);
    if (parsed.type === "iframe" || (parsed.type === "file" && parsed.kind === "video")) {
      if (kind !== "video") onKind("video");
      return;
    }
    const explicitImage =
      IMAGE_EXT.test(next) ||
      next.includes("images.pexels.com/") ||
      next.includes("images.unsplash.com/");
    if (parsed.type === "file" && parsed.kind === "image" && explicitImage && kind === "none") {
      onKind("image");
    }
  }

  /**
   * Tracks drag depth so the highlight stays up while the pointer crosses children.
   * @example onDragEnter(event) // void
   */
  function onDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragDepth((depth) => depth + 1);
  }

  /**
   * Drops one file onto the media zone.
   * @example onDrop(event) // void
   */
  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragDepth(0);
    takeFile(event.dataTransfer.files?.[0]);
  }

  return (
    <div className="wp-media-editor">
      {warning ? <div className="wp-notice wp-media-editor-warning">{warning}</div> : null}
      <div className="wp-media-editor-preview">{preview}</div>
      <div className="wp-media-editor-controls">
        <div className="wp-media-choices">
          <Segmented
            label="Type"
            name={`${surface}-media-kind`}
            value={kind}
            options={kindOptions}
            onChange={(next) => {
              setFileError(null);
              onKind(next);
            }}
          />
          {showDetails && place && onPlace ? (
            <Segmented
              label="Placement"
              name={`${surface}-media-place`}
              value={place}
              options={[
                { value: "side", label: "Side" },
                { value: "background", label: "Background" },
              ]}
              onChange={onPlace}
            />
          ) : null}
          {showDetails && place === "side" && side && onSide ? (
            <Segmented
              label="Side"
              name={`${surface}-media-side`}
              value={side}
              options={[
                { value: "left", label: "Left" },
                { value: "right", label: "Right" },
              ]}
              onChange={onSide}
            />
          ) : null}
        </div>

        <div
          className={`wp-media-drop${dragDepth > 0 ? " is-drag" : ""}`}
          onDragEnter={onDragEnter}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            event.preventDefault();
            setDragDepth((depth) => Math.max(0, depth - 1));
          }}
          onDrop={onDrop}
        >
          <div className="wp-media-drop-head">
            <div>
              <strong>
                {uploading
                  ? "Uploading…"
                  : !hasFile
                    ? "Add an image or video"
                    : kind === "none"
                      ? "Saved file, not shown"
                      : "Replace this file"}
              </strong>
              <p>
                {filename
                  ? filename
                  : "Drop a file here, or choose one. JPG, PNG, WebP, GIF, AVIF, HEIC, MP4, WebM, or MOV. Max 25MB."}
              </p>
            </div>
            {source ? <span className="wp-media-source">{source}</span> : null}
          </div>
          <div className="wp-media-drop-actions">
            <label className="wp-skill-file">
              <span className={`wp-btn${hasFile ? "" : " wp-btn-primary"}`}>
                {uploading ? "Uploading…" : hasFile ? "Replace" : "Upload"}
              </span>
              <input
                type="file"
                accept={ACCEPT}
                disabled={uploading}
                aria-label={hasFile ? `Replace ${surface} media` : `Upload ${surface} media`}
                onChange={(event) => {
                  takeFile(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </label>
            {openUrl ? (
              <a className="wp-btn" href={openUrl} target="_blank" rel="noreferrer">
                View file
              </a>
            ) : null}
            {hasFile || kind !== "none" ? (
              <button type="button" className="wp-btn wp-btn-danger-outline" onClick={onClear} disabled={uploading}>
                {clearLabel}
              </button>
            ) : null}
          </div>
          {fileError ? <p className="wp-media-file-error">{fileError}</p> : null}

          <div className="wp-media-fields">
            <label className="wp-media-field">
              URL
              <TextInput
                value={url}
                onChange={changeUrl}
                placeholder={surface === "hero" ? "https://www.pexels.com/video/…" : "https://…"}
                aria-label={`${surface} media URL`}
              />
              <span className="wp-description">{urlHint(url, surface)}</span>
            </label>
            {onAlt && showDetails ? (
              <label className="wp-media-field">
                Alt text
                <TextInput
                  value={alt ?? ""}
                  onChange={onAlt}
                  placeholder="Describe the image"
                  aria-label="Contact media alt text"
                />
                <span className="wp-description">
                  For screen readers. Leave this blank when the media is decorative.
                </span>
              </label>
            ) : null}
          </div>
        </div>
        {note ? <p className="wp-description wp-media-note">{note}</p> : null}
      </div>
    </div>
  );
}
