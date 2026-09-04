"use client";

import { HERO_TEMPLATES, type ContentData } from "@/content/types";
import { resumeFileLabel } from "@/lib/resume";
import { Metabox, SectionTools } from "../components/Metabox";
import { Field, StringList, TextArea, TextInput } from "../fields";
import { goodreadsHint, move, pianoMusicHint, type Screen } from "../types";

interface SiteScreenProps {
  data: ContentData;
  setData: (data: ContentData) => void;
  sectionState: Record<string, boolean>;
  expandAll: (ids: string[]) => void;
  collapseAll: (ids: string[]) => void;
  go: (screen: Screen) => void;
  uploadResume: (file: File) => Promise<void>;
  uploading: boolean;
  save: () => Promise<void>;
  dirty: boolean;
}

export function SiteScreen({
  data,
  setData,
  sectionState,
  expandAll,
  collapseAll,
  go,
  uploadResume,
  uploading,
  save,
  dirty,
}: SiteScreenProps) {
  const site = data.site;

  return (
    <>
      <h1 className="wp-screen-title">General Settings</h1>
      <p className="wp-sub">These fields appear on the public portfolio.</p>
      <SectionTools
        onExpandAll={() =>
          expandAll(["site_identity", "site_hero", "site_about", "site_stats", "site_contact"])
        }
        onCollapseAll={() =>
          collapseAll(["site_identity", "site_hero", "site_about", "site_stats", "site_contact"])
        }
      />
      <Metabox id="site_identity" title="Identity" isOpen={sectionState["site_identity"]}>
        <table className="wp-form-table">
          <tbody>
            <Field label="Site title">
              <TextInput value={site.name} onChange={(name) => setData({ ...data, site: { ...site, name } })} />
            </Field>
            <Field label="Initials">
              <TextInput
                value={site.initials}
                onChange={(initials) => setData({ ...data, site: { ...site, initials } })}
              />
            </Field>
            <Field label="Browser title">
              <TextInput value={site.title} onChange={(title) => setData({ ...data, site: { ...site, title } })} />
            </Field>
            <Field label="Tagline" wide>
              <TextArea
                value={site.description}
                onChange={(description) => setData({ ...data, site: { ...site, description } })}
                rows={3}
              />
            </Field>
          </tbody>
        </table>
      </Metabox>

      <Metabox
        id="site_hero"
        title="Hero"
        badge={HERO_TEMPLATES.find((t) => t.id === site.heroTemplate)?.name}
        isOpen={sectionState["site_hero"]}
      >
        <p style={{ margin: "0 0 12px" }}>
          Live template: <strong>{HERO_TEMPLATES.find((t) => t.id === site.heroTemplate)?.name}</strong>
          {" · "}
          <button type="button" className="wp-add" onClick={() => go("hero")}>
            Change layout
          </button>
        </p>
        <table className="wp-form-table">
          <tbody>
            <Field label="Kicker">
              <TextInput value={site.kicker} onChange={(kicker) => setData({ ...data, site: { ...site, kicker } })} />
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
              <TextArea value={site.line} onChange={(line) => setData({ ...data, site: { ...site, line } })} rows={3} />
            </Field>
            <Field
              label="Piano Music YouTube URL"
              wide
              hint={pianoMusicHint(site.pianoYoutubeUrl ?? "")}
            >
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

      <Metabox id="site_about" title="About" isOpen={sectionState["site_about"]}>
        <table className="wp-form-table">
          <tbody>
            <Field label="About" wide>
              <TextArea value={site.about} onChange={(about) => setData({ ...data, site: { ...site, about } })} rows={6} />
            </Field>
            <Field label="Philosophy kicker">
              <TextInput
                value={site.philosophyKicker}
                onChange={(philosophyKicker) => setData({ ...data, site: { ...site, philosophyKicker } })}
              />
            </Field>
            <Field label="Philosophy title">
              <TextInput
                value={site.philosophyTitle}
                onChange={(philosophyTitle) => setData({ ...data, site: { ...site, philosophyTitle } })}
              />
            </Field>
            <Field label="Philosophy" wide>
              <TextArea
                value={site.philosophy}
                onChange={(philosophy) => setData({ ...data, site: { ...site, philosophy } })}
                rows={4}
              />
            </Field>
            <Field label="Experience intro" wide>
              <TextArea
                value={site.experienceIntro}
                onChange={(experienceIntro) => setData({ ...data, site: { ...site, experienceIntro } })}
                rows={3}
              />
            </Field>
          </tbody>
        </table>
      </Metabox>

      <Metabox
        id="site_stats"
        title="Stats"
        badge={`${site.stats.length} ${site.stats.length === 1 ? "stat" : "stats"}`}
        isOpen={sectionState["site_stats"]}
      >
        {site.stats.map((stat, i) => (
          <div key={i} className="row" style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input
              type="number"
              min={0}
              value={stat.value}
              className="wp-input wp-input-small"
              onChange={(e) => {
                const stats = [...site.stats];
                stats[i] = { ...stat, value: Number(e.target.value) };
                setData({ ...data, site: { ...site, stats } });
              }}
            />
            <TextInput
              value={stat.suffix}
              placeholder="+"
              small
              onChange={(suffix) => {
                const stats = [...site.stats];
                stats[i] = { ...stat, suffix };
                setData({ ...data, site: { ...site, stats } });
              }}
            />
            <TextInput
              value={stat.label}
              onChange={(label) => {
                const stats = [...site.stats];
                stats[i] = { ...stat, label };
                setData({ ...data, site: { ...site, stats } });
              }}
            />
            <button
              type="button"
              className="wp-btn"
              disabled={i === 0}
              title="Move stat up"
              aria-label="Move stat up"
              onClick={() => {
                const stats = move(site.stats, i, -1);
                setData({ ...data, site: { ...site, stats } });
              }}
              style={{ padding: "0 8px" }}
            >
              ↑
            </button>
            <button
              type="button"
              className="wp-btn"
              disabled={i === site.stats.length - 1}
              title="Move stat down"
              aria-label="Move stat down"
              onClick={() => {
                const stats = move(site.stats, i, 1);
                setData({ ...data, site: { ...site, stats } });
              }}
              style={{ padding: "0 8px" }}
            >
              ↓
            </button>
            <button
              type="button"
              className="wp-btn"
              onClick={() =>
                setData({ ...data, site: { ...site, stats: site.stats.filter((_, j) => j !== i) } })
              }
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className="wp-add"
          onClick={() =>
            setData({
              ...data,
              site: { ...site, stats: [...site.stats, { value: 0, suffix: "+", label: "New stat" }] },
            })
          }
        >
          + Add stat
        </button>
      </Metabox>

      <Metabox id="site_contact" title="Contact" isOpen={sectionState["site_contact"]}>
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
              <TextInput value={site.github} onChange={(github) => setData({ ...data, site: { ...site, github } })} />
            </Field>
          </tbody>
        </table>
      </Metabox>

      <p>
        <button type="button" className="wp-btn wp-btn-primary wp-btn-large" onClick={() => void save()} disabled={!dirty}>
          Save Changes
        </button>
      </p>
    </>
  );
}
