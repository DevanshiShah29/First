"use client";

import { useState, type Dispatch, type SetStateAction } from "react";

// Application services & types
import {
  EMPTY_SHELF_LAYOUT,
  isArtifactOnShelf,
  type ContentData,
  type ShelfArtifactItem,
  type ShelfLayout,
} from "@/content/types";
import { move, type Screen } from "../types";

// UI components
import { CmsSaveButton, type CmsSaveStatus } from "../components/CmsSaveButton";
import { Metabox } from "../components/Metabox";
import { PublishStatusControl } from "../components/PublishStatusControl";
import { Field, TextInput } from "../fields";
import { ShelfPlacementEditor } from "../shelf/ShelfPlacementEditor";
import {
  calculateOrnamentDimensions,
  formatNameFromFilename,
} from "../shelf/shelfArtifactHelpers";
import { removeArtifactFromLayout } from "../shelf/shelfBuilderOps";

const PHOTOROOM_URL = "https://www.photoroom.com/tools/background-remover";

/**
 * Renders the shelf ornament catalog list + placement canvas.
 * @example <ArtifactsListScreen artifactsList={…} go={go} … />
 */
export function ArtifactsListScreen({
  data,
  setData,
  artifactsList,
  go,
  addArtifact,
  uploadArtifactImage,
  uploading,
  save,
  dirty,
  status,
}: {
  data: ContentData;
  setData: Dispatch<SetStateAction<ContentData>>;
  artifactsList: ShelfArtifactItem[];
  go: (screen: Screen, id?: string | null) => void;
  addArtifact: () => void;
  uploadArtifactImage: (
    file: File,
    id: string,
  ) => Promise<string | null | void>;
  uploading: boolean;
  save?: () => Promise<void>;
  dirty?: boolean;
  status?: CmsSaveStatus;
}) {
  const [activeTab, setActiveTab] = useState<"builder" | "catalog">("builder");
  const shelfLayout: ShelfLayout = data.shelfLayout ?? EMPTY_SHELF_LAYOUT;

  /**
   * Patches one catalog row by index.
   * @example patchAt(0, { enabled: false }) // void
   */
  function patchAt(index: number, patch: Partial<ShelfArtifactItem>) {
    const shelfArtifacts = artifactsList.map((item, i) =>
      i === index ? { ...item, ...patch } : item,
    );
    setData({ ...data, shelfArtifacts });
  }

  /**
   * Replaces the full ornament catalog (placement editor).
   * @example setCatalog(next) // void
   */
  function setCatalog(shelfArtifacts: ShelfArtifactItem[]) {
    setData((current) => ({ ...current, shelfArtifacts }));
  }

  /**
   * Replaces free book layout (placement editor).
   * @example setLayout(next) // void
   */
  function setLayout(next: ShelfLayout) {
    setData((current) => ({ ...current, shelfLayout: next }));
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 8,
        }}>
        <div>
          <h1 className="wp-screen-title" style={{ marginBottom: 4 }}>
            Shelf
          </h1>
          <p className="wp-sub" style={{ margin: 0 }}>
            Compose the reading bookshelf: Goodreads books on planks, ornaments
            anywhere on the cabinet. Desktop and mobile layouts stay
            independent.
          </p>
        </div>
        {save ? (
          <CmsSaveButton
            save={save}
            dirty={dirty ?? false}
            status={status ?? "idle"}
          />
        ) : null}
      </div>

      <div
        className="wp-editor-tablist"
        role="tablist"
        aria-label="Shelf tabs"
        style={{ marginTop: 16, marginBottom: 16 }}>
        <button
          type="button"
          role="tab"
          id="shelf-tab-builder"
          aria-selected={activeTab === "builder"}
          aria-controls="shelf-panel-builder"
          className={`wp-editor-tab${activeTab === "builder" ? " is-active" : ""}`}
          onClick={() => setActiveTab("builder")}>
          Shelf Builder
        </button>
        <button
          type="button"
          role="tab"
          id="shelf-tab-catalog"
          aria-selected={activeTab === "catalog"}
          aria-controls="shelf-panel-catalog"
          className={`wp-editor-tab${activeTab === "catalog" ? " is-active" : ""}`}
          onClick={() => setActiveTab("catalog")}>
          Ornament Catalog ({artifactsList.length})
        </button>
      </div>

      {activeTab === "builder" ? (
        <div
          role="tabpanel"
          id="shelf-panel-builder"
          aria-labelledby="shelf-tab-builder">
          <ShelfPlacementEditor
            artifacts={artifactsList}
            onChangeArtifacts={setCatalog}
            shelfLayout={shelfLayout}
            onChangeLayout={setLayout}
          />
        </div>
      ) : (
        <div
          role="tabpanel"
          id="shelf-panel-catalog"
          aria-labelledby="shelf-tab-catalog">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 12,
            }}>
            <p className="wp-sub" style={{ margin: 0 }}>
              Tip: Use transparent PNGs (e.g. via{" "}
              <a
                href={PHOTOROOM_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#2271b1", textDecoration: "underline" }}>
                PhotoRoom
              </a>
              ) so the cabinet wood grain shows through.
            </p>
            <button
              type="button"
              className="wp-btn wp-btn-primary"
              onClick={addArtifact}>
              + Add Ornament
            </button>
          </div>

          <table className="wp-list-table">
            <thead>
              <tr>
                <th style={{ width: 64 }}>Preview</th>
                <th>Ornament</th>
                <th>Placement</th>
                <th>Size (rem)</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Image</th>
              </tr>
            </thead>
            <tbody>
              {artifactsList.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: "center",
                      padding: "2.5rem 1rem",
                      color: "#646970",
                    }}>
                    No ornaments in the catalog yet.{" "}
                    <button
                      type="button"
                      className="wp-btn wp-btn-primary"
                      onClick={addArtifact}
                      style={{ marginLeft: 6 }}>
                      Add your first ornament
                    </button>
                  </td>
                </tr>
              ) : (
                artifactsList.map((item, i) => {
                  const placed = isArtifactOnShelf(shelfLayout, item.id);
                  return (
                    <tr key={item.id}>
                      <td>
                        <button
                          type="button"
                          className="wp-shelf-table-thumb"
                          onClick={() => go("artifacts-edit", item.id)}
                          title={`Edit ${item.name || "ornament"}`}>
                          {item.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.imageUrl} alt="" />
                          ) : (
                            <span className="wp-shelf-table-thumb-empty">
                              PNG
                            </span>
                          )}
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="row-title"
                          onClick={() => go("artifacts-edit", item.id)}>
                          {item.name || "(untitled)"}
                        </button>
                        <div className="wp-row-actions">
                          <button
                            type="button"
                            onClick={() => go("artifacts-edit", item.id)}>
                            Edit
                          </button>
                          {" | "}
                          <button
                            type="button"
                            onClick={() =>
                              patchAt(i, {
                                status: item.status === "draft" ? "published" : "draft",
                              })
                            }>
                            {item.status === "draft" ? "Publish" : "Draft"}
                          </button>
                          {" | "}
                          <button
                            type="button"
                            onClick={() =>
                              setCatalog(move(artifactsList, i, -1))
                            }
                            disabled={i === 0}>
                            Up
                          </button>
                          {" | "}
                          <button
                            type="button"
                            onClick={() =>
                              setCatalog(move(artifactsList, i, 1))
                            }
                            disabled={i === artifactsList.length - 1}>
                            Down
                          </button>
                          {" | "}
                          <button
                            type="button"
                            className="trash"
                            onClick={() =>
                              setCatalog(
                                artifactsList.filter((_, j) => j !== i),
                              )
                            }>
                            Trash
                          </button>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`wp-status ${placed ? "is-publish" : "is-draft"}`}>
                          {placed ? "On shelf" : "Not placed"}
                        </span>
                      </td>
                      <td>
                        {item.widthRem.toFixed(2)} × {item.heightRem.toFixed(2)}
                      </td>
                      <td>
                        <div style={{ display: "grid", gap: 8 }}>
                          <PublishStatusControl
                            compact
                            status={item.status}
                            label={`Publish status for ${item.name || "ornament"}`}
                            onChange={(status) => patchAt(i, { status })}
                          />
                          <label
                            className="wp-shelf-toggle"
                            style={{ cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={item.enabled}
                              onChange={(e) =>
                                patchAt(i, { enabled: e.target.checked })
                              }
                            />
                            <span>{item.enabled ? "Enabled" : "Disabled"}</span>
                          </label>
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <label className="wp-skill-file" style={{ margin: 0 }}>
                          <span className="wp-btn wp-btn-small">
                            {uploading
                              ? "…"
                              : item.imageUrl
                                ? "Replace"
                                : "+ Image"}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploading}
                            aria-label={`Upload image for ${item.name || "ornament"}`}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const formatted = formatNameFromFilename(
                                  file.name,
                                );
                                const shouldPrefill =
                                  !item.name.trim() ||
                                  item.name === "New ornament" ||
                                  item.name === "(untitled)";
                                const objectUrl = URL.createObjectURL(file);
                                const img = new window.Image();
                                img.onload = () => {
                                  const dims = calculateOrnamentDimensions(
                                    img.naturalWidth,
                                    img.naturalHeight,
                                  );
                                  patchAt(i, {
                                    widthRem: dims.widthRem,
                                    heightRem: dims.heightRem,
                                    ...(shouldPrefill && formatted
                                      ? { name: formatted }
                                      : {}),
                                  });
                                  URL.revokeObjectURL(objectUrl);
                                };
                                img.onerror = () => {
                                  if (shouldPrefill && formatted) {
                                    patchAt(i, { name: formatted });
                                  }
                                  URL.revokeObjectURL(objectUrl);
                                };
                                img.src = objectUrl;
                                void uploadArtifactImage(file, item.id);
                              }
                              e.target.value = "";
                            }}
                          />
                        </label>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/**
 * Renders a single shelf ornament editor.
 * @example <ArtifactsEditScreen artifact={artifact} artIndex={0} … />
 */
