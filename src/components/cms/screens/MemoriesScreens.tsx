"use client";

import Link from "next/link";
import type { ContentData, MemoryItem } from "@/content/types";
import { Metabox } from "../components/Metabox";
import { DatePicker, Field, HexColorInput, TextArea, TextInput } from "../fields";
import { move, type Screen } from "../types";

export function MemoriesListScreen({
  data,
  setData,
  memoriesList,
  go,
  addMemory,
  uploadMemoryPhoto,
  uploading,
}: {
  data: ContentData;
  setData: (data: ContentData) => void;
  memoriesList: MemoryItem[];
  go: (screen: Screen, id?: string | null) => void;
  addMemory: () => void;
  uploadMemoryPhoto: (file: File, id: string) => Promise<void>;
  uploading: boolean;
}) {
  return (
    <>
      <h1 className="wp-screen-title">
        Memory Jar
        <button type="button" className="wp-btn wp-btn-primary" onClick={addMemory}>
          Add New
        </button>
        <Link href="/memories" target="_blank" className="wp-btn" style={{ marginLeft: 8 }}>
          View Live Jar ↗
        </Link>
      </h1>
      <p className="wp-sub">
        Memories hidden inside your interactive Memory Jar. When visitors tap the jar, memories are unlocked one by one.
      </p>
      <table className="wp-list-table">
        <thead>
          <tr>
            <th>Memory</th>
            <th>Category</th>
            <th>When</th>
            <th>Photo</th>
          </tr>
        </thead>
        <tbody>
          {memoriesList.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ textAlign: "center", padding: "2rem", color: "#666" }}>
                No memories in the jar yet.{" "}
                <button type="button" className="wp-btn wp-btn-primary" onClick={addMemory}>
                  Add your first memory
                </button>
              </td>
            </tr>
          ) : (
            memoriesList.map((item, i) => (
              <tr key={item.id}>
                <td>
                  <button type="button" className="row-title" onClick={() => go("memories-edit", item.id)}>
                    {item.title || item.note.slice(0, 30) || "(untitled memory)"}
                  </button>
                  <div style={{ fontSize: "0.85rem", color: "#646970", marginTop: 2, maxHeight: "2.4em", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.note || "(empty note)"}
                  </div>
                  <div className="wp-row-actions">
                    <button type="button" onClick={() => go("memories-edit", item.id)}>
                      Edit
                    </button>
                    {" | "}
                    <button
                      type="button"
                      onClick={() => setData({ ...data, memories: move(memoriesList, i, -1) })}
                      disabled={i === 0}
                    >
                      Up
                    </button>
                    {" | "}
                    <button
                      type="button"
                      onClick={() => setData({ ...data, memories: move(memoriesList, i, 1) })}
                      disabled={i === memoriesList.length - 1}
                    >
                      Down
                    </button>
                    {" | "}
                    <button
                      type="button"
                      className="trash"
                      onClick={() =>
                        setData({ ...data, memories: memoriesList.filter((_, j) => j !== i) })
                      }
                    >
                      Trash
                    </button>
                  </div>
                </td>
                <td>
                  {item.category ? (
                    <span className="wp-status is-publish" style={{ fontSize: "0.75rem" }}>
                      {item.category}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td>{item.date || "—"}</td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {item.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.photoUrl}
                        alt=""
                        style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 4, flexShrink: 0 }}
                      />
                    ) : null}
                    <label className="wp-skill-file" style={{ margin: 0 }}>
                      <span className="wp-btn" style={{ height: 26, lineHeight: "24px", fontSize: "0.75rem", padding: "0 8px" }}>
                        {uploading ? "…" : item.photoUrl ? "Change" : "+ Photo"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploading}
                        aria-label={`Upload photo for ${item.title || "memory"}`}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void uploadMemoryPhoto(file, item.id);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    {item.photoUrl ? (
                      <button
                        type="button"
                        className="wp-btn-link trash"
                        style={{ fontSize: "0.8rem", textDecoration: "none" }}
                        title="Remove photo"
                        onClick={() => {
                          const memories = memoriesList.map((m) => (m.id === item.id ? { ...m, photoUrl: "" } : m));
                          setData({ ...data, memories });
                        }}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </>
  );
}

export function MemoriesEditScreen({
  data,
  setData,
  memory,
  memIndex,
  memoriesList,
  go,
  uploadMemoryPhoto,
  uploading,
  save,
  dirty,
}: {
  data: ContentData;
  setData: (data: ContentData) => void;
  memory: MemoryItem;
  memIndex: number;
  memoriesList: MemoryItem[];
  go: (screen: Screen) => void;
  uploadMemoryPhoto: (file: File, id: string) => Promise<void>;
  uploading: boolean;
  save: () => Promise<void>;
  dirty: boolean;
}) {
  return (
    <>
      <h1 className="wp-screen-title">
        {memory.title === "New memory" ? "Add New Memory" : `Edit Memory: ${memory.title || "Untitled"}`}
      </h1>
      <div className="wp-edit">
        <div>
          <input
            className="wp-title-input"
            value={memory.title ?? ""}
            placeholder="Enter memory title (optional)"
            onChange={(e) => {
              const memories = [...memoriesList];
              memories[memIndex] = { ...memory, title: e.target.value };
              setData({ ...data, memories });
            }}
          />
          <Metabox id="mem_details" title="Memory Content" badge={memory.category || undefined}>
            <table className="wp-form-table">
              <tbody>
                <Field label="Memory Note" wide hint="The story, feeling, or moment that will appear when this memory is revealed.">
                  <TextArea
                    value={memory.note}
                    rows={6}
                    placeholder="Describe this moment, what made it special, or what you learned..."
                    onChange={(note) => {
                      const memories = [...memoriesList];
                      memories[memIndex] = { ...memory, note };
                      setData({ ...data, memories });
                    }}
                  />
                </Field>
                <Field label="Date" hint="Pick a date using the calendar picker, or enter custom text.">
                  <DatePicker
                    value={memory.date ?? ""}
                    placeholder="e.g. 15 Aug 2026 or Summer 2024"
                    onChange={(date) => {
                      const memories = [...memoriesList];
                      memories[memIndex] = { ...memory, date };
                      setData({ ...data, memories });
                    }}
                  />
                </Field>
                <Field label="Category">
                  <div>
                    <TextInput
                      value={memory.category ?? ""}
                      placeholder="e.g. Milestone, Tiny Joy, Craft, Life"
                      onChange={(category) => {
                        const memories = [...memoriesList];
                        memories[memIndex] = { ...memory, category };
                        setData({ ...data, memories });
                      }}
                    />
                    <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {["Milestone", "Tiny Joy", "Craft", "Discovery", "Learning", "Life"].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          className="wp-btn"
                          style={{ fontSize: "0.75rem", padding: "2px 8px" }}
                          onClick={() => {
                            const memories = [...memoriesList];
                            memories[memIndex] = { ...memory, category: cat };
                            setData({ ...data, memories });
                          }}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </Field>
                <Field label="Glow Accent Color" hint="Custom glow/highlight color for this memory card">
                  <HexColorInput
                    value={memory.color ?? "#A78BFA"}
                    onChange={(color) => {
                      const memories = [...memoriesList];
                      memories[memIndex] = { ...memory, color };
                      setData({ ...data, memories });
                    }}
                  />
                </Field>
                <Field label="Photo Attachment" hint="Upload a photo (JPG, PNG, WebP, GIF, SVG) or paste an image URL.">
                  <div>
                    <div className="wp-skill-icon-source" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <label className="wp-skill-file">
                        <span className="wp-btn wp-btn-primary">
                          {uploading ? "Uploading…" : memory.photoUrl ? "Change Photo" : "Upload Photo"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploading}
                          aria-label="Upload memory photo"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void uploadMemoryPhoto(file, memory.id);
                            e.target.value = "";
                          }}
                        />
                      </label>
                      <TextInput
                        value={memory.photoUrl ?? ""}
                        placeholder="or paste an image URL: https://…"
                        onChange={(photoUrl) => {
                          const memories = [...memoriesList];
                          memories[memIndex] = { ...memory, photoUrl };
                          setData({ ...data, memories });
                        }}
                      />
                      {memory.photoUrl ? (
                        <button
                          type="button"
                          className="wp-btn-link"
                          onClick={() => {
                            const memories = [...memoriesList];
                            memories[memIndex] = { ...memory, photoUrl: "" };
                            setData({ ...data, memories });
                          }}
                        >
                          Remove photo
                        </button>
                      ) : null}
                    </div>
                    {uploading ? <span className="wp-description" style={{ display: "block", marginTop: 6 }}>Uploading photo…</span> : null}
                    {memory.photoUrl ? (
                      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 14 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={memory.photoUrl}
                          alt="Memory preview"
                          style={{
                            width: 100,
                            height: 100,
                            objectFit: "cover",
                            borderRadius: 6,
                            border: "1px solid #c3c4c7",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                          }}
                        />
                        <div style={{ fontSize: "0.85rem", color: "#646970" }}>
                          <div style={{ fontWeight: 500, color: "#2c3338" }}>Photo attached</div>
                          <div style={{ wordBreak: "break-all", fontSize: "0.75rem", marginTop: 4 }}>{memory.photoUrl}</div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </Field>
              </tbody>
            </table>
          </Metabox>
        </div>
        <Metabox id="mem_publish" title="Publish">
          <div className="wp-publish-actions">
            <button
              type="button"
              className="wp-btn-link"
              onClick={() => {
                setData({ ...data, memories: memoriesList.filter((m) => m.id !== memory.id) });
                go("memories");
              }}
            >
              Move to Trash
            </button>
            <button type="button" className="wp-btn wp-btn-primary" onClick={() => void save()} disabled={!dirty}>
              Update
            </button>
          </div>
        </Metabox>
      </div>
    </>
  );
}
