"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import {
  createSeasonOrnament,
  MAX_SEASON_ORNAMENTS,
  type SeasonOrnament,
  type SeasonsSettings,
} from "@/content/seasons";
import type { ContentData } from "@/content/types";
import { uploadCmsFile } from "@/lib/cms-client";
import { ConfirmButton } from "../components/ConfirmDialog";
import { formatNameFromFilename } from "../shelf/shelfArtifactHelpers";
import { seasonName } from "./season-labels";

const PHOTOROOM_URL = "https://www.photoroom.com/tools/background-remover";

/**
 * Shared ornament catalogue. Seasons map to these images from their editor.
 * @example <SeasonOrnamentCatalog data={data} setData={setData} />
 */
export function SeasonOrnamentCatalog({
  data,
  setData,
}: {
  data: ContentData;
  setData: Dispatch<SetStateAction<ContentData>>;
}) {
  const seasons = data.site.seasons;
  const ornaments = seasons.ornaments ?? [];
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [batchUploading, setBatchUploading] = useState(false);
  const [failedFiles, setFailedFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const busy = uploadingId !== null || batchUploading;
  const catalogFull = ornaments.length >= MAX_SEASON_ORNAMENTS;

  /**
   * Writes a new catalogue list onto the site draft.
   * @example updateOrnaments((list) => [...list, ornament]) // void
   */
  function updateOrnaments(update: (list: SeasonOrnament[]) => SeasonOrnament[]) {
    setData((current) => ({
      ...current,
      site: {
        ...current.site,
        seasons: {
          ...current.site.seasons,
          ornaments: update(current.site.seasons.ornaments ?? []),
        },
      },
    }));
  }

  /**
   * Patches one catalogue row.
   * @example patchOrnament(id, { name: "Diya" }) // void
   */
  function patchOrnament(id: string, patch: Partial<SeasonOrnament>) {
    updateOrnaments((list) =>
      list.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  /**
   * Replaces an ornament image and updates every season already mapped to the old one.
   * @example setImage(id, "/uploads/artifacts/diya.png") // void
   */
  function setImage(id: string, imageUrl: string, name?: string) {
    setData((current) => {
      const currentSeasons: SeasonsSettings = current.site.seasons;
      const list = currentSeasons.ornaments ?? [];
      const oldUrl = list.find((item) => item.id === id)?.imageUrl ?? "";
      const nextOrnaments = list.map((item) =>
        item.id === id
          ? { ...item, imageUrl, ...(name && !item.name.trim() ? { name } : {}) }
          : item,
      );
      const items =
        oldUrl && oldUrl !== imageUrl
          ? currentSeasons.items.map((item) => {
              if (!item.ornamentImages.includes(oldUrl)) return item;
              const ornamentPositions = item.ornamentPositions
                ? { ...item.ornamentPositions }
                : {};
              if (ornamentPositions[oldUrl]) {
                ornamentPositions[imageUrl] = ornamentPositions[oldUrl];
                delete ornamentPositions[oldUrl];
              }
              return {
                ...item,
                ornamentImages: Array.from(
                  new Set(item.ornamentImages.map((src) => (src === oldUrl ? imageUrl : src))),
                ),
                ornamentPositions,
              };
            })
          : currentSeasons.items;
      return {
        ...current,
        site: {
          ...current.site,
          seasons: { ...currentSeasons, ornaments: nextOrnaments, items },
        },
      };
    });
  }

  /**
   * Removes a catalogue row and unmaps it from every season.
   * @example removeOrnament(ornament) // void
   */
  function removeOrnament(ornament: SeasonOrnament) {
    setData((current) => {
      const currentSeasons: SeasonsSettings = current.site.seasons;
      const items = ornament.imageUrl
        ? currentSeasons.items.map((item) => {
            if (!item.ornamentImages.includes(ornament.imageUrl)) return item;
            const ornamentPositions = item.ornamentPositions
              ? { ...item.ornamentPositions }
              : {};
            delete ornamentPositions[ornament.imageUrl];
            return {
              ...item,
              ornamentImages: item.ornamentImages.filter((src) => src !== ornament.imageUrl),
              ornamentPositions,
            };
          })
        : currentSeasons.items;
      return {
        ...current,
        site: {
          ...current.site,
          seasons: {
            ...currentSeasons,
            ornaments: (currentSeasons.ornaments ?? []).filter((item) => item.id !== ornament.id),
            items,
          },
        },
      };
    });
  }

  /**
   * Adds an empty row so the image can be uploaded next.
   * @example addOrnament() // void
   */
  function addOrnament() {
    if (busy || catalogFull) return;
    updateOrnaments((list) => [...list, createSeasonOrnament()]);
  }

  /**
   * Uploads a catalogue image and prefills the name from the filename when blank.
   * @example uploadImage(file, ornament) // Promise
   */
  async function uploadImage(file: File, ornament: SeasonOrnament) {
    setUploadingId(ornament.id);
    setError("");
    const res = await uploadCmsFile(file, "artifacts");
    setUploadingId(null);
    if (!res.ok || !res.data?.url) {
      setError(res.error || "Upload failed.");
      return;
    }
    const derived = formatNameFromFilename(file.name);
    setImage(ornament.id, res.data.url, derived || undefined);
  }

  /**
   * Uploads a batch in one pick and appends each success immediately.
   * Failed files stay in a retry list so successful rows are never uploaded twice.
   * @example uploadImages(files) // Promise
   */
  async function uploadImages(files: File[]) {
    const room = Math.max(0, MAX_SEASON_ORNAMENTS - ornaments.length);
    const picked = files.slice(0, room);
    if (!picked.length) return;
    setBatchUploading(true);
    setError("");
    const failed: File[] = [];
    for (const file of picked) {
      const res = await uploadCmsFile(file, "artifacts");
      if (!res.ok || !res.data?.url) {
        failed.push(file);
        continue;
      }
      const ornament: SeasonOrnament = {
        ...createSeasonOrnament(),
        name: formatNameFromFilename(file.name),
        imageUrl: res.data.url,
      };
      updateOrnaments((list) => [...list, ornament]);
    }
    setFailedFiles(failed);
    if (failed.length) {
      setError(
        `${failed.length} of ${picked.length} images could not be uploaded. Use Retry failed for the rest.`,
      );
    }
    setBatchUploading(false);
  }

  /**
   * Seasons already using an ornament image.
   * @example mappedSeasons("/uploads/artifacts/diya.png") // [Diwali]
   */
  function mappedSeasons(imageUrl: string) {
    if (!imageUrl) return [];
    return seasons.items.filter((item) => item.ornamentImages.includes(imageUrl));
  }

  return (
    <div className="wp-season-catalog">
      <div className="wp-season-ornament-tools" style={{ justifyContent: "space-between" }}>
        <p className="wp-sub" style={{ margin: 0 }}>
          Upload transparent PNGs (one or many at a time, e.g. via{" "}
          <a
            href={PHOTOROOM_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#2271b1", textDecoration: "underline" }}
          >
            PhotoRoom
          </a>
          ) once, then map them to any season or festival.
        </p>
        <div className="wp-season-catalog-actions">
          <label className="wp-skill-file" style={{ margin: 0 }}>
            <span className={`wp-btn wp-btn-small${busy || catalogFull ? " is-disabled" : ""}`}>
              {batchUploading ? "Uploading…" : "Upload images"}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={busy || catalogFull}
              aria-label="Upload ornament images"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                event.target.value = "";
                if (!files.length) return;
                setFailedFiles([]);
                void uploadImages(files);
              }}
            />
          </label>
          {failedFiles.length ? (
            <button
              type="button"
              className="wp-btn wp-btn-small"
              disabled={busy || catalogFull}
              onClick={() => void uploadImages(failedFiles)}
            >
              Retry failed ({failedFiles.length})
            </button>
          ) : null}
          <button
            type="button"
            className="wp-btn wp-btn-primary"
            disabled={catalogFull || busy}
            onClick={addOrnament}
          >
            + Add ornament
          </button>
        </div>
      </div>
      <p className="wp-description">
        {catalogFull
          ? `${MAX_SEASON_ORNAMENTS} ornaments is the limit.`
          : "Upload several images at once to create one ornament per image. Removing an ornament also removes it from every season that uses it."}
      </p>
      {error ? <p className="wp-notice is-error">{error}</p> : null}

      <table className="wp-list-table">
        <thead>
          <tr>
            <th style={{ width: 64 }}>Preview</th>
            <th>Ornament</th>
            <th>Used in</th>
            <th style={{ textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {ornaments.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                style={{ textAlign: "center", padding: "2.5rem 1rem", color: "#646970" }}
              >
                No ornaments yet.{" "}
                <button type="button" className="wp-btn wp-btn-primary" onClick={addOrnament}>
                  Add your first ornament
                </button>
              </td>
            </tr>
          ) : (
            ornaments.map((item) => {
              const mapped = mappedSeasons(item.imageUrl);
              return (
                <tr key={item.id}>
                  <td>
                    <span className="wp-shelf-table-thumb">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt="" />
                      ) : (
                        <span className="wp-shelf-table-thumb-empty">PNG</span>
                      )}
                    </span>
                  </td>
                  <td>
                    <input
                      className="wp-input"
                      value={item.name}
                      maxLength={60}
                      placeholder="Ornament name"
                      aria-label="Ornament name"
                      onChange={(event) => patchOrnament(item.id, { name: event.target.value })}
                    />
                  </td>
                  <td>
                    {mapped.length ? (
                      <>
                        <span className="wp-status is-publish">
                          {mapped.length} {mapped.length === 1 ? "season" : "seasons"}
                        </span>
                        <p className="wp-sub" style={{ margin: "4px 0 0" }}>
                          {mapped.map(seasonName).join(", ")}
                        </p>
                      </>
                    ) : (
                      <span className="wp-status is-draft">Not mapped</span>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div className="wp-season-catalog-row-actions">
                      <label className="wp-skill-file" style={{ margin: 0 }}>
                        <span className="wp-btn wp-btn-small">
                          {uploadingId === item.id
                            ? "…"
                            : item.imageUrl
                              ? "Replace"
                              : "+ Image"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={busy}
                          aria-label={`Upload image for ${item.name || "ornament"}`}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) void uploadImage(file, item);
                            event.target.value = "";
                          }}
                        />
                      </label>
                      <ConfirmButton
                        className="wp-btn wp-btn-small wp-btn-danger-outline"
                        title={`Remove “${item.name || "this ornament"}”?`}
                        message="It is removed from the catalog and from every season that uses it. Save to update the live site."
                        confirmLabel="Remove"
                        disabled={busy}
                        onConfirm={() => removeOrnament(item)}
                      >
                        Trash
                      </ConfirmButton>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