export function ArtifactsEditScreen({
  data,
  setData,
  artifact,
  artIndex,
  artifactsList,
  go,
  uploadArtifactImage,
  uploading,
  save,
  dirty,
  status,
}: {
  data: ContentData;
  setData: (data: ContentData) => void;
  artifact: ShelfArtifactItem;
  artIndex: number;
  artifactsList: ShelfArtifactItem[];
  go: (screen: Screen) => void;
  uploadArtifactImage: (
    file: File,
    id: string,
  ) => Promise<string | null | void>;
  uploading: boolean;
  save: () => Promise<void>;
  dirty: boolean;
  status: CmsSaveStatus;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [suggestedName, setSuggestedName] = useState<string | null>(null);

  const isNew =
    !artifact.imageUrl && (!artifact.name || artifact.name === "New ornament");
  const shelfLayout: ShelfLayout = data.shelfLayout ?? EMPTY_SHELF_LAYOUT;
  const placed = isArtifactOnShelf(shelfLayout, artifact.id);

  /**
   * Patches the active ornament in document state.
   * @example patchArtifact({ name: "Globe" }) // void
   */
  function patchArtifact(patch: Partial<ShelfArtifactItem>) {
    const shelfArtifacts = [...artifactsList];
    shelfArtifacts[artIndex] = { ...artifact, ...patch };
    setData({ ...data, shelfArtifacts });
  }

  /**
   * Processes an uploaded or dropped image:
   * 1. Prefills name from image filename if title is empty or default.
   * 2. Automatically derives widthRem & heightRem from the natural aspect ratio.
   * 3. Uploads file to CMS storage.
   */
  async function handleImageFile(file: File) {
    const formatted = formatNameFromFilename(file.name);
    if (formatted) {
      setSuggestedName(formatted);
    }

    const currentName = artifact.name.trim();
    const shouldPrefillTitle = !currentName || currentName === "New ornament";

    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();

    img.onload = () => {
      const dims = calculateOrnamentDimensions(
        img.naturalWidth,
        img.naturalHeight,
      );
      patchArtifact({
        widthRem: dims.widthRem,
        heightRem: dims.heightRem,
        ...(shouldPrefillTitle && formatted ? { name: formatted } : {}),
      });
      URL.revokeObjectURL(objectUrl);
    };

    img.onerror = () => {
      if (shouldPrefillTitle && formatted) {
        patchArtifact({ name: formatted });
      }
      URL.revokeObjectURL(objectUrl);
    };

    img.src = objectUrl;

    await uploadArtifactImage(file, artifact.id);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      void handleImageFile(file);
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <h1
          className="wp-screen-title"
          style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span>
            {isNew
              ? "Add New Ornament"
              : `Edit Ornament: ${artifact.name || "Untitled"}`}
          </span>
        </h1>
      </div>

      <div className="wp-edit">
        <div>
          <input
            className="wp-title-input"
            value={artifact.name}
            placeholder="Enter ornament name"
            onChange={(e) => patchArtifact({ name: e.target.value })}
          />
          {suggestedName && suggestedName !== artifact.name ? (
            <p className="wp-sub" style={{ margin: "4px 0 12px" }}>
              Suggested from file:{" "}
              <button
                type="button"
                className="wp-btn-link"
                onClick={() => patchArtifact({ name: suggestedName })}>
                Use &ldquo;{suggestedName}&rdquo;
              </button>
            </p>
          ) : null}

          <Metabox id="artifact_image" title="Image">
            <div
              className={`wp-shelf-edit-media${isDragging ? " is-dragging" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}>
              {artifact.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={artifact.imageUrl}
                  alt=""
                  className="wp-shelf-edit-thumb"
                  style={{
                    width: `${Math.max(48, Math.min(140, artifact.widthRem * 16))}px`,
                    height: `${Math.max(56, Math.min(160, artifact.heightRem * 16))}px`,
                  }}
                />
              ) : (
                <div className="wp-shelf-edit-thumb is-empty" aria-hidden>
                  <span>PNG</span>
                </div>
              )}
              <div className="wp-shelf-edit-media-actions">
                <label className="wp-skill-file" style={{ margin: 0 }}>
                  <span className="wp-btn wp-btn-primary">
                    {uploading
                      ? "Uploading…"
                      : artifact.imageUrl
                        ? "Change image"
                        : "Upload image"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    aria-label="Upload shelf ornament image"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleImageFile(file);
                      e.target.value = "";
                    }}
                  />
                </label>
                {artifact.imageUrl ? (
                  <button
                    type="button"
                    className="wp-btn"
                    onClick={() => patchArtifact({ imageUrl: "" })}
                    disabled={uploading}>
                    Remove image
                  </button>
                ) : null}
                <p className="wp-sub" style={{ margin: 0 }}>
                  Use a transparent PNG (e.g. via{" "}
                  <a
                    href={PHOTOROOM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#2271b1", textDecoration: "underline" }}>
                    PhotoRoom
                  </a>
                  ) so the wood grain shows through. Drag and drop also
                  supported.
                </p>
                {artifact.imageUrl ? (
                  <p className="wp-sub" style={{ margin: 0, color: "#646970" }}>
                    Proportions preserved ({artifact.widthRem.toFixed(2)} ×{" "}
                    {artifact.heightRem.toFixed(2)} rem). Resizing can also be
                    done on the shelf builder.
                  </p>
                ) : null}
              </div>
            </div>
            <table className="wp-form-table">
              <tbody>
                <Field
                  label="Image URL"
                  hint="Prefer upload. Paste only if the PNG already has a transparent background.">
                  <TextInput
                    value={artifact.imageUrl}
                    onChange={(value) => {
                      patchArtifact({ imageUrl: value });
                      if (!artifact.name.trim() && value) {
                        const derived = formatNameFromFilename(
                          value.split("/").pop() || "",
                        );
                        if (derived)
                          patchArtifact({ imageUrl: value, name: derived });
                      }
                    }}
                    placeholder="/uploads/artifacts/ornament.png"
                  />
                </Field>
              </tbody>
            </table>
          </Metabox>
        </div>

        <div className="wp-edit-sidebar">
          <Metabox
            id="artifact_publish"
            title="Publish"
            badge={artifact.status === "draft" ? "Draft" : "Published"}>
            <PublishStatusControl
              status={artifact.status}
              onChange={(status) => patchArtifact({ status })}
              hint="Draft ornaments stay off the public shelf, even when they are placed in the builder."
            />
            <div style={{ marginBottom: 12 }}>
              <span
                className={`wp-status ${placed ? "is-publish" : "is-draft"}`}>
                {placed ? "On shelf" : "Not on shelf"}
              </span>
            </div>
            <label className="wp-shelf-toggle wp-shelf-toggle-block">
              <input
                type="checkbox"
                checked={artifact.enabled}
                onChange={(e) => patchArtifact({ enabled: e.target.checked })}
              />
              Enabled in catalog
            </label>
            <p className="wp-sub" style={{ marginTop: 0 }}>
              {placed
                ? "Placed on the bookshelf. You can also remove it here."
                : "Not placed on the shelf yet. Open the Shelf Builder tab to place it."}
            </p>
            <div className="wp-publish-actions" style={{ marginTop: 12 }}>
              <button
                type="button"
                className="wp-btn-link trash"
                onClick={() => {
                  setData({
                    ...data,
                    shelfArtifacts: artifactsList.filter(
                      (_, j) => j !== artIndex,
                    ),
                  });
                  go("artifacts");
                }}>
                Move to Trash
              </button>
              <CmsSaveButton
                save={save}
                dirty={dirty}
                status={status}
                label="Update"
                className="wp-btn wp-btn-primary"
              />
            </div>
            {placed ? (
              <button
                type="button"
                className="wp-btn"
                style={{ marginTop: 12, width: "100%" }}
                onClick={() =>
                  setData({
                    ...data,
                    shelfLayout: removeArtifactFromLayout(
                      shelfLayout,
                      artifact.id,
                    ),
                  })
                }>
                Remove from shelf
              </button>
            ) : null}
          </Metabox>
        </div>
      </div>
    </>
  );
}
