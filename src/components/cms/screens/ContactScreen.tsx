"use client";

// Application services & types
import type { ContentData } from "@/content/types";
import { resumeFileLabel } from "@/lib/resume";

// UI components
import { Metabox } from "../components/Metabox";
import { EditorTabs } from "../preview/EditorTabs";
import { LivePreviewShell } from "../preview/LivePreviewShell";
import { Field, TextInput } from "../fields";

interface ContactScreenProps {
  data: ContentData;
  setData: (data: ContentData) => void;
  uploadResume: (file: File) => Promise<void>;
  uploading: boolean;
  save: () => Promise<void>;
  dirty: boolean;
}

/**
 * Renders Contact/social/resume editors.
 * @example <ContactScreen data={data} uploadResume={…} … />
 */
export function ContactScreen({
  data,
  setData,
  uploadResume,
  uploading,
  save,
  dirty,
}: ContactScreenProps) {
  const site = data.site;

  return (
    <>
      <h1 className="wp-screen-title">Contact</h1>
      <p className="wp-sub">Email, resume, and social links shown on the public site.</p>
      <EditorTabs
        preview={<LivePreviewShell data={data} dirty={dirty} section="contact" />}
      >

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
