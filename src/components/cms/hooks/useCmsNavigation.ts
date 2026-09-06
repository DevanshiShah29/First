"use client";

// External dependencies
import { useMemo, useState, type Dispatch, type SetStateAction } from "react";

// Application services & types
import type { ContentData } from "@/content/types";
import { newId } from "../types";
import type { BreadcrumbItem, Screen } from "../types";

/**
 * Manages CMS screen routing, breadcrumbs, and add-entity actions.
 * @example useCmsNavigation(data, setData, clear) // { screen, go, breadcrumbs }
 */
export function useCmsNavigation(
  data: ContentData,
  setData: Dispatch<SetStateAction<ContentData>>,
  clearNotice: () => void,
) {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [editId, setEditId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);

  const expIndex = data.experience.findIndex((j) => j.id === editId);
  const job = expIndex >= 0 ? data.experience[expIndex] : null;
  const projIndex = data.projects.findIndex((p) => p.id === editId);
  const project = projIndex >= 0 ? data.projects[projIndex] : null;
  const memoriesList = data.memories ?? [];
  const memIndex = memoriesList.findIndex((m) => m.id === editId);
  const memory = memIndex >= 0 ? memoriesList[memIndex] : null;

  /**
   * Navigates to a CMS screen and optional edit id.
   * @example go("projects-edit", id) // void
   */
  function go(next: Screen, id: string | null = null) {
    setScreen(next);
    setEditId(id);
    setMenuOpen(false);
    clearNotice();
  }

  /**
   * Appends a blank experience and opens its editor.
   * @example addExperience() // void
   */
  function addExperience() {
    const id = newId();
    setData({
      ...data,
      experience: [
        ...data.experience,
        {
          id,
          when: "",
          current: false,
          role: "New role",
          company: "",
          summary: "",
          bullets: [""],
          stack: [],
        },
      ],
    });
    go("experience-edit", id);
  }

  /**
   * Appends a blank project and opens its editor.
   * @example addProject() // void
   */
  function addProject() {
    const id = newId();
    setData({
      ...data,
      projects: [
        ...data.projects,
        { id, name: "New project", blurb: "", tags: [], github: "", demo: "" },
      ],
    });
    go("projects-edit", id);
  }

  /**
   * Appends a blank memory and opens its editor.
   * @example addMemory() // void
   */
  function addMemory() {
    const id = newId();
    const memories = data.memories ?? [];
    setData({
      ...data,
      memories: [
        ...memories,
        {
          id,
          title: "New memory",
          note: "",
          date: "",
          category: "Tiny Joy",
          photoUrl: "",
          color: "#A78BFA",
        },
      ],
    });
    go("memories-edit", id);
  }

  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => {
    switch (screen) {
      case "dashboard":
        return [{ label: "Dashboard", current: true }];
      case "site":
        return [
          { label: "Dashboard", onClick: () => go("dashboard") },
          { label: "General Settings", current: true },
        ];
      case "about":
        return [
          { label: "Dashboard", onClick: () => go("dashboard") },
          { label: "About", current: true },
        ];
      case "contact":
        return [
          { label: "Dashboard", onClick: () => go("dashboard") },
          { label: "Contact", current: true },
        ];
      case "hero":
        return [
          { label: "Dashboard", onClick: () => go("dashboard") },
          { label: "Hero", current: true },
        ];
      case "appearance":
        return [
          { label: "Dashboard", onClick: () => go("dashboard") },
          { label: "Appearance", current: true },
        ];
      case "experience":
        return [
          { label: "Dashboard", onClick: () => go("dashboard") },
          { label: "Experience", current: true },
        ];
      case "experience-edit":
        return [
          { label: "Dashboard", onClick: () => go("dashboard") },
          { label: "Experience", onClick: () => go("experience") },
          {
            label: job
              ? job.role === "New role"
                ? "Add New Experience"
                : job.role || "Untitled Role"
              : "Edit Experience",
            current: true,
          },
        ];
      case "projects":
        return [
          { label: "Dashboard", onClick: () => go("dashboard") },
          { label: "Projects", current: true },
        ];
      case "projects-edit":
        return [
          { label: "Dashboard", onClick: () => go("dashboard") },
          { label: "Projects", onClick: () => go("projects") },
          {
            label: project
              ? project.name === "New project"
                ? "Add New Project"
                : project.name || "Untitled Project"
              : "Edit Project",
            current: true,
          },
        ];
      case "skills":
        return [
          { label: "Dashboard", onClick: () => go("dashboard") },
          { label: "Skills", current: true },
        ];
      case "technologies":
        return [
          { label: "Dashboard", onClick: () => go("dashboard") },
          { label: "Technologies", current: true },
        ];
      case "craft":
        return [
          { label: "Dashboard", onClick: () => go("dashboard") },
          { label: "Craft", current: true },
        ];
      case "memories":
        return [
          { label: "Dashboard", onClick: () => go("dashboard") },
          { label: "Memory Jar", current: true },
        ];
      case "memories-edit":
        return [
          { label: "Dashboard", onClick: () => go("dashboard") },
          { label: "Memory Jar", onClick: () => go("memories") },
          {
            label: memory
              ? memory.title === "New memory"
                ? "Add New Memory"
                : memory.title || "Untitled Memory"
              : "Edit Memory",
            current: true,
          },
        ];
      default:
        return [{ label: "Dashboard", current: true }];
    }
    // go is stable enough for breadcrumb onClick closures recreated each render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, job, project, memory]);

  return {
    screen,
    editId,
    menuOpen,
    setMenuOpen,
    newOpen,
    setNewOpen,
    go,
    addExperience,
    addProject,
    addMemory,
    breadcrumbs,
    expIndex,
    job,
    projIndex,
    project,
    memoriesList,
    memIndex,
    memory,
  };
}
