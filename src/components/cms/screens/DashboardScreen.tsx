"use client";

// Application services & types
import type { ContentData } from "@/content/types";
import type { Screen } from "../types";

// UI components
import { Metabox } from "../components/Metabox";

interface DashboardScreenProps {
  data: ContentData;
  go: (screen: Screen) => void;
  addExperience: () => void;
  addProject: () => void;
  addMemory: () => void;
}

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
                {data.experience.length} Experience
              </button>
            </li>
            <li>
              <button type="button" onClick={() => go("projects")}>
                {data.projects.length} Projects
              </button>
            </li>
            <li>
              <button type="button" onClick={() => go("skills")}>
                {(data.skills ?? []).reduce((n, g) => n + g.items.length, 0)} Skills
              </button>
            </li>
            <li>
              <button type="button" onClick={() => go("technologies")}>
                {(data.technologies ?? []).reduce((n, g) => n + g.items.length, 0)} Technologies
              </button>
            </li>
            <li>
              <button type="button" onClick={() => go("contact")}>
                Contact
              </button>
            </li>
            <li>
              <button type="button" onClick={() => go("craft")}>
                {(data.craft?.groups ?? []).reduce((n, g) => n + g.items.length, 0)} Craft
              </button>
            </li>
            <li>
              <button type="button" onClick={() => go("memories")}>
                {memoriesList.length} Memories
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
