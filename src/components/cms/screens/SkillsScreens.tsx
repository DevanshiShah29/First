"use client";

import { useMemo, useState } from "react";
import type { ContentData, SkillGroup, SkillItem } from "@/content/types";
import { generateSkillsCopy, generateTechnologiesCopy } from "@/lib/api-client";
import { AiFormSection, AiGeneratePanel } from "../components/AiGeneratePanel";
import { Metabox, SectionTools } from "../components/Metabox";
import { Field, TextInput } from "../fields";
import { SkillItemRow } from "../SkillItemRow";
import { move } from "../types";

interface SkillGroupsScreenProps {
  kind: "skills" | "technologies";
  title: string;
  noun: "skill" | "technology";
  data: ContentData;
  setData: (data: ContentData) => void;
  sectionState: Record<string, boolean>;
  expandAll: (ids: string[]) => void;
  collapseAll: (ids: string[]) => void;
  uploadSkillIcon: (file: File, kind: "skills" | "technologies", gi: number, ii: number) => Promise<void>;
  uploading: boolean;
  save: () => Promise<void>;
  dirty: boolean;
}

function collectUnique(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const value = raw.trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function preserveCustomIcons(generated: SkillGroup[], existing: SkillGroup[]): SkillGroup[] {
  const iconByName = new Map<string, string>();
  for (const group of existing) {
    for (const item of group.items) {
      const url = item.iconUrl?.trim();
      if (!url) continue;
      iconByName.set(item.name.trim().toLowerCase(), url);
    }
  }

  return generated.map((group) => ({
    ...group,
    items: group.items.map((item) => {
      const kept = iconByName.get(item.name.trim().toLowerCase());
      if (!kept) return item;
      return { ...item, iconUrl: kept };
    }),
  }));
}

export function SkillGroupsScreen({
  kind,
  title,
  noun,
  data,
  setData,
  sectionState,
  expandAll,
  collapseAll,
  uploadSkillIcon,
  uploading,
  save,
  dirty,
}: SkillGroupsScreenProps) {
  const groups = data[kind] ?? [];
  const prefix = kind === "skills" ? "skill_group" : "tech_group";
  const showAiAssist = kind === "technologies" || kind === "skills";

  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const experienceStacks = useMemo(
    () => collectUnique(data.experience.flatMap((job) => job.stack)),
    [data.experience],
  );
  const experienceSummaries = useMemo(
    () =>
      collectUnique(
        data.experience
          .map((job) => job.summary)
          .filter((summary) => Boolean(summary?.trim())),
      ),
    [data.experience],
  );
  const projectTags = useMemo(
    () => collectUnique(data.projects.flatMap((project) => project.tags)),
    [data.projects],
  );
  const existingItemCount = useMemo(
    () => groups.reduce((n, group) => n + group.items.length, 0),
    [groups],
  );
  const hasLinkedIn = Boolean(data.site.linkedin?.trim());
  const hasResume = Boolean(data.site.resume?.trim());
  const hasProfile = hasLinkedIn || hasResume;

  async function onGenerate() {
    if (generating) return;
    setGenerateError(null);

    if (kind === "technologies") {
      if (
        experienceStacks.length === 0 &&
        projectTags.length === 0 &&
        existingItemCount === 0 &&
        !hasProfile
      ) {
        setGenerateError(
          "Add a LinkedIn URL, resume, experience tags, project tags, or technologies draft first.",
        );
        return;
      }
      setGenerating(true);
      const result = await generateTechnologiesCopy({
        siteTitle: data.site.title || data.site.name,
        siteRoles: data.site.roles ?? [],
        experienceStacks,
        projectTags,
        existingGroups: data.technologies ?? [],
        linkedin: data.site.linkedin,
        resume: data.site.resume,
      });
      setGenerating(false);
      if (!result.ok) {
        setGenerateError(result.error);
        return;
      }
      setData({
        ...data,
        technologies: preserveCustomIcons(result.data.groups, data.technologies ?? []),
      });
      return;
    }

    if (
      experienceStacks.length === 0 &&
      experienceSummaries.length === 0 &&
      existingItemCount === 0 &&
      !hasProfile
    ) {
      setGenerateError("Add a LinkedIn URL, resume, experience copy, or skills draft first.");
      return;
    }
    setGenerating(true);
    const result = await generateSkillsCopy({
      siteTitle: data.site.title || data.site.name,
      siteRoles: data.site.roles ?? [],
      experienceStacks,
      experienceSummaries,
      existingGroups: data.skills ?? [],
      linkedin: data.site.linkedin,
      resume: data.site.resume,
    });
    setGenerating(false);
    if (!result.ok) {
      setGenerateError(result.error);
      return;
    }
    setData({
      ...data,
      skills: preserveCustomIcons(result.data.groups, data.skills ?? []),
    });
  }

  return (
    <>
      <h1 className="wp-screen-title">
        {title}
        <button
          type="button"
          className="wp-btn wp-btn-primary"
          onClick={() =>
            setData({
              ...data,
              [kind]: [...groups, { title: `New ${noun} group`, items: [] }],
            })
          }
        >
          Add New
        </button>
      </h1>

      {showAiAssist ? (
        <div className="wp-ai-stack" style={{ marginBottom: 18 }}>
          <AiFormSection
            step={1}
            title="Sources for AI"
            description={
              kind === "technologies"
                ? "Uses LinkedIn + resume from Contact, plus Experience stacks and Project tags."
                : "Uses LinkedIn + resume from Contact, plus Experience summaries and tags."
            }
          >
            <ul className="wp-ai-source-summary">
              <li>
                <strong>LinkedIn</strong>
                <span>{hasLinkedIn ? data.site.linkedin : "Not set — add in Contact"}</span>
              </li>
              <li>
                <strong>Resume</strong>
                <span>{hasResume ? data.site.resume : "Not set — upload in Contact"}</span>
              </li>
              <li>
                <strong>Experience stacks</strong>
                <span>
                  {experienceStacks.length
                    ? `${experienceStacks.length} tags — ${experienceStacks.slice(0, 8).join(", ")}${experienceStacks.length > 8 ? "…" : ""}`
                    : "None yet"}
                </span>
              </li>
              {kind === "technologies" ? (
                <li>
                  <strong>Project tags</strong>
                  <span>
                    {projectTags.length
                      ? `${projectTags.length} tags — ${projectTags.slice(0, 8).join(", ")}${projectTags.length > 8 ? "…" : ""}`
                      : "None yet"}
                  </span>
                </li>
              ) : (
                <li>
                  <strong>Experience summaries</strong>
                  <span>
                    {experienceSummaries.length
                      ? `${experienceSummaries.length} role summar${experienceSummaries.length === 1 ? "y" : "ies"}`
                      : "None yet"}
                  </span>
                </li>
              )}
              <li>
                <strong>Current {kind}</strong>
                <span>
                  {existingItemCount
                    ? `${existingItemCount} item${existingItemCount === 1 ? "" : "s"} in ${groups.length} group${groups.length === 1 ? "" : "s"}`
                    : "Empty draft"}
                </span>
              </li>
            </ul>
          </AiFormSection>

          <AiGeneratePanel
            basisItems={
              kind === "technologies"
                ? [
                    { label: "LinkedIn", ready: hasLinkedIn, optional: true },
                    { label: "Resume", ready: hasResume, optional: true },
                    {
                      label: "Experience stacks",
                      ready: experienceStacks.length > 0,
                      optional: projectTags.length > 0 || existingItemCount > 0 || hasProfile,
                    },
                    {
                      label: "Project tags",
                      ready: projectTags.length > 0,
                      optional: experienceStacks.length > 0 || existingItemCount > 0 || hasProfile,
                    },
                    { label: "Existing draft", ready: existingItemCount > 0, optional: true },
                  ]
                : [
                    { label: "LinkedIn", ready: hasLinkedIn, optional: true },
                    { label: "Resume", ready: hasResume, optional: true },
                    {
                      label: "Experience copy",
                      ready: experienceStacks.length > 0 || experienceSummaries.length > 0,
                      optional: existingItemCount > 0 || hasProfile,
                    },
                    { label: "Existing draft", ready: existingItemCount > 0, optional: true },
                  ]
            }
            fills={kind === "technologies" ? "Technology groups and items" : "Skill groups and items"}
            generating={generating}
            error={generateError}
            onGenerate={() => void onGenerate()}
          />
        </div>
      ) : null}

      <SectionTools
        onExpandAll={() => expandAll(groups.map((_, gi) => `${prefix}_${gi}`))}
        onCollapseAll={() => collapseAll(groups.map((_, gi) => `${prefix}_${gi}`))}
      />
      {groups.map((group: SkillGroup, gi: number) => (
        <Metabox
          key={`${prefix}_${gi}`}
          id={`${prefix}_${gi}`}
          title={group.title || `${title} group`}
          badge={`${group.items.length} ${group.items.length === 1 ? noun : `${noun}s`}`}
          isOpen={sectionState[`${prefix}_${gi}`]}
          actions={
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <button
                type="button"
                className="wp-btn"
                onClick={() => setData({ ...data, [kind]: move(groups, gi, -1) })}
                disabled={gi === 0}
                title="Move group up"
                aria-label="Move group up"
                style={{ height: 24, lineHeight: "22px", padding: "0 6px", fontSize: 11 }}
              >
                ↑
              </button>
              <button
                type="button"
                className="wp-btn"
                onClick={() => setData({ ...data, [kind]: move(groups, gi, 1) })}
                disabled={gi === groups.length - 1}
                title="Move group down"
                aria-label="Move group down"
                style={{ height: 24, lineHeight: "22px", padding: "0 6px", fontSize: 11 }}
              >
                ↓
              </button>
            </div>
          }
        >
          <table className="wp-form-table">
            <tbody>
              <Field label="Group title">
                <TextInput
                  value={group.title}
                  onChange={(groupTitle) => {
                    const nextGroups = [...groups];
                    nextGroups[gi] = { ...group, title: groupTitle };
                    setData({ ...data, [kind]: nextGroups });
                  }}
                />
              </Field>
            </tbody>
          </table>
          {group.items.map((item, ii) => (
            <SkillItemRow
              key={`${kind}-item-${gi}-${ii}`}
              item={item}
              index={ii}
              total={group.items.length}
              uploading={uploading}
              noun={noun}
              onChange={(next: SkillItem) => {
                const nextGroups = [...groups];
                const items = [...group.items];
                items[ii] = next;
                nextGroups[gi] = { ...group, items };
                setData({ ...data, [kind]: nextGroups });
              }}
              onMove={(dir) => {
                const nextGroups = [...groups];
                nextGroups[gi] = { ...group, items: move(group.items, ii, dir) };
                setData({ ...data, [kind]: nextGroups });
              }}
              onRemove={() => {
                const nextGroups = [...groups];
                nextGroups[gi] = { ...group, items: group.items.filter((_, j) => j !== ii) };
                setData({ ...data, [kind]: nextGroups });
              }}
              onUpload={(file) => void uploadSkillIcon(file, kind, gi, ii)}
            />
          ))}
          <p>
            <button
              type="button"
              className="wp-add"
              onClick={() => {
                const nextGroups = [...groups];
                nextGroups[gi] = {
                  ...group,
                  items: [...group.items, { name: `New ${noun}`, icon: "empty" }],
                };
                setData({ ...data, [kind]: nextGroups });
              }}
            >
              + Add {noun}
            </button>
            {" · "}
            <button
              type="button"
              className="wp-add"
              onClick={() => setData({ ...data, [kind]: move(groups, gi, -1) })}
            >
              Move up
            </button>
            {" · "}
            <button
              type="button"
              className="wp-add"
              onClick={() => setData({ ...data, [kind]: move(groups, gi, 1) })}
            >
              Move down
            </button>
            {" · "}
            <button
              type="button"
              className="wp-btn-link"
              onClick={() =>
                setData({ ...data, [kind]: groups.filter((_, j) => j !== gi) })
              }
            >
              Trash group
            </button>
          </p>
        </Metabox>
      ))}
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
    </>
  );
}
