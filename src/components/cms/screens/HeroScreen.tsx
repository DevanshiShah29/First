"use client";

// External dependencies
import { useState } from "react";

// Application services & types
import {
  HERO_TEMPLATES,
  type ContentData,
  type HeroMedia,
} from "@/content/types";
import { generateHeroCopy, type HeroCopyVariant } from "@/lib/cms-client";
import { mediaHint } from "@/lib/media-url";
import { goodreadsHint, pianoMusicHint } from "../types";

// UI components
import { AiFormSection, AiGeneratePanel } from "../components/AiGeneratePanel";
import { AiVariantPicker } from "../components/AiVariantPicker";
import { CmsSaveButton, type CmsSaveStatus } from "../components/CmsSaveButton";
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
  status: CmsSaveStatus;
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
  status,
}: HeroScreenProps) {
  const site = data.site;
  const heroMedia = site.heroMedia;
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [variants, setVariants] = useState<HeroCopyVariant[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const hasKicker = Boolean(site.kicker.trim());
  const hasGreeting = Boolean(site.greeting.trim());
  const hasRoles = site.roles.some((r) => r.trim());
  const hasLine = Boolean(site.line.trim());
  const hasDraft = hasKicker || hasGreeting || hasRoles || hasLine;

  /**
   * Requests 2–3 polished hero copy variants.
   * @example void onGenerate() // Promise
   */
  async function onGenerate() {
    if (generating) return;
    setGenerateError(null);
    if (!hasDraft) {
      setGenerateError("Add some hero copy first, then generate polished versions.");
      return;
    }
    setGenerating(true);
    const result = await generateHeroCopy({
      kicker: site.kicker,
      greeting: site.greeting,
      roles: site.roles,
      line: site.line,
    });
    setGenerating(false);
    if (!result.ok) {
      setGenerateError(result.error);
      return;
    }
    setVariants(result.data.variants);
    setSelectedIndex(0);
  }

  /**
   * Applies mixed hero fields from chosen option indexes.
   * @example applySelected({ kicker: 0, line: 2 }) // void
   */
  function applySelected(fieldSources: Record<string, number>) {
    const pick = (key: string): HeroCopyVariant | undefined =>
      variants[fieldSources[key] ?? selectedIndex];
    const kicker = pick("kicker");
    const greeting = pick("greeting");
    const roles = pick("roles");
    const line = pick("line");
    if (!kicker && !greeting && !roles && !line) return;
    setData({
      ...data,
      site: {
        ...site,
        kicker: kicker?.kicker ?? site.kicker,
        greeting: greeting?.greeting ?? site.greeting,
        roles: roles?.roles ?? site.roles,
        line: line?.line ?? site.line,
      },
    });
    setVariants([]);
    setSelectedIndex(0);
  }

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
        <div className="wp-ai-stack">
          <AiFormSection
            step={1}
            title="Sources for AI"
            description="Uses your current hero draft only. Generate 2–3 polished versions, then pick one or retry."
          >
            <ul className="wp-ai-source-summary">
              <li>
                <strong>Kicker</strong>
                <span>{hasKicker ? site.kicker : "Empty"}</span>
              </li>
              <li>
                <strong>Greeting</strong>
                <span>{hasGreeting ? site.greeting : "Empty"}</span>
              </li>
              <li>
                <strong>Roles</strong>
                <span>{hasRoles ? site.roles.filter(Boolean).join(", ") : "Empty"}</span>
              </li>
              <li>
                <strong>One-liner</strong>
                <span>{hasLine ? site.line : "Empty"}</span>
              </li>
            </ul>
          </AiFormSection>

          <AiGeneratePanel
            basisItems={[
              { label: "Kicker", ready: hasKicker, optional: true },
              { label: "Greeting", ready: hasGreeting, optional: hasLine || hasRoles },
              { label: "Roles", ready: hasRoles, optional: true },
              { label: "One-liner", ready: hasLine, optional: hasGreeting || hasRoles },
            ]}
            fills="Kicker, Greeting, Roles, and One-liner"
            generating={generating}
            error={generateError}
            onGenerate={() => void onGenerate()}
            disabled={!hasDraft}
          />

          {variants.length > 0 ? (
            <AiFormSection
              step={2}
              title="Pick a version"
              description="Mix fields across options, then apply. Generate with AI again for a fresh set."
              tone="output"
            >
              <AiVariantPicker
                variants={variants}
                selectedIndex={selectedIndex}
                onSelect={setSelectedIndex}
                busy={generating}
                onUse={applySelected}
                onDismiss={() => {
                  setVariants([]);
                  setSelectedIndex(0);
                }}
                fields={[
                  {
                    key: "kicker",
                    label: "Kicker",
                    render: (variant) => variant.kicker,
                  },
                  {
                    key: "greeting",
                    label: "Greeting",
                    render: (variant) => variant.greeting,
                  },
                  {
                    key: "roles",
                    label: "Roles",
                    render: (variant) => variant.roles.join(" · "),
                  },
                  {
                    key: "line",
                    label: "One-liner",
                    render: (variant) => variant.line,
                  },
                ]}
              />
            </AiFormSection>
          ) : null}

          <AiFormSection
            step={variants.length > 0 ? 3 : 2}
            title="Hero fields"
            description="Edit freely after applying a version."
            tone="output"
          >
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
          </AiFormSection>
        </div>
      </Metabox>
      <p>
        <CmsSaveButton save={save} dirty={dirty} status={status} />
      </p>
      </EditorTabs>
    </>
  );
}
