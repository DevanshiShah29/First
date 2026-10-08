"use client";

// Application services & types
import type { ContentData, PublishStatus, SkillGroup } from "@/content/types";
import type { Screen } from "../types";

// UI components
import { Metabox } from "../components/Metabox";

/**
 * Counts entries whose status is draft.
 * @example draftCount(data.projects) // 1
 */
function draftCount(items: { status?: PublishStatus }[]) {
  return items.filter((item) => item.status === "draft").length;
}

/**
 * Counts a draft craft page plus draft groups and items.
 * @example draftCraftCount(data.craft) // 1
 */
function draftCraftCount(craft: ContentData["craft"]) {
  if (!craft) return 0;
  const page = craft.status === "draft" ? 1 : 0;
  return craft.groups.reduce((total, group) => {
    const groupDraft = group.status === "draft" ? 1 : 0;
    const items = group.items.filter((item) => item.status === "draft").length;
    return total + groupDraft + items;
  }, page);
}

/**
 * Counts draft skill groups and draft items.
 * @example draftSkillCount(data.skills) // 2
 */
function draftSkillCount(groups: SkillGroup[]) {
  return groups.reduce((total, group) => {
    const groupDraft = group.status === "draft" ? 1 : 0;
    const itemDrafts = group.items.filter((item) => item.status === "draft").length;
    return total + groupDraft + itemDrafts;
  }, 0);
}

/**
 * Appends a draft count when any entries are unpublished.
 * @example withDrafts("3 Projects", 1) // "3 Projects (1 draft)"
 */
function withDrafts(label: string, drafts: number) {
  if (!drafts) return label;
  return `${label} (${drafts} draft${drafts === 1 ? "" : "s"})`;
}

interface DashboardScreenProps {
  data: ContentData;
  go: (screen: Screen) => void;
  addExperience: () => void;
  addProject: () => void;
  addMemory: () => void;
}

/**
 * Renders the CMS dashboard overview widgets.
 * @example <DashboardScreen data={data} go={go} … />
 */
export function DashboardScreen({
  data,
  go,
  addExperience,
  addProject,
  addMemory,
}: DashboardScreenProps) {
  const site = data.site;
  const memoriesList = data.memories ?? [];

  return (
    <>
      <h1 className="wp-screen-title">Dashboard</h1>
      <p className="wp-sub">Welcome to your portfolio admin.</p>
      <div className="wp-widgets">
        <Metabox id="dash_glance" title="At a Glance">
          <ul className="wp-glance">
            <li>
              <button type="button" onClick={() => go("analytics")}>
                Site analytics
              </button>
            </li>
            <li>
              <button type="button" onClick={() => go("hero")}>
                Hero
              </button>
            </li>
            <li>
              <button type="button" onClick={() => go("about")}>
                About
              </button>
            </li>
            <li>
              <button type="button" onClick={() => go("experience")}>
                {withDrafts(`${data.experience.length} Experience`, draftCount(data.experience))}
              </button>
            </li>
            <li>
              <button type="button" onClick={() => go("projects")}>
                {withDrafts(`${data.projects.length} Projects`, draftCount(data.projects))}
              </button>
            </li>
            <li>
              <button type="button" onClick={() => go("skills")}>
                {withDrafts(
                  `${(data.skills ?? []).reduce((n, g) => n + g.items.length, 0)} Skills`,
                  draftSkillCount(data.skills ?? []),
                )}
              </button>
            </li>
            <li>
              <button type="button" onClick={() => go("technologies")}>
                {withDrafts(
                  `${(data.technologies ?? []).reduce((n, g) => n + g.items.length, 0)} Technologies`,
                  draftSkillCount(data.technologies ?? []),
                )}
              </button>
            </li>
            <li>
              <button type="button" onClick={() => go("contact")}>
                Contact
              </button>
            </li>
            <li>
              <button type="button" onClick={() => go("craft")}>
                {withDrafts(
                  `${(data.craft?.groups ?? []).reduce((n, g) => n + g.items.length, 0)} Craft`,
                  draftCraftCount(data.craft),
                )}
              </button>
            </li>
            <li>
              <button type="button" onClick={() => go("memories")}>
                {withDrafts(`${memoriesList.length} Memories`, draftCount(memoriesList))}
              </button>
            </li>
            <li>
              <button type="button" onClick={() => go("appearance")}>
                Appearance
              </button>
            </li>
          </ul>
        </Metabox>

        <Metabox id="dash_identity" title="Site identity">
          <p>
            <strong>{site.name}</strong>
            <br />
            {site.title}
          </p>
          <p style={{ marginTop: 12 }}>
            <button type="button" className="wp-btn wp-btn-primary" onClick={() => go("site")}>
              Edit settings
            </button>
          </p>
        </Metabox>

        <Metabox id="dash_draft" title="Quick draft">
          <p className="wp-sub" style={{ marginBottom: 12 }}>
            Add a new role, project, or memory without leaving the dashboard.
          </p>
          <button type="button" className="wp-btn" onClick={addExperience} style={{ marginRight: 8 }}>
            Add experience
          </button>
          <button type="button" className="wp-btn" onClick={addProject} style={{ marginRight: 8 }}>
            Add project
          </button>
          <button type="button" className="wp-btn" onClick={addMemory}>
            Add memory
          </button>
        </Metabox>
      </div>
    </>
  );
}
