"use client";

import type { ContentData, ExperienceItem } from "@/content/types";
import { Metabox } from "../components/Metabox";
import { Field, StringList, TextArea, TextInput } from "../fields";
import { move, type Screen } from "../types";

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
    <>
      <h1 className="wp-screen-title">{job.role === "New role" ? "Add New Experience" : "Edit Experience"}</h1>
      <div className="wp-edit">
        <div>
          <input
            className="wp-title-input"
            value={job.role}
            placeholder="Enter title here"
            onChange={(e) => {
              const experience = [...data.experience];
              experience[expIndex] = { ...job, role: e.target.value };
              setData({ ...data, experience });
            }}
          />
          <Metabox id="exp_details" title="Role details" badge={job.company || undefined}>
            <table className="wp-form-table">
              <tbody>
                <Field label="Company">
                  <TextInput
                    value={job.company}
                    onChange={(company) => {
                      const experience = [...data.experience];
                      experience[expIndex] = { ...job, company };
                      setData({ ...data, experience });
                    }}
                  />
                </Field>
                <Field label="When">
                  <TextInput
                    value={job.when}
                    onChange={(when) => {
                      const experience = [...data.experience];
                      experience[expIndex] = { ...job, when };
                      setData({ ...data, experience });
                    }}
                  />
                </Field>
                <Field label="Summary" wide>
                  <TextArea
                    value={job.summary}
                    onChange={(summary) => {
                      const experience = [...data.experience];
                      experience[expIndex] = { ...job, summary };
                      setData({ ...data, experience });
                    }}
                  />
                </Field>
                <Field label="Bullets" wide>
                  <StringList
                    values={job.bullets}
                    onChange={(bullets) => {
                      const experience = [...data.experience];
                      experience[expIndex] = { ...job, bullets };
                      setData({ ...data, experience });
                    }}
                    addLabel="Add bullet"
                  />
                </Field>
                <Field label="Tags" wide>
                  <StringList
                    values={job.stack}
                    onChange={(stack) => {
                      const experience = [...data.experience];
                      experience[expIndex] = { ...job, stack };
                      setData({ ...data, experience });
                    }}
                    addLabel="Add tag"
                  />
                </Field>
              </tbody>
            </table>
          </Metabox>
        </div>
        <Metabox id="exp_publish" title="Publish" badge={job.current ? "Current" : "Past"}>
          <div className="wp-publish-misc">
            <p>
              Status:{" "}
              <strong>{job.current ? "Current" : "Past"}</strong>
            </p>
            <label className="wp-check">
              <input
                type="checkbox"
                checked={job.current}
                onChange={(e) => {
                  const experience = [...data.experience];
                  experience[expIndex] = { ...job, current: e.target.checked };
                  setData({ ...data, experience });
                }}
              />
              Current role
            </label>
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
