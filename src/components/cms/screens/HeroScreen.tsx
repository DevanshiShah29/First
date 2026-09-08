"use client";

// Application services & types
import {
  HERO_TEMPLATES,
  type ContentData,
  type HeroMedia,
} from "@/content/types";
import { mediaHint } from "@/lib/media-url";
import { goodreadsHint, pianoMusicHint } from "../types";

// UI components
import {
  HeroThumb,
  MediaLayoutPreview,
  MediaVisual,
} from "../components/MediaPreview";
import { Metabox } from "../components/Metabox";
import { EditorTabs } from "../preview/EditorTabs";
import { LivePreviewShell } from "../preview/LivePreviewShell";
import { Field, StringList, TextArea, TextInput } from "../fields";

interface HeroScreenProps {
  data: ContentData;
  setData: (data: ContentData) => void;
  setHeroMedia: (patch: Partial<HeroMedia>) => void;
  uploadHeroFile: (file: File) => Promise<void>;
  uploading: boolean;
  save: () => Promise<void>;
  dirty: boolean;
}

/**
 * Renders hero template, copy, and media editors.
 * @example <HeroScreen data={data} setHeroMedia={…} … />
 */
export function HeroScreen({
  data,
  setData,
  setHeroMedia,
  uploadHeroFile,
  uploading,
  save,
  dirty,
}: HeroScreenProps) {
  const site = data.site;
  const heroMedia = site.heroMedia;

  return (
    <>
      <h1 className="wp-screen-title">Hero</h1>
      <p className="wp-sub">
        Pick one template. Only the live layout appears on the public site. Copy is shared across all of them.{" "}
        <a href="/" target="_blank" rel="noreferrer">
          Preview site
        </a>
      </p>
      <EditorTabs
        preview={<LivePreviewShell data={data} dirty={dirty} section="hero" />}
      >
      <Metabox
        id="hero_templates"
        title="Templates"
        badge={HERO_TEMPLATES.find((t) => t.id === site.heroTemplate)?.name}
      >
        <div className="wp-template-grid">
          {HERO_TEMPLATES.map((tpl) => {
            const live = site.heroTemplate === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                className={`wp-template-card${live ? " is-live" : ""}`}
                onClick={() =>
                  setData({ ...data, site: { ...site, heroTemplate: tpl.id } })
                }
              >
                <HeroThumb id={tpl.id} site={site} theme={data.theme} />
                <div className="wp-template-meta">
                  <h3>{tpl.name}</h3>
                  <p>{tpl.description}</p>
                  {live ? (
                    <span className="wp-live-badge">Live</span>
                  ) : (
                    <span className="wp-btn wp-btn-primary">Activate</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </Metabox>
      <Metabox
        id="hero_media"
        title="Media"
        badge={heroMedia.kind !== "none" ? `${heroMedia.kind} (${heroMedia.place})` : "none"}
      >
        <MediaLayoutPreview site={site} theme={data.theme} media={heroMedia} />
        {(site.heroTemplate === "world" ||
          site.heroTemplate === "nook" ||
          site.heroTemplate === "studio") &&
        heroMedia.kind !== "none" ? (
          <p className="wp-description" style={{ margin: "0 0 12px" }}>
            A 3D hero is live, so this media is hidden on the public site until you activate another
            template.
          </p>
        ) : null}
        <table className="wp-form-table">
          <tbody>
            <tr>
              <th scope="row">Type</th>
              <td>
                {(["none", "image", "video"] as const).map((kind) => (
                  <label key={kind} className="wp-check">
                    <input
                      type="radio"
                      name="heroMediaKind"
                      checked={heroMedia.kind === kind}
                      onChange={() => setHeroMedia({ kind })}
                    />
                    {kind === "none" ? "None" : kind === "image" ? "Image" : "Video"}
                  </label>
                ))}
              </td>
            </tr>
            {heroMedia.kind !== "none" ? (
              <>
                <tr>
                  <th scope="row">Placement</th>
                  <td>
                    <label className="wp-check">
                      <input
                        type="radio"
                        name="heroMediaPlace"
                        checked={heroMedia.place === "side"}
                        onChange={() => setHeroMedia({ place: "side" })}
                      />
                      Side
                    </label>
                    <label className="wp-check">
                      <input
                        type="radio"
                        name="heroMediaPlace"
                        checked={heroMedia.place === "background"}
                        onChange={() => setHeroMedia({ place: "background" })}
                      />
                      Background
                    </label>
                  </td>
                </tr>
                {heroMedia.place === "side" ? (
                  <tr>
                    <th scope="row">Side</th>
                    <td>
                      <label className="wp-check">
                        <input
                          type="radio"
                          name="heroMediaSide"
                          checked={heroMedia.side === "left"}
                          onChange={() => setHeroMedia({ side: "left" })}
                        />
                        Left
                      </label>
                      <label className="wp-check">
                        <input
                          type="radio"
                          name="heroMediaSide"
                          checked={heroMedia.side === "right"}
                          onChange={() => setHeroMedia({ side: "right" })}
                        />
                        Right
                      </label>
                    </td>
                  </tr>
                ) : null}
                <Field label="File" hint="JPG, PNG, WebP, GIF, MP4, or WebM. Max 25MB.">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/ogg"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void uploadHeroFile(file);
                      e.target.value = "";
                    }}
                  />
                  {uploading ? <span className="wp-description">Uploading…</span> : null}
                </Field>
                <Field
                  label="URL"
                  hint={
                    mediaHint(heroMedia.url) ||
                    "YouTube, Vimeo, a Pexels video page, a direct .mp4, or an uploaded file."
                  }
                >
                  <TextInput
                    value={heroMedia.url}
                    onChange={(url) => setHeroMedia({ url })}
                    placeholder="https://www.pexels.com/video/…"
                  />
                </Field>
                {heroMedia.url ? (
                  <tr>
                    <th scope="row">Asset</th>
                    <td>
                      <div className="wp-media-preview">
                        <MediaVisual media={heroMedia} />
                      </div>
                      <p style={{ marginTop: 8 }}>
                        <button
                          type="button"
                          className="wp-btn-link"
                          onClick={() => setHeroMedia({ kind: "none", url: "" })}
                        >
                          Remove media
                        </button>
                      </p>
                    </td>
                  </tr>
                ) : null}
              </>
            ) : null}
          </tbody>
        </table>
      </Metabox>
      <Metabox id="hero_world" title="3D World">
        <p style={{ margin: "0 0 12px" }}>
          Used when a 3D hero is live. The piano plays this track in the page — visitors never leave the
          site. Books open the reading page.
        </p>
        <table className="wp-form-table">
          <tbody>
            <Field label="Piano Music YouTube URL" wide hint={pianoMusicHint(site.pianoYoutubeUrl ?? "")}>
              <TextInput
                value={site.pianoYoutubeUrl ?? ""}
                onChange={(pianoYoutubeUrl) =>
                  setData({ ...data, site: { ...site, pianoYoutubeUrl } })
                }
                placeholder="https://www.youtube.com/watch?v=…"
              />
            </Field>
            <Field label="Goodreads profile URL" wide hint={goodreadsHint(site.goodreadsUrl ?? "")}>
              <TextInput
                value={site.goodreadsUrl ?? ""}
                onChange={(goodreadsUrl) => setData({ ...data, site: { ...site, goodreadsUrl } })}
                placeholder="https://www.goodreads.com/user/show/…"
              />
            </Field>
          </tbody>
        </table>
      </Metabox>
      <Metabox id="hero_copy" title="Hero copy">
        <table className="wp-form-table">
          <tbody>
            <Field label="Kicker">
              <TextInput
                value={site.kicker}
                onChange={(kicker) => setData({ ...data, site: { ...site, kicker } })}
              />
            </Field>
            <Field label="Greeting">
              <TextInput
                value={site.greeting}
                onChange={(greeting) => setData({ ...data, site: { ...site, greeting } })}
              />
            </Field>
            <Field label="Typed roles" wide>
              <StringList
                values={site.roles}
                onChange={(roles) => setData({ ...data, site: { ...site, roles } })}
                addLabel="Add role"
                placeholder="Product Manager"
              />
            </Field>
            <Field label="One-liner" wide>
              <TextArea
                value={site.line}
                onChange={(line) => setData({ ...data, site: { ...site, line } })}
                rows={3}
              />
            </Field>
          </tbody>
        </table>
      </Metabox>
      <p>
        <button
          type="button"
          className="wp-btn wp-btn-primary wp-btn-large"
          onClick={() => void save()}
          disabled={!dirty}
        >
          Save Changes
        </button>
      </p>
      </EditorTabs>
    </>
  );
}
