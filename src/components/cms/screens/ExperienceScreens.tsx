"use client";

// External dependencies
import { useState } from "react";

// Application services & types
import type { ContentData, ExperienceItem } from "@/content/types";
import { generateExperienceCopy } from "@/lib/cms-client";
import { move, type Screen } from "../types";

// UI components
import { AiFormSection, AiGeneratePanel } from "../components/AiGeneratePanel";
import { Metabox } from "../components/Metabox";
import { Field, TextArea, TextInput } from "../fields";

/**
 * Splits bullet/tag textarea lines into a list.
 * @example linesToList("a\nb") // ["a","b"]
 */
function linesToList(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-•*]\s+/, "").trim())
    .filter(Boolean);
}

/**
 * Joins a list into newline-separated textarea text.
 * @example listToLines(["a","b"]) // "a\nb"
 */
function listToLines(values: string[]): string {
  return values.join("\n");
}

/**
 * Renders the experience list table.
 * @example <ExperienceListScreen data={data} go={go} addExperience={…} />
 */
export function ExperienceListScreen({
  data,
  setData,
  go,
  addExperience,
}: {
  data: ContentData;
  setData: (data: ContentData) => void;
  go: (screen: Screen, id?: string | null) => void;
  addExperience: () => void;
}) {
  return (
    <>
      <h1 className="wp-screen-title">
        Experience
        <button type="button" className="wp-btn wp-btn-primary" onClick={addExperience}>
          Add New
        </button>
      </h1>
      <table className="wp-list-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Company</th>
            <th>Status</th>
            <th>When</th>
          </tr>
        </thead>
        <tbody>
          {data.experience.map((item, i) => (
            <tr key={item.id}>
              <td>
                <button type="button" className="row-title" onClick={() => go("experience-edit", item.id)}>
                  {item.role || "(no title)"}
                </button>
                <div className="wp-row-actions">
                  <button type="button" onClick={() => go("experience-edit", item.id)}>
                    Edit
                  </button>
                  {" | "}
                  <button
                    type="button"
                    onClick={() => setData({ ...data, experience: move(data.experience, i, -1) })}
                    disabled={i === 0}
                  >
                    Up
                  </button>
                  {" | "}
                  <button
                    type="button"
                    onClick={() => setData({ ...data, experience: move(data.experience, i, 1) })}
                    disabled={i === data.experience.length - 1}
                  >
                    Down
                  </button>
                  {" | "}
                  <button
                    type="button"
                    className="trash"
                    onClick={() =>
                      setData({ ...data, experience: data.experience.filter((_, j) => j !== i) })
                    }
                  >
                    Trash
                  </button>
                </div>
              </td>
              <td>{item.company}</td>
              <td>
                <span className={`wp-status${item.current ? " is-publish" : ""}`}>
                  {item.current ? "Current" : "Past"}
                </span>
              </td>
              <td>{item.when}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

/**
 * Renders the experience editor wrapper.
 * @example <ExperienceEditScreen job={job} expIndex={0} … />
 */
export function ExperienceEditScreen({
  data,
  setData,
  job,
  expIndex,
  go,
  save,
  dirty,
}: {
  data: ContentData;
  setData: (data: ContentData) => void;
  job: ExperienceItem;
  expIndex: number;
  go: (screen: Screen) => void;
  save: () => Promise<void>;
  dirty: boolean;
}) {
  return (
    <ExperienceEditForm
      key={job.id}
      data={data}
      setData={setData}
      job={job}
      expIndex={expIndex}
      go={go}
      save={save}
      dirty={dirty}
    />
  );
}

/**
 * Renders experience fields and AI copy assist.
 * @example <ExperienceEditForm job={job} expIndex={0} … />
 */
function ExperienceEditForm({
  data,
  setData,
  job,
  expIndex,
  go,
  save,
  dirty,
}: {
  data: ContentData;
  setData: (data: ContentData) => void;
  job: ExperienceItem;
  expIndex: number;
  go: (screen: Screen) => void;
  save: () => Promise<void>;
  dirty: boolean;
}) {
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [bulletsText, setBulletsText] = useState(() => listToLines(job.bullets));
  const [tagsText, setTagsText] = useState(() => listToLines(job.stack));

  /**
   * Merges a patch into the active experience item.
   * @example patchJob({ role: "Engineer" }) // void
   */
  function patchJob(patch: Partial<ExperienceItem>) {
    const experience = [...data.experience];
    experience[expIndex] = { ...job, ...patch };
    setData({ ...data, experience });
  }

  /**
   * Generates experience summary/bullets/stack via AI.
   * @example onGenerate() // void
   */
  async function onGenerate() {
    if (generating) return;
    setGenerateError(null);
    if (!job.role.trim() && !job.company.trim()) {
      setGenerateError("Enter a role or company first.");
      return;
    }
    setGenerating(true);
    const result = await generateExperienceCopy({
      role: job.role,
      company: job.company,
      when: job.when,
      current: job.current,
      existingSummary: job.summary,
      existingBullets: linesToList(bulletsText),
      existingTags: linesToList(tagsText),
      linkedin: data.site.linkedin,
      resume: data.site.resume,
    });
    setGenerating(false);
    if (!result.ok) {
      setGenerateError(result.error);
      return;
    }
    setBulletsText(listToLines(result.data.bullets));
    setTagsText(listToLines(result.data.tags));
    patchJob({
      summary: result.data.summary,
      bullets: result.data.bullets,
      stack: result.data.tags,
    });
  }

  const hasRole = Boolean(job.role.trim()) && job.role.trim() !== "New role";
  const hasCompany = Boolean(job.company.trim());
  const hasDraft =
    Boolean(job.summary.trim()) ||
    linesToList(bulletsText).length > 0 ||
    linesToList(tagsText).length > 0;
  const hasLinkedIn = Boolean(data.site.linkedin?.trim());
  const hasResume = Boolean(data.site.resume?.trim());

  return (
    <>
      <h1 className="wp-screen-title">{job.role === "New role" ? "Add New Experience" : "Edit Experience"}</h1>
      <div className="wp-edit">
        <div>
          <input
            className="wp-title-input"
            value={job.role}
            placeholder="Enter title here"
            onChange={(e) => patchJob({ role: e.target.value })}
          />
          <Metabox id="exp_details" title="Role details" badge={job.company || undefined}>
            <div className="wp-ai-stack">
              <AiFormSection
                step={1}
                title="Sources for AI"
                description="Fill role details first. Generation also reads your LinkedIn + resume from Contact."
              >
                <table className="wp-form-table">
                  <tbody>
                    <Field label="Company" hint="Employer / org context for the copy.">
                      <TextInput value={job.company} onChange={(company) => patchJob({ company })} />
                    </Field>
                    <Field label="When" hint="Date range shapes past vs current tone.">
                      <TextInput value={job.when} onChange={(when) => patchJob({ when })} />
                    </Field>
                  </tbody>
                </table>
                <ul className="wp-ai-source-summary" style={{ marginTop: 8 }}>
                  <li>
                    <strong>LinkedIn</strong>
                    <span>{hasLinkedIn ? data.site.linkedin : "Not set — add in Contact"}</span>
                  </li>
                  <li>
                    <strong>Resume</strong>
                    <span>{hasResume ? data.site.resume : "Not set — upload in Contact"}</span>
                  </li>
                </ul>
              </AiFormSection>

              <AiGeneratePanel
                basisItems={[
                  { label: "Role title", ready: hasRole, optional: hasCompany },
                  { label: "Company", ready: hasCompany, optional: hasRole },
                  { label: "When", ready: Boolean(job.when.trim()), optional: true },
                  { label: "LinkedIn", ready: hasLinkedIn, optional: true },
                  { label: "Resume", ready: hasResume, optional: true },
                  { label: "Existing draft", ready: hasDraft, optional: true },
                ]}
                fills="Summary, Bullets, and Tags"
                generating={generating}
                error={generateError}
                onGenerate={() => void onGenerate()}
              />

              <AiFormSection
                step={2}
                title="Generated copy"
                description="Review and tweak anything before publishing."
                tone="output"
              >
                <table className="wp-form-table">
                  <tbody>
                    <Field label="Summary" wide>
                      <TextArea value={job.summary} onChange={(summary) => patchJob({ summary })} />
                    </Field>
                    <Field label="Bullets" wide hint="One bullet per line.">
                      <TextArea
                        value={bulletsText}
                        rows={6}
                        placeholder={"One achievement per line\nAnother bullet…"}
                        onChange={(text) => {
                          setBulletsText(text);
                          patchJob({ bullets: linesToList(text) });
                        }}
                      />
                    </Field>
                    <Field label="Tags" wide hint="One tag per line.">
                      <TextArea
                        value={tagsText}
                        rows={4}
                        placeholder={"Discovery\nReact\nProduct"}
                        onChange={(text) => {
                          setTagsText(text);
                          patchJob({ stack: linesToList(text) });
                        }}
                      />
                    </Field>
                  </tbody>
                </table>
              </AiFormSection>
            </div>
          </Metabox>
        </div>
        <Metabox id="exp_publish" title="Publish" badge={job.current ? "Current" : "Past"}>
          <div className="wp-publish-misc">
            <p>
              Status: <strong>{job.current ? "Current" : "Past"}</strong>
            </p>
            <label className="wp-check">
              <input
                type="checkbox"
                checked={job.current}
                onChange={(e) => patchJob({ current: e.target.checked })}
              />
              Current role
            </label>
            <p className="wp-publish-muted">This flag is included when generating copy.</p>
          </div>
          <div className="wp-publish-actions">
            <button
              type="button"
              className="wp-btn-link"
              onClick={() => {
                setData({ ...data, experience: data.experience.filter((j) => j.id !== job.id) });
                go("experience");
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
