"use client";

// External dependencies
import { useState } from "react";

// Application services & types
import type { ContentData, ProjectItem } from "@/content/types";
import { generateProjectCopy } from "@/lib/cms-client";
import { move, type Screen } from "../types";

// UI components
import { AiFormSection, AiGeneratePanel } from "../components/AiGeneratePanel";
import { Metabox } from "../components/Metabox";
import { Field, StringList, TextArea, TextInput } from "../fields";

/**
 * Renders the projects list table.
 * @example <ProjectsListScreen data={data} go={go} addProject={…} />
 */
export function ProjectsListScreen({
  data,
  setData,
  go,
  addProject,
}: {
  data: ContentData;
  setData: (data: ContentData) => void;
  go: (screen: Screen, id?: string | null) => void;
  addProject: () => void;
}) {
  return (
    <>
      <h1 className="wp-screen-title">
        Projects
        <button type="button" className="wp-btn wp-btn-primary" onClick={addProject}>
          Add New
        </button>
      </h1>
      <table className="wp-list-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Tags</th>
            <th>Demo</th>
          </tr>
        </thead>
        <tbody>
          {data.projects.map((item, i) => (
            <tr key={item.id}>
              <td>
                <button type="button" className="row-title" onClick={() => go("projects-edit", item.id)}>
                  {item.name || "(no title)"}
                </button>
                <div className="wp-row-actions">
                  <button type="button" onClick={() => go("projects-edit", item.id)}>
                    Edit
                  </button>
                  {" | "}
                  <button
                    type="button"
                    onClick={() => setData({ ...data, projects: move(data.projects, i, -1) })}
                    disabled={i === 0}
                  >
                    Up
                  </button>
                  {" | "}
                  <button
                    type="button"
                    onClick={() => setData({ ...data, projects: move(data.projects, i, 1) })}
                    disabled={i === data.projects.length - 1}
                  >
                    Down
                  </button>
                  {" | "}
                  {item.github ? (
                    <>
                      <a href={item.github} target="_blank" rel="noreferrer">
                        GitHub
                      </a>
                      {" | "}
                    </>
                  ) : null}
                  <button
                    type="button"
                    className="trash"
                    onClick={() => setData({ ...data, projects: data.projects.filter((_, j) => j !== i) })}
                  >
                    Trash
                  </button>
                </div>
              </td>
              <td>{item.tags.join(", ")}</td>
              <td>{item.demo ? "Live" : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

/**
 * Renders the project editor wrapper.
 * @example <ProjectsEditScreen project={project} projIndex={0} … />
 */
export function ProjectsEditScreen({
  data,
  setData,
  project,
  projIndex,
  go,
  save,
  dirty,
}: {
  data: ContentData;
  setData: (data: ContentData) => void;
  project: ProjectItem;
  projIndex: number;
  go: (screen: Screen) => void;
  save: () => Promise<void>;
  dirty: boolean;
}) {
  return (
    <ProjectsEditForm
      key={project.id}
      data={data}
      setData={setData}
      project={project}
      projIndex={projIndex}
      go={go}
      save={save}
      dirty={dirty}
    />
  );
}

/**
 * Renders project fields and AI blurb/tags assist.
 * @example <ProjectsEditForm project={project} projIndex={0} … />
 */
function ProjectsEditForm({
  data,
  setData,
  project,
  projIndex,
  go,
  save,
  dirty,
}: {
  data: ContentData;
  setData: (data: ContentData) => void;
  project: ProjectItem;
  projIndex: number;
  go: (screen: Screen) => void;
  save: () => Promise<void>;
  dirty: boolean;
}) {
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  /**
   * Merges a patch into the active project.
   * @example patchProject({ name: "Portfolio" }) // void
   */
  function patchProject(patch: Partial<ProjectItem>) {
    const projects = [...data.projects];
    projects[projIndex] = { ...project, ...patch };
    setData({ ...data, projects });
  }

  /**
   * Generates project blurb and tags via AI.
   * @example onGenerate() // void
   */
  async function onGenerate() {
    if (generating) return;
    setGenerateError(null);
    if (!project.github.trim() && !project.demo.trim()) {
      setGenerateError("Enter a GitHub URL or Live demo URL first.");
      return;
    }
    setGenerating(true);
    const result = await generateProjectCopy({
      name: project.name,
      github: project.github,
      demo: project.demo,
      existingBlurb: project.blurb,
      existingTags: project.tags,
    });
    setGenerating(false);
    if (!result.ok) {
      setGenerateError(result.error);
      return;
    }
    patchProject({
      blurb: result.data.blurb,
      tags: result.data.tags,
    });
  }

  const hasGithub = Boolean(project.github.trim());
  const hasDemo = Boolean(project.demo.trim());
  const hasTitle = Boolean(project.name.trim()) && project.name.trim() !== "New project";
  const hasDraft = Boolean(project.blurb.trim()) || project.tags.length > 0;
  const demoHref = hasDemo
    ? /^https?:\/\//i.test(project.demo)
      ? project.demo
      : `https://${project.demo}`
    : "";

  return (
    <>
      <h1 className="wp-screen-title">{project.name === "New project" ? "Add New Project" : "Edit Project"}</h1>
      <div className="wp-edit">
        <div>
          <input
            className="wp-title-input"
            value={project.name}
            placeholder="Enter title here"
            onChange={(e) => patchProject({ name: e.target.value })}
          />
          <Metabox
            id="proj_details"
            title="Project"
            badge={project.tags.length ? `${project.tags.length} ${project.tags.length === 1 ? "tag" : "tags"}` : undefined}
          >
            <div className="wp-ai-stack">
              <AiFormSection
                step={1}
                title="Sources for AI"
                description="Add at least one URL. We fetch GitHub metadata/README and live-page title & meta."
              >
                <table className="wp-form-table">
                  <tbody>
                    <Field
                      label="GitHub URL"
                      hint="Repo description, topics, language, and README."
                    >
                      <TextInput
                        value={project.github}
                        onChange={(github) => patchProject({ github })}
                        placeholder="https://github.com/you/repo"
                      />
                    </Field>
                    <Field
                      label="Live demo"
                      hint="Page title and meta description when available."
                    >
                      <TextInput
                        value={project.demo}
                        onChange={(demo) => patchProject({ demo })}
                        placeholder="https://your-demo.app"
                      />
                    </Field>
                  </tbody>
                </table>
              </AiFormSection>

              <AiGeneratePanel
                basisItems={[
                  { label: "Project title", ready: hasTitle, optional: true },
                  { label: "GitHub repo", ready: hasGithub, optional: hasDemo },
                  { label: "Live demo", ready: hasDemo, optional: hasGithub },
                  { label: "Existing draft", ready: hasDraft, optional: true },
                ]}
                fills="Description and Tags"
                generating={generating}
                error={generateError}
                onGenerate={() => void onGenerate()}
              />

              <AiFormSection
                step={2}
                title="Generated copy"
                description="Polish the blurb and tags before you hit Update."
                tone="output"
              >
                <table className="wp-form-table">
                  <tbody>
                    <Field label="Description" wide>
                      <TextArea
                        value={project.blurb}
                        onChange={(blurb) => patchProject({ blurb })}
                        rows={5}
                      />
                    </Field>
                    <Field label="Tags" wide>
                      <StringList
                        values={project.tags}
                        onChange={(tags) => patchProject({ tags })}
                        addLabel="Add tag"
                      />
                    </Field>
                  </tbody>
                </table>
              </AiFormSection>
            </div>
          </Metabox>
        </div>
        <Metabox id="proj_publish" title="Publish" badge={project.demo ? "Live Demo" : "No Demo"}>
          <div className="wp-publish-misc">
            <p>
              Demo: <strong>{project.demo ? "Live" : "None"}</strong>
            </p>
            {hasGithub || hasDemo ? (
              <div className="wp-publish-links">
                {hasGithub ? (
                  <a href={project.github} target="_blank" rel="noreferrer">
                    Open GitHub
                  </a>
                ) : null}
                {hasDemo ? (
                  <a href={demoHref} target="_blank" rel="noreferrer">
                    Open live demo
                  </a>
                ) : null}
              </div>
            ) : (
              <p className="wp-publish-muted">Add GitHub or a live URL to link them here.</p>
            )}
          </div>
          <div className="wp-publish-actions">
            <button
              type="button"
              className="wp-btn-link"
              onClick={() => {
                setData({ ...data, projects: data.projects.filter((p) => p.id !== project.id) });
                go("projects");
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
