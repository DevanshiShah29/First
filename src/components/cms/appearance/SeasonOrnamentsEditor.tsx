"use client";

import { useState, type DragEvent } from "react";
import { MAX_SEASON_ORNAMENT_IMAGES, seasonOrnamentImageUrl } from "@/content/seasons";
import { uploadCmsFile } from "@/lib/cms-client";
import { ConfirmButton } from "../components/ConfirmDialog";
import { TextInput } from "../fields";

const ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.gif,.avif,.heic,.heif";
const MAX_BYTES = 25 * 1024 * 1024;
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|heic|heif)(?:\?|#|$)/i;

/**
 * Rejects a file the upload route would refuse.
 * @example fileProblem(file) // "File must be 25MB or smaller." | null
 */
function fileProblem(file: File): string | null {
  if (file.size > MAX_BYTES) return "File must be 25MB or smaller.";
  const typeOk = /^image\/(jpeg|png|webp|gif|avif|heic|heif|heic-sequence)$/.test(file.type);
  if (!typeOk && !IMAGE_EXT.test(file.name)) {
    return "Use a JPG, PNG, WebP, GIF, AVIF, or HEIC image.";
  }
  return null;
}

/**
 * Season corner images from upload or URL.
 * @example <SeasonOrnamentsEditor images={[]} onImages={setImages} />
 */
export function SeasonOrnamentsEditor({
  images,
  onImages,
}: {
  images: string[];
  onImages: (images: string[]) => void;
}) {
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const room = MAX_SEASON_ORNAMENT_IMAGES - images.length;

  /**
   * Adds addresses that pass the same check as save, skipping duplicates.
   * @example keepUrls(["https://cdn.example/bat.png"]) // { kept: 1, dropped: 0 }
   */
  function keepUrls(next: string[]): { kept: number; dropped: number } {
    const accepted: string[] = [];
    let dropped = 0;
    for (const item of next) {
      const safe = seasonOrnamentImageUrl(item);
      if (!safe || images.includes(safe) || accepted.includes(safe)) {
        dropped += 1;
        continue;
      }
      accepted.push(safe);
    }
    const roomLeft = Math.max(MAX_SEASON_ORNAMENT_IMAGES - images.length, 0);
    const kept = accepted.slice(0, roomLeft);
    dropped += accepted.length - kept.length;
    if (kept.length) onImages([...images, ...kept]);
    return { kept: kept.length, dropped };
  }

  /**
   * Uploads each image, then stores the returned addresses together.
   * @example uploadFiles(list) // Promise
   */
  async function uploadFiles(list: File[]) {
    const pending = list.slice(0, Math.max(room, 0));
    if (!pending.length) {
      setError(`${MAX_SEASON_ORNAMENT_IMAGES} images is the limit.`);
      return;
    }
    if (list.length > pending.length) {
      setError(`${MAX_SEASON_ORNAMENT_IMAGES} images is the limit. Extra files were skipped.`);
    } else {
      setError("");
    }
    setUploading(true);
    const added: string[] = [];
    for (const file of pending) {
      const problem = fileProblem(file);
      if (problem) {
        setError(problem);
        continue;
      }
      const res = await uploadCmsFile(file, "artifacts");
      if (!res.ok || !res.data?.url) {
        setError(res.error || "Upload failed.");
        continue;
      }
      added.push(res.data.url);
    }
    setUploading(false);
    if (!added.length) return;
    const result = keepUrls(added);
    if (result.dropped > 0) {
      setError(`${MAX_SEASON_ORNAMENT_IMAGES} images is the limit.`);
    }
  }

  /**
   * Reads dropped image files.
   * @example onDrop(event) // void
   */
  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const files = Array.from(event.dataTransfer.files);
    if (files.length) void uploadFiles(files);
  }

  return (
    <div className="wp-season-ornaments">
      <h4 className="wp-palette-column-title">Ornaments</h4>
      <p className="wp-description">
        Upload images or paste an address. Several are fine. They show in the corners when this
        season’s look includes ornaments. Save to publish.
      </p>
      <div
        className={`wp-season-drop${dragging ? " is-dragging" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <div className="wp-season-ornament-tools">
          <label className="wp-skill-file">
            <span className="wp-btn">{uploading ? "Uploading…" : "Upload images"}</span>
            <input
              type="file"
              accept={ACCEPT}
              multiple
              disabled={uploading || room <= 0}
              aria-label="Upload ornament images"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                if (files.length) void uploadFiles(files);
                event.target.value = "";
              }}
            />
          </label>
          <TextInput
            value={url}
            onChange={setUrl}
            placeholder="https://… or /uploads/…"
            aria-label="Ornament image URL"
          />
          <button
            type="button"
            className="wp-btn"
            disabled={uploading || room <= 0 || !url.trim()}
            onClick={() => {
              const result = keepUrls([url]);
              if (!result.kept) {
                const safe = seasonOrnamentImageUrl(url);
                if (!safe) setError("Use an image address that starts with http, https, or /.");
                else if (images.includes(safe)) setError("That image is already in the list.");
                else setError(`${MAX_SEASON_ORNAMENT_IMAGES} images is the limit.`);
                return;
              }
              setUrl("");
              setError(result.dropped ? `${MAX_SEASON_ORNAMENT_IMAGES} images is the limit.` : "");
            }}
          >
            Add URL
          </button>
        </div>
        {error ? <p className="wp-notice is-error">{error}</p> : null}
        {images.length ? (
          <ul className="wp-season-ornament-list">
            {images.map((src) => (
              <li key={src} className="wp-season-ornament-item">
                {/* CMS addresses may be any https host. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" />
                <ConfirmButton
                  className="wp-btn wp-btn-small"
                  title="Remove this ornament?"
                  confirmLabel="Remove"
                  onConfirm={() => onImages(images.filter((item) => item !== src))}
                >
                  Remove
                </ConfirmButton>
              </li>
            ))}
          </ul>
        ) : (
          <p className="wp-description">No images yet.</p>
        )}
      </div>
      <div className="wp-theme-edit-actions">
        <ConfirmButton
          className="wp-btn wp-btn-small"
          disabled={!images.length}
          title="Remove every ornament image?"
          confirmLabel="Clear images"
          onConfirm={() => onImages([])}
        >
          Clear images
        </ConfirmButton>
      </div>
    </div>
  );
}
