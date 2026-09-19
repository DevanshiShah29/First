"use client";

// External dependencies
import Link from "next/link";
import type { Dispatch, SetStateAction } from "react";

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
import { Field, TextInput } from "../fields";
import { ShelfPlacementEditor } from "../shelf/ShelfPlacementEditor";
import { countPlacedItems, removeArtifactFromLayout } from "../shelf/shelfBuilderOps";

const PHOTOROOM_URL = "https://www.photoroom.com/tools/background-remover";

/**
 * Renders the transparent-PNG guidance callout.
 * @example <BgRemoveNote />
 */
function BgRemoveNote() {
  return (
    <div className="wp-shelf-callout" role="note">
      <strong>Transparent background required</strong>
      <p>
        Any decor you upload must have its background removed first, or it will show as a solid box
        on the shelf. Use a free tool like{" "}
        <a href={PHOTOROOM_URL} target="_blank" rel="noopener noreferrer">
          PhotoRoom Background Remover
        </a>
        , then upload the PNG.
      </p>
    </div>
  );
}

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
}: {
  data: ContentData;
  setData: Dispatch<SetStateAction<ContentData>>;
  artifactsList: ShelfArtifactItem[];
  go: (screen: Screen, id?: string | null) => void;
  addArtifact: () => void;
  uploadArtifactImage: (file: File, id: string) => Promise<void>;
  uploading: boolean;
}) {
  const shelfLayout: ShelfLayout = data.shelfLayout ?? EMPTY_SHELF_LAYOUT;
  const placedCounts = countPlacedItems(shelfLayout);
  const enabledCount = artifactsList.filter((item) => item.enabled).length;
  const placedOrnamentCount = artifactsList.filter((item) =>
    isArtifactOnShelf(shelfLayout, item.id),
  ).length;

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
      <h1 className="wp-screen-title">
        Shelf
        <button type="button" className="wp-btn wp-btn-primary" onClick={addArtifact}>
          Add New
        </button>
        <Link href="/reading" target="_blank" className="wp-btn" style={{ marginLeft: 8 }}>
          View Reading page ↗
        </Link>
      </h1>

      <div className="wp-shelf-hero">
        <p className="wp-sub" style={{ margin: 0 }}>
          Books come from Goodreads. Compose planks with book stacks and White Space; place decor
          anywhere on the cabinet and resize it. Desktop and mobile layouts are independent.
        </p>
        <div className="wp-shelf-stats" aria-label="Catalog summary">
          <span>
            <strong>{artifactsList.length}</strong> in catalog
          </span>
          <span>
            <strong>{enabledCount}</strong> enabled
          </span>
          <span>
            <strong>{placedOrnamentCount}</strong> ornaments on shelf
          </span>
          <span>
            <strong>{placedCounts.stacks}</strong> stacks ·{" "}
            <strong>{placedCounts.books}</strong> books ·{" "}
            <strong>{placedCounts.spacers}</strong> spacers
          </span>
        </div>
      </div>

      <BgRemoveNote />

      <div className="wp-shelf-steps" aria-label="How to use">
        <div className="wp-shelf-step">
          <span className="wp-shelf-step-num">1</span>
          <div>
            <strong>Add ornaments</strong>
            <p>Upload a PNG with no background, name it, and keep it enabled.</p>
          </div>
        </div>
        <div className="wp-shelf-step">
          <span className="wp-shelf-step-num">2</span>
          <div>
            <strong>Build the shelf</strong>
            <p>
              Drop stacks onto a plank and pick Goodreads books, use White Space for gaps, and
              place/resize decor anywhere. Select a stack to edit or remove it.
            </p>
          </div>
        </div>
        <div className="wp-shelf-step">
          <span className="wp-shelf-step-num">3</span>
          <div>
            <strong>Save</strong>
            <p>Publish to /reading. Configure Desktop and Mobile separately.</p>
          </div>
        </div>
      </div>

      <Metabox id="artifact_arrange" title="Shelf Builder">
        <ShelfPlacementEditor
          artifacts={artifactsList}
          onChangeArtifacts={setCatalog}
          shelfLayout={shelfLayout}
          onChangeLayout={setLayout}
        />
      </Metabox>

      <Metabox id="artifact_catalog" title="Catalog">
        {artifactsList.length === 0 ? (
          <div className="wp-shelf-empty">
            <p>No ornaments yet.</p>
            <button type="button" className="wp-btn wp-btn-primary" onClick={addArtifact}>
              Add your first ornament
            </button>
          </div>
        ) : (
          <div className="wp-shelf-card-grid">
            {artifactsList.map((item, i) => {
              const placed = isArtifactOnShelf(shelfLayout, item.id);
              return (
                <article key={item.id} className={`wp-shelf-card${placed ? " is-placed" : ""}`}>
                  <button
                    type="button"
                    className="wp-shelf-card-preview"
                    onClick={() => go("artifacts-edit", item.id)}
                    aria-label={`Edit ${item.name || "ornament"}`}
                  >
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt="" />
                    ) : (
                      <span className="wp-shelf-card-missing">No image</span>
                    )}
                  </button>
                  <div className="wp-shelf-card-body">
                    <button
                      type="button"
                      className="wp-shelf-card-title"
                      onClick={() => go("artifacts-edit", item.id)}
                    >
                      {item.name || "(untitled)"}
                    </button>
                    <p className="wp-shelf-card-meta">
                      {item.widthRem.toFixed(2)} × {item.heightRem.toFixed(2)} rem
                      {placed ? " · on shelf" : " · not placed"}
                    </p>
                    <div className="wp-shelf-card-actions">
                      <label className="wp-shelf-toggle">
                        <input
                          type="checkbox"
                          checked={item.enabled}
                          onChange={(e) => patchAt(i, { enabled: e.target.checked })}
                        />
                        Enabled
                      </label>
                      <label className="wp-skill-file" style={{ margin: 0 }}>
                        <span className="wp-btn wp-btn-small">
                          {uploading ? "…" : item.imageUrl ? "Image" : "+ Image"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploading}
                          aria-label={`Upload image for ${item.name || "ornament"}`}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void uploadArtifactImage(file, item.id);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </div>
                    <div className="wp-row-actions" style={{ marginTop: 6 }}>
                      <button type="button" onClick={() => go("artifacts-edit", item.id)}>
                        Edit
                      </button>
                      {" | "}
                      <button
                        type="button"
                        onClick={() => setCatalog(move(artifactsList, i, -1))}
                        disabled={i === 0}
                      >
                        Up
                      </button>
                      {" | "}
                      <button
                        type="button"
                        onClick={() => setCatalog(move(artifactsList, i, 1))}
                        disabled={i === artifactsList.length - 1}
                      >
                        Down
                      </button>
                      {" | "}
                      <button
                        type="button"
                        className="trash"
                        onClick={() =>
                          setCatalog(artifactsList.filter((_, j) => j !== i))
                        }
                      >
                        Trash
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Metabox>
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
  uploadArtifactImage: (file: File, id: string) => Promise<void>;
  uploading: boolean;
  save: () => Promise<void>;
  dirty: boolean;
  status: CmsSaveStatus;
}) {
  /**
   * Patches the active ornament in document state.
   * @example patchArtifact({ name: "Globe" }) // void
   */
  function patchArtifact(patch: Partial<ShelfArtifactItem>) {
    const shelfArtifacts = [...artifactsList];
    shelfArtifacts[artIndex] = { ...artifact, ...patch };
    setData({ ...data, shelfArtifacts });
  }

  const shelfLayout: ShelfLayout = data.shelfLayout ?? EMPTY_SHELF_LAYOUT;
  const placed = isArtifactOnShelf(shelfLayout, artifact.id);

  return (
    <>
      <h1 className="wp-screen-title">
        {artifact.name === "New ornament"
          ? "Add New Ornament"
          : `Edit Ornament: ${artifact.name || "Untitled"}`}
      </h1>

      <BgRemoveNote />

      <div className="wp-edit">
        <div>
          <input
            className="wp-title-input"
            value={artifact.name}
            placeholder="Enter ornament name"
            onChange={(e) => patchArtifact({ name: e.target.value })}
          />
          <Metabox id="artifact_image" title="Image">
            <div
              style={{
                display: "flex",
                gap: 16,
                alignItems: "flex-start",
                flexWrap: "wrap",
                marginBottom: 12,
              }}
            >
              {artifact.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={artifact.imageUrl}
                  alt=""
                  className="wp-shelf-edit-thumb"
                  style={{
                    width: `${Math.max(40, artifact.widthRem * 14)}px`,
                    height: `${Math.max(48, artifact.heightRem * 14)}px`,
                  }}
                />
              ) : (
                <div className="wp-shelf-edit-thumb is-empty" aria-hidden />
              )}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <label className="wp-skill-file" style={{ margin: 0 }}>
                  <span className="wp-btn">
                    {uploading ? "Uploading…" : artifact.imageUrl ? "Change image" : "Upload image"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    aria-label="Upload shelf ornament image"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void uploadArtifactImage(file, artifact.id);
                      e.target.value = "";
                    }}
                  />
                </label>
                {artifact.imageUrl ? (
                  <button
                    type="button"
                    className="wp-btn"
                    onClick={() => patchArtifact({ imageUrl: "" })}
                  >
                    Remove image
                  </button>
                ) : null}
              </div>
            </div>
            <table className="wp-form-table">
              <tbody>
                <Field
                  label="Image URL"
                  hint="Prefer upload. Paste only if the PNG already has a transparent background."
                >
                  <TextInput
                    value={artifact.imageUrl}
                    onChange={(value) => patchArtifact({ imageUrl: value })}
                    placeholder="/uploads/artifacts/ornament.png"
                  />
                </Field>
              </tbody>
            </table>
          </Metabox>

          <Metabox id="artifact_size" title="Size">
            <p className="wp-sub" style={{ marginTop: 0 }}>
              Default size when this ornament is placed on the cabinet. Any positive rem size is
              allowed.
            </p>
            <table className="wp-form-table">
              <tbody>
                <Field label="Width (rem)">
                  <TextInput
                    type="number"
                    value={String(artifact.widthRem)}
                    onChange={(value) => {
                      const next = Number(value);
                      if (Number.isFinite(next)) patchArtifact({ widthRem: next });
                    }}
                  />
                </Field>
                <Field label="Height (rem)">
                  <TextInput
                    type="number"
                    value={String(artifact.heightRem)}
                    onChange={(value) => {
                      const next = Number(value);
                      if (Number.isFinite(next)) patchArtifact({ heightRem: next });
                    }}
                  />
                </Field>
              </tbody>
            </table>
          </Metabox>
        </div>

        <div className="wp-edit-sidebar">
          <Metabox id="artifact_publish" title="Publish">
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <input
                type="checkbox"
                checked={artifact.enabled}
                onChange={(e) => patchArtifact({ enabled: e.target.checked })}
              />
              Enabled in catalog
            </label>
            <p className="wp-sub" style={{ marginTop: 0 }}>
              {placed
                ? "On the shelf (desktop and/or mobile). Remove it in the Shelf Builder, or use Remove from shelf."
                : "Not on the shelf yet — open Shelf Builder to place it freely on the cabinet."}
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <CmsSaveButton save={save} dirty={dirty} status={status} />
              <button type="button" className="wp-btn" onClick={() => go("artifacts")}>
                Back to builder
              </button>
            </div>
            {placed ? (
              <button
                type="button"
                className="wp-btn"
                style={{ marginTop: 8 }}
                onClick={() =>
                  setData({
                    ...data,
                    shelfLayout: removeArtifactFromLayout(shelfLayout, artifact.id),
                  })
                }
              >
                Remove from shelf
              </button>
            ) : null}
            <button
              type="button"
              className="wp-btn-link trash"
              style={{ marginTop: 12, display: "inline-block" }}
              onClick={() => {
                setData({
                  ...data,
                  shelfArtifacts: artifactsList.filter((_, j) => j !== artIndex),
                });
                go("artifacts");
              }}
            >
              Move to Trash
            </button>
          </Metabox>
        </div>
      </div>
    </>
  );
}
