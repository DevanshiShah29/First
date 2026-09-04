"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ContentData, HeroMedia } from "@/content/types";
import { cmsLogout, saveCmsContent, uploadCmsFile } from "@/lib/api-client";
import { AdminBar, AdminMenu, type MenuItem } from "./components/AdminNav";
import { Breadcrumbs } from "./components/Breadcrumbs";
import { AppearanceScreen } from "./screens/AppearanceScreen";
import { DashboardScreen } from "./screens/DashboardScreen";
import { ExperienceEditScreen, ExperienceListScreen } from "./screens/ExperienceScreens";
import { HeroScreen } from "./screens/HeroScreen";
import { MemoriesEditScreen, MemoriesListScreen } from "./screens/MemoriesScreens";
import { ProjectsEditScreen, ProjectsListScreen } from "./screens/ProjectsScreens";
import { SiteScreen } from "./screens/SiteScreen";
import { SkillGroupsScreen } from "./screens/SkillsScreens";
import { clone, newId, type BreadcrumbItem, type Screen } from "./types";
import {
  IconAppearance,
  IconCode,
  IconDash,
  IconHero,
  IconJar,
  IconPages,
  IconPin,
  IconSettings,
  IconStar,
} from "./wp-icons";

export function AdminApp({ initial }: { initial: ContentData }) {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [editId, setEditId] = useState<string | null>(null);
  const [data, setData] = useState(() => clone(initial));
  const [saved, setSaved] = useState(() => JSON.stringify(initial));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sectionState, setSectionState] = useState<Record<string, boolean>>({});

  const dirty = useMemo(() => JSON.stringify(data) !== saved, [data, saved]);
  const site = data.site;
  const [firstName] = (site.name || "Admin").split(" ");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        void save();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function expandAll(ids: string[]) {
    setSectionState((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        next[id] = true;
        try {
          localStorage.setItem(`wp_metabox_${id}`, "true");
        } catch {
          // Ignore
        }
      });
      return next;
    });
  }

  function collapseAll(ids: string[]) {
    setSectionState((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        next[id] = false;
        try {
          localStorage.setItem(`wp_metabox_${id}`, "false");
        } catch {
          // Ignore
        }
      });
      return next;
    });
  }

  useEffect(() => {
    function onLeave(e: BeforeUnloadEvent) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  async function save() {
    setStatus("saving");
    setError("");
    const res = await saveCmsContent(data);
    if (!res.ok || !res.data?.content) {
      setStatus("error");
      setError(res.error || "Save failed.");
      return;
    }
    const next = clone(res.data.content);
    setData(next);
    setSaved(JSON.stringify(next));
    setStatus("saved");
    setNotice("Content updated.");
    router.refresh();
  }

  async function logout() {
    await cmsLogout();
    router.push("/admin/login");
    router.refresh();
  }

  function setHeroMedia(patch: Partial<HeroMedia>) {
    setData({
      ...data,
      site: { ...site, heroMedia: { ...site.heroMedia, ...patch } },
    });
  }

  async function uploadHeroFile(file: File) {
    setUploading(true);
    setError("");
    const res = await uploadCmsFile(file, "hero");
    setUploading(false);
    if (!res.ok || !res.data?.url) {
      setError(res.error || "Upload failed.");
      return;
    }
    const uploadedUrl = res.data.url;
    const uploadedKind = res.data.kind ?? "image";
    setHeroMedia({ url: uploadedUrl, kind: uploadedKind });
  }

  function go(next: Screen, id: string | null = null) {
    setScreen(next);
    setEditId(id);
    setMenuOpen(false);
    setNotice("");
  }

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

  async function uploadMemoryPhoto(file: File, id: string) {
    setUploading(true);
    setError("");
    setNotice("");
    const res = await uploadCmsFile(file, "memories");
    setUploading(false);
    if (!res.ok || !res.data?.url) {
      setError(res.error || "Photo upload failed.");
      return;
    }
    const photoUrl = res.data.url;
    const memories = (data.memories ?? []).map((m) => (m.id === id ? { ...m, photoUrl } : m));
    setData({ ...data, memories });
    setNotice("Memory photo uploaded. Save changes to update.");
  }

  async function uploadResume(file: File) {
    setUploading(true);
    setError("");
    setNotice("");
    const res = await uploadCmsFile(file, "resume");
    setUploading(false);
    if (!res.ok || !res.data?.url) {
      setError(res.error || "Resume upload failed.");
      return;
    }
    const resumeUrl = res.data.url;
    setData((current) => ({
      ...current,
      site: { ...current.site, resume: resumeUrl },
    }));
    setNotice("Resume uploaded. Save changes to publish the new file.");
  }

  async function uploadSkillIcon(
    file: File,
    kind: "skills" | "technologies",
    gi: number,
    ii: number,
  ) {
    setUploading(true);
    setError("");
    const res = await uploadCmsFile(file, "skills");
    setUploading(false);
    if (!res.ok || !res.data?.url) {
      setError(res.error || "Icon upload failed.");
      return;
    }
    const iconUrl = res.data.url;
    setData((current) => {
      const groups = [...(current[kind] ?? [])];
      const group = groups[gi];
      if (!group) return current;
      const items = [...group.items];
      if (!items[ii]) return current;
      items[ii] = { ...items[ii], iconUrl };
      groups[gi] = { ...group, items };
      return { ...current, [kind]: groups };
    });
  }

  const expIndex = data.experience.findIndex((j) => j.id === editId);
  const job = expIndex >= 0 ? data.experience[expIndex] : null;
  const projIndex = data.projects.findIndex((p) => p.id === editId);
  const project = projIndex >= 0 ? data.projects[projIndex] : null;
  const memoriesList = data.memories ?? [];
  const memIndex = memoriesList.findIndex((m) => m.id === editId);
  const memory = memIndex >= 0 ? memoriesList[memIndex] : null;

  const menu: MenuItem[] = [
    { id: "dashboard", label: "Dashboard", icon: <IconDash />, match: screen === "dashboard" },
    { id: "experience", label: "Experience", icon: <IconPin />, match: screen.startsWith("experience") },
    { id: "projects", label: "Projects", icon: <IconPages />, match: screen.startsWith("projects") },
    { id: "skills", label: "Skills", icon: <IconStar />, match: screen === "skills" },
    { id: "technologies", label: "Technologies", icon: <IconCode />, match: screen === "technologies" },
    { id: "memories", label: "Memories", icon: <IconJar />, match: screen.startsWith("memories") },
    { id: "hero", label: "Hero", icon: <IconHero />, match: screen === "hero" },
    { id: "appearance", label: "Appearance", icon: <IconAppearance />, match: screen === "appearance" },
    { id: "site", label: "Settings", icon: <IconSettings />, match: screen === "site" },
  ];

  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => {
    switch (screen) {
      case "dashboard":
        return [{ label: "Dashboard", current: true }];
      case "site":
        return [
          { label: "Dashboard", onClick: () => go("dashboard") },
          { label: "General Settings", current: true },
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
            label: job ? (job.role === "New role" ? "Add New Experience" : job.role || "Untitled Role") : "Edit Experience",
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
            label: project ? (project.name === "New project" ? "Add New Project" : project.name || "Untitled Project") : "Edit Project",
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
            label: memory ? (memory.title === "New memory" ? "Add New Memory" : memory.title || "Untitled Memory") : "Edit Memory",
            current: true,
          },
        ];
      default:
        return [{ label: "Dashboard", current: true }];
    }
  }, [screen, job, project, memory]);

  return (
    <div className={`wp-app${menuOpen ? " is-menu-open" : ""}`}>
      <a href="#admin-content" className="skip">
        Skip to content
      </a>
      <AdminBar
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        newOpen={newOpen}
        setNewOpen={setNewOpen}
        siteName={site.name}
        firstName={firstName}
        dirty={dirty}
        status={status}
        save={save}
        logout={logout}
        addExperience={addExperience}
        addProject={addProject}
        addMemory={addMemory}
      />

      <div className="wp-layout">
        <AdminMenu menu={menu} go={go} setMenuOpen={setMenuOpen} />

        <main id="admin-content" className="wp-content" tabIndex={-1}>
          <Breadcrumbs items={breadcrumbs} />
          {error ? (
            <div className="wp-notice is-error" role="alert">
              {error}
            </div>
          ) : null}
          {notice && !error ? (
            <div className="wp-notice is-success" role="status">
              {notice}
            </div>
          ) : null}

          {screen === "dashboard" && (
            <DashboardScreen
              data={data}
              go={go}
              addExperience={addExperience}
              addProject={addProject}
              addMemory={addMemory}
            />
          )}

          {screen === "site" && (
            <SiteScreen
              data={data}
              setData={setData}
              sectionState={sectionState}
              expandAll={expandAll}
              collapseAll={collapseAll}
              go={go}
              uploadResume={uploadResume}
              uploading={uploading}
              save={save}
              dirty={dirty}
            />
          )}

          {screen === "hero" && (
            <HeroScreen
              data={data}
              setData={setData}
              sectionState={sectionState}
              expandAll={expandAll}
              collapseAll={collapseAll}
              setHeroMedia={setHeroMedia}
              uploadHeroFile={uploadHeroFile}
              uploading={uploading}
              save={save}
              dirty={dirty}
            />
          )}

          {screen === "appearance" && (
            <AppearanceScreen
              data={data}
              setData={setData}
              sectionState={sectionState}
              expandAll={expandAll}
              collapseAll={collapseAll}
              save={save}
              dirty={dirty}
            />
          )}

          {screen === "experience" && (
            <ExperienceListScreen
              data={data}
              setData={setData}
              go={go}
              addExperience={addExperience}
            />
          )}

          {screen === "experience-edit" && job && (
            <ExperienceEditScreen
              data={data}
              setData={setData}
              job={job}
              expIndex={expIndex}
              go={go}
              save={save}
              dirty={dirty}
            />
          )}

          {screen === "projects" && (
            <ProjectsListScreen
              data={data}
              setData={setData}
              go={go}
              addProject={addProject}
            />
          )}

          {screen === "projects-edit" && project && (
            <ProjectsEditScreen
              data={data}
              setData={setData}
              project={project}
              projIndex={projIndex}
              go={go}
              save={save}
              dirty={dirty}
            />
          )}

          {screen === "skills" && (
            <SkillGroupsScreen
              kind="skills"
              title="Skills"
              noun="skill"
              data={data}
              setData={setData}
              sectionState={sectionState}
              expandAll={expandAll}
              collapseAll={collapseAll}
              uploadSkillIcon={uploadSkillIcon}
              uploading={uploading}
              save={save}
              dirty={dirty}
            />
          )}

          {screen === "technologies" && (
            <SkillGroupsScreen
              kind="technologies"
              title="Technologies"
              noun="technology"
              data={data}
              setData={setData}
              sectionState={sectionState}
              expandAll={expandAll}
              collapseAll={collapseAll}
              uploadSkillIcon={uploadSkillIcon}
              uploading={uploading}
              save={save}
              dirty={dirty}
            />
          )}

          {screen === "memories" && (
            <MemoriesListScreen
              data={data}
              setData={setData}
              memoriesList={memoriesList}
              go={go}
              addMemory={addMemory}
              uploadMemoryPhoto={uploadMemoryPhoto}
              uploading={uploading}
            />
          )}

          {screen === "memories-edit" && memory && (
            <MemoriesEditScreen
              data={data}
              setData={setData}
              memory={memory}
              memIndex={memIndex}
              memoriesList={memoriesList}
              go={go}
              uploadMemoryPhoto={uploadMemoryPhoto}
              uploading={uploading}
              save={save}
              dirty={dirty}
            />
          )}

          <p className="wp-sub" style={{ marginTop: 28 }}>
            Saves live to Neon (Postgres) via Prisma. No commit needed to publish content.
          </p>
        </main>
      </div>
    </div>
  );
}
