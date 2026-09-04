"use client";

import type { ContentData, ProjectItem } from "@/content/types";
import { Metabox } from "../components/Metabox";
import { Field, StringList, TextArea, TextInput } from "../fields";
import { move, type Screen } from "../types";

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
    <>
      <h1 className="wp-screen-title">{project.name === "New project" ? "Add New Project" : "Edit Project"}</h1>
      <div className="wp-edit">
        <div>
          <input
            className="wp-title-input"
            value={project.name}
            placeholder="Enter title here"
            onChange={(e) => {
              const projects = [...data.projects];
              projects[projIndex] = { ...project, name: e.target.value };
              setData({ ...data, projects });
            }}
          />
          <Metabox
            id="proj_details"
            title="Project"
            badge={project.tags.length ? `${project.tags.length} ${project.tags.length === 1 ? "tag" : "tags"}` : undefined}
          >
            <table className="wp-form-table">
              <tbody>
                <Field label="Description" wide>
                  <TextArea
                    value={project.blurb}
                    onChange={(blurb) => {
                      const projects = [...data.projects];
                      projects[projIndex] = { ...project, blurb };
                      setData({ ...data, projects });
                    }}
                    rows={5}
                  />
                </Field>
                <Field label="GitHub URL">
                  <TextInput
                    value={project.github}
                    onChange={(github) => {
                      const projects = [...data.projects];
                      projects[projIndex] = { ...project, github };
                      setData({ ...data, projects });
                    }}
                  />
                </Field>
                <Field label="Live demo">
                  <TextInput
                    value={project.demo}
                    onChange={(demo) => {
                      const projects = [...data.projects];
                      projects[projIndex] = { ...project, demo };
                      setData({ ...data, projects });
                    }}
                  />
                </Field>
                <Field label="Tags" wide>
                  <StringList
                    values={project.tags}
                    onChange={(tags) => {
                      const projects = [...data.projects];
                      projects[projIndex] = { ...project, tags };
                      setData({ ...data, projects });
                    }}
                    addLabel="Add tag"
                  />
                </Field>
              </tbody>
            </table>
          </Metabox>
        </div>
        <Metabox id="proj_publish" title="Publish" badge={project.demo ? "Live Demo" : "No Demo"}>
          <div className="wp-publish-misc">
            <p>
              Demo: <strong>{project.demo ? "Live" : "None"}</strong>
            </p>
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
