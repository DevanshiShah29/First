"use client";

// External dependencies
import { useMemo, useState } from "react";

// Application services & types
import type { ContentData } from "@/content/types";
import { generateAboutCopy, type AboutCopyVariant } from "@/lib/cms-client";
import { move } from "../types";

// UI components
import { AiFormSection, AiGeneratePanel } from "../components/AiGeneratePanel";
import { AiVariantPicker } from "../components/AiVariantPicker";
import { CmsSaveButton, type CmsSaveStatus } from "../components/CmsSaveButton";
import { Metabox } from "../components/Metabox";
import { EditorTabs } from "../preview/EditorTabs";
import { LivePreviewShell } from "../preview/LivePreviewShell";
import { Field, TextArea, TextInput } from "../fields";

interface AboutScreenProps {
  data: ContentData;
  setData: (data: ContentData) => void;
  save: () => Promise<void>;
  dirty: boolean;
  status: CmsSaveStatus;
}

/**
 * Renders About section editors with AI variants.
 * @example <AboutScreen data={data} setData={setData} save={save} … />
 */
export function AboutScreen({
  data,
  setData,
  save,
  dirty,
  status,
}: AboutScreenProps) {
  const site = data.site;
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [variants, setVariants] = useState<AboutCopyVariant[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const experienceSummaries = useMemo(
    () =>
      data.experience
        .map((job) => job.summary)
        .filter((summary): summary is string => Boolean(summary?.trim())),
    [data.experience],
  );

  const hasAbout = Boolean(site.about.trim());
  const hasPhilosophy = Boolean(
    site.philosophy.trim() || site.philosophyTitle.trim() || site.philosophyKicker.trim(),
  );
  const hasExperienceIntro = Boolean(site.experienceIntro.trim());
  const hasLinkedIn = Boolean(site.linkedin?.trim());
  const hasResume = Boolean(site.resume?.trim());
  const hasDraft = hasAbout || hasPhilosophy || hasExperienceIntro;

  /**
   * Requests 2–3 About packages from draft + profile signals.
   * @example void onGenerate() // Promise
   */
  async function onGenerate() {
    if (generating) return;
    setGenerateError(null);
    if (!hasDraft && !hasLinkedIn && !hasResume && experienceSummaries.length === 0) {
      setGenerateError("Add About draft text, LinkedIn/resume, or experience summaries first.");
      return;
    }
    setGenerating(true);
    const result = await generateAboutCopy({
      about: site.about,
      philosophyKicker: site.philosophyKicker,
      philosophyTitle: site.philosophyTitle,
      philosophy: site.philosophy,
      experienceIntro: site.experienceIntro,
      experienceSummaries,
      linkedin: site.linkedin,
      resume: site.resume,
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
   * Applies mixed About fields from chosen option indexes.
   * @example applySelected({ about: 0, experienceIntro: 1 }) // void
   */
  function applySelected(fieldSources: Record<string, number>) {
    const pick = (key: string): AboutCopyVariant | undefined =>
      variants[fieldSources[key] ?? selectedIndex];
    const about = pick("about");
    const philosophy = pick("philosophy");
    const experienceIntro = pick("experienceIntro");
    if (!about && !philosophy && !experienceIntro) return;
    setData({
      ...data,
      site: {
        ...site,
        about: about?.about ?? site.about,
        philosophyKicker: philosophy?.philosophyKicker ?? site.philosophyKicker,
        philosophyTitle: philosophy?.philosophyTitle ?? site.philosophyTitle,
        philosophy: philosophy?.philosophy ?? site.philosophy,
        experienceIntro: experienceIntro?.experienceIntro ?? site.experienceIntro,
      },
    });
    setVariants([]);
    setSelectedIndex(0);
  }

  return (
    <>
      <h1 className="wp-screen-title">About</h1>
      <p className="wp-sub">Bio, philosophy, experience intro, and homepage stats.</p>
      <EditorTabs
        preview={<LivePreviewShell data={data} dirty={dirty} section="about" />}
      >

      <Metabox id="about_copy" title="About">
        <div className="wp-ai-stack">
          <AiFormSection
            step={1}
            title="Sources for AI"
            description="Uses your About draft plus LinkedIn/resume from Contact and Experience summaries."
          >
            <ul className="wp-ai-source-summary">
              <li>
                <strong>About draft</strong>
                <span>{hasAbout ? "Present" : "Empty"}</span>
              </li>
              <li>
                <strong>Philosophy draft</strong>
                <span>{hasPhilosophy ? "Present" : "Empty"}</span>
              </li>
              <li>
                <strong>LinkedIn</strong>
                <span>{hasLinkedIn ? site.linkedin : "Not set — add in Contact"}</span>
              </li>
              <li>
                <strong>Resume</strong>
                <span>{hasResume ? site.resume : "Not set — upload in Contact"}</span>
              </li>
              <li>
                <strong>Experience summaries</strong>
                <span>
                  {experienceSummaries.length
                    ? `${experienceSummaries.length} role summar${experienceSummaries.length === 1 ? "y" : "ies"}`
                    : "None yet"}
                </span>
              </li>
            </ul>
          </AiFormSection>

          <AiGeneratePanel
            basisItems={[
              { label: "About draft", ready: hasAbout, optional: true },
              { label: "Philosophy draft", ready: hasPhilosophy, optional: true },
              { label: "LinkedIn", ready: hasLinkedIn, optional: true },
              { label: "Resume", ready: hasResume, optional: true },
              {
                label: "Experience summaries",
                ready: experienceSummaries.length > 0,
                optional: hasDraft || hasLinkedIn || hasResume,
              },
            ]}
            fills="About, Philosophy, and Experience intro"
            generating={generating}
            error={generateError}
            onGenerate={() => void onGenerate()}
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
                    key: "about",
                    label: "About",
                    render: (variant) => variant.about,
                  },
                  {
                    key: "philosophy",
                    label: "Philosophy",
                    render: (variant) => (
                      <>
                        <em>
                          {variant.philosophyKicker} — {variant.philosophyTitle}
                        </em>
                        <br />
                        {variant.philosophy}
                      </>
                    ),
                  },
                  {
                    key: "experienceIntro",
                    label: "Experience intro",
                    render: (variant) => variant.experienceIntro || "—",
                  },
                ]}
              />
            </AiFormSection>
          ) : null}

          <AiFormSection
            step={variants.length > 0 ? 3 : 2}
            title="About fields"
            description="Stats stay manual. Edit freely after applying."
            tone="output"
          >
            <table className="wp-form-table">
              <tbody>
                <Field label="About" wide>
                  <TextArea
                    value={site.about}
                    onChange={(about) => setData({ ...data, site: { ...site, about } })}
                    rows={6}
                  />
                </Field>
                <Field label="Philosophy kicker">
                  <TextInput
                    value={site.philosophyKicker}
                    onChange={(philosophyKicker) =>
                      setData({ ...data, site: { ...site, philosophyKicker } })
                    }
                  />
                </Field>
                <Field label="Philosophy title">
                  <TextInput
                    value={site.philosophyTitle}
                    onChange={(philosophyTitle) =>
                      setData({ ...data, site: { ...site, philosophyTitle } })
                    }
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
                    onChange={(experienceIntro) =>
                      setData({ ...data, site: { ...site, experienceIntro } })
                    }
                    rows={3}
                  />
                </Field>
              </tbody>
            </table>
          </AiFormSection>
        </div>
      </Metabox>

      <Metabox
        id="about_stats"
        title="Stats"
        badge={`${site.stats.length} ${site.stats.length === 1 ? "stat" : "stats"}`}
      >
        {site.stats.map((stat, i) => (
          <div
            key={i}
            className="row"
            style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}
          >
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

      <p>
        <CmsSaveButton save={save} dirty={dirty} status={status} />
      </p>
      </EditorTabs>
    </>
  );
}
