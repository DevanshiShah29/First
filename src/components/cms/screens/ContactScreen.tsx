"use client";

// Application services & types
import {
  DEFAULT_CONTACT_MEDIA,
  type ContactMedia,
  type ContentData,
  type HeroMedia,
} from "@/content/types";
import { resumeFileLabel } from "@/lib/resume";

// UI components
import { CmsSaveButton, type CmsSaveStatus } from "../components/CmsSaveButton";
import { MediaVisual } from "../components/MediaPreview";
import { Metabox } from "../components/Metabox";
import { EditorTabs } from "../preview/EditorTabs";
import { LivePreviewShell } from "../preview/LivePreviewShell";
import { Field, TextInput } from "../fields";

interface ContactScreenProps {
  data: ContentData;
  setData: (data: ContentData) => void;
  setContactMedia: (patch: Partial<ContactMedia>) => void;
  uploadContactFile: (file: File) => Promise<void>;
  uploadResume: (file: File) => Promise<void>;
  uploading: boolean;
  save: () => Promise<void>;
  dirty: boolean;
  status: CmsSaveStatus;
}

/**
 * Renders Contact/social/resume editors.
 * @example <ContactScreen data={data} uploadResume={…} … />
 */
export function ContactScreen({
  data,
  setData,
  setContactMedia,
  uploadContactFile,
  uploadResume,
  uploading,
  save,
  dirty,
  status,
}: ContactScreenProps) {
  const site = data.site;
  const contactMedia = site.contactMedia ?? DEFAULT_CONTACT_MEDIA;
  const hasFile = Boolean(contactMedia.url.trim());
  const previewMedia: HeroMedia = {
    kind: contactMedia.kind,
    url: contactMedia.url,
    place: "side",
    side: "right",
  };

  return (
    <>
      <h1 className="wp-screen-title">Contact</h1>
      <p className="wp-sub">Email, resume, social links, and the image or video on the contact card.</p>
      <EditorTabs
        preview={<LivePreviewShell data={data} dirty={dirty} section="contact" />}
      >

      <Metabox
        id="contact_media"
        title="Media"
        badge={hasFile && contactMedia.kind !== "none" ? contactMedia.kind : "graphic"}
      >
        <p className="wp-description" style={{ marginTop: 0 }}>
          The current graphic stays on the contact card until you upload an image or video and save.
          Remove the file, or choose Current graphic, to bring that graphic back.
        </p>
        <table className="wp-form-table">
          <tbody>
            <tr>
              <th scope="row">Type</th>
              <td>
                {(["none", "image", "video"] as const).map((kind) => (
                  <label key={kind} className="wp-check">
                    <input
                      type="radio"
                      name="contactMediaKind"
                      checked={contactMedia.kind === kind}
                      onChange={() => setContactMedia({ kind })}
                    />
                    {kind === "none" ? "Current graphic" : kind === "image" ? "Image" : "Video"}
                  </label>
                ))}
              </td>
            </tr>
            {contactMedia.kind !== "none" ? (
              <>
                <Field
                  label="File"
                  hint={
                    hasFile
                      ? "JPG, PNG, WebP, GIF, AVIF, MP4, or WebM. Max 25MB. Change replaces the current file. Save to publish."
                      : "JPG, PNG, WebP, GIF, AVIF, MP4, or WebM. Max 25MB."
                  }
                  wide
                >
                  <div className="wp-skill-icon-source">
                    <label className="wp-skill-file">
                      <span className="wp-btn">
                        {uploading ? "Uploading…" : hasFile ? "Change" : "Upload"}
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/ogg"
                        disabled={uploading}
                        aria-label={hasFile ? "Change contact media" : "Upload contact media"}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void uploadContactFile(file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                </Field>
                <Field
                  label="URL"
                  hint="Paste a new image or video URL to replace the uploaded file. YouTube and Vimeo links embed on the card."
                >
                  <TextInput
                    value={contactMedia.url}
                    onChange={(url) => setContactMedia({ url })}
                    placeholder="https://…"
                  />
                </Field>
                <Field
                  label="Alt text"
                  hint="Describe the image for screen readers. Leave this blank when the media is decorative."
                >
                  <TextInput
                    value={contactMedia.alt}
                    onChange={(alt) => setContactMedia({ alt })}
                  />
                </Field>
                {hasFile ? (
                  <tr>
                    <th scope="row">Preview</th>
                    <td>
                      <div className="wp-media-preview">
                        <MediaVisual media={previewMedia} />
                      </div>
                      <p style={{ marginTop: 8 }}>
                        <button
                          type="button"
                          className="wp-btn-link"
                          onClick={() => setContactMedia({ kind: "none", url: "", alt: "" })}
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

      <Metabox id="contact_details" title="Contact">
        <table className="wp-form-table">
          <tbody>
            <Field label="Contact line">
              <TextInput
                value={site.contactLine}
                onChange={(contactLine) => setData({ ...data, site: { ...site, contactLine } })}
              />
            </Field>
            <Field label="Email" hint="Contact form messages are emailed here.">
              <TextInput
                type="email"
                value={site.email}
                onChange={(email) => setData({ ...data, site: { ...site, email } })}
              />
            </Field>
            <Field
              label="Resume"
              hint="Upload a PDF (max 10MB). The public Download Resume buttons always use the latest saved file."
              wide
            >
              <div className="wp-skill-icon-source">
                <label className="wp-skill-file">
                  <span className="wp-btn">{uploading ? "Uploading…" : "Upload PDF"}</span>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    disabled={uploading}
                    aria-label="Upload resume PDF"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void uploadResume(file);
                      e.target.value = "";
                    }}
                  />
                </label>
                <TextInput
                  value={site.resume}
                  placeholder="or paste a PDF URL"
                  onChange={(resume) => setData({ ...data, site: { ...site, resume } })}
                />
                {site.resume ? (
                  <a className="wp-btn" href={site.resume} target="_blank" rel="noreferrer">
                    View
                  </a>
                ) : (
                  <span className="wp-description">No file yet</span>
                )}
              </div>
              {site.resume ? (
                <span className="wp-description">{resumeFileLabel(site.resume)}</span>
              ) : null}
            </Field>
            <Field label="LinkedIn">
              <TextInput
                value={site.linkedin}
                onChange={(linkedin) => setData({ ...data, site: { ...site, linkedin } })}
              />
            </Field>
            <Field label="GitHub">
              <TextInput
                value={site.github}
                onChange={(github) => setData({ ...data, site: { ...site, github } })}
              />
            </Field>
          </tbody>
        </table>
      </Metabox>

      <p>
        <CmsSaveButton save={save} dirty={dirty} status={status} />
      </p>
      </EditorTabs>
    </>
  );
}
