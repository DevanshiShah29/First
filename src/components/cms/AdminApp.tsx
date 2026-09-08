"use client";

// External dependencies
import { useRouter } from "next/navigation";

// Application services & types
import type { ContentData } from "@/content/types";
import { cmsLogout } from "@/lib/cms-client";

// UI components
import { AdminBar, AdminMenu, type MenuItem } from "./components/AdminNav";
import { Breadcrumbs } from "./components/Breadcrumbs";

// CMS hooks
import { useCmsDocument } from "./hooks/useCmsDocument";
import { useCmsNavigation } from "./hooks/useCmsNavigation";
import { useCmsUploads } from "./hooks/useCmsUploads";

// CMS screens
import { AboutScreen } from "./screens/AboutScreen";
import { AnalyticsScreen } from "./screens/AnalyticsScreen";
import { AppearanceScreen } from "./screens/AppearanceScreen";
import { ContactScreen } from "./screens/ContactScreen";
import { CraftScreen } from "./screens/CraftScreens";
import { DashboardScreen } from "./screens/DashboardScreen";
import {
  ExperienceEditScreen,
  ExperienceListScreen,
} from "./screens/ExperienceScreens";
import { HeroScreen } from "./screens/HeroScreen";
import {
  MemoriesEditScreen,
  MemoriesListScreen,
} from "./screens/MemoriesScreens";
import {
  ProjectsEditScreen,
  ProjectsListScreen,
} from "./screens/ProjectsScreens";
import { SiteScreen } from "./screens/SiteScreen";
import { SkillGroupsScreen } from "./screens/SkillsScreens";

// Icons
import {
  IconAbout,
  IconAnalytics,
  IconAppearance,
  IconCode,
  IconContact,
  IconCraft,
  IconDash,
  IconHero,
  IconJar,
  IconPages,
  IconPin,
  IconSettings,
  IconStar,
} from "./wp-icons";

/**
 * Renders the authenticated CMS shell and active screen.
 * @example <AdminApp initial={content} />
 */
export function AdminApp({ initial }: { initial: ContentData }) {
  const router = useRouter();
  const doc = useCmsDocument(initial);
  const {
    data,
    setData,
    dirty,
    status,
    error,
    setError,
    notice,
    setNotice,
    save,
  } = doc;

  const nav = useCmsNavigation(data, setData, () => setNotice(""));
  const {
    screen,
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
  } = nav;

  const uploads = useCmsUploads(data, setData, setError, setNotice);
  const {
    uploading,
    setHeroMedia,
    uploadHeroFile,
    uploadMemoryPhoto,
    uploadResume,
    uploadSkillIcon,
  } = uploads;

  const site = data.site;
  const [firstName] = (site.name || "Admin").split(" ");

  /**
   * Logs out of the CMS and returns to login.
   * @example logout() // void
   */
  async function logout() {
    await cmsLogout();
    router.push("/admin/login");
    router.refresh();
  }

  // Match homepage section order (Hero → About → Experience → Projects → Skills → Contact),
  // then Craft / Memories / Appearance / Settings.
  const menu: MenuItem[] = [
    { id: "dashboard", label: "Dashboard", icon: <IconDash />, match: screen === "dashboard" },
    { id: "analytics", label: "Analytics", icon: <IconAnalytics />, match: screen === "analytics" },
    { id: "hero", label: "Hero", icon: <IconHero />, match: screen === "hero" },
    { id: "about", label: "About", icon: <IconAbout />, match: screen === "about" },
    { id: "experience", label: "Experience", icon: <IconPin />, match: screen.startsWith("experience") },
    { id: "projects", label: "Projects", icon: <IconPages />, match: screen.startsWith("projects") },
    { id: "skills", label: "Skills", icon: <IconStar />, match: screen === "skills" },
    { id: "technologies", label: "Technologies", icon: <IconCode />, match: screen === "technologies" },
    { id: "contact", label: "Contact", icon: <IconContact />, match: screen === "contact" },
    { id: "craft", label: "Craft", icon: <IconCraft />, match: screen === "craft" },
    { id: "memories", label: "Memories", icon: <IconJar />, match: screen.startsWith("memories") },
    { id: "appearance", label: "Appearance", icon: <IconAppearance />, match: screen === "appearance" },
    { id: "site", label: "Settings", icon: <IconSettings />, match: screen === "site" },
  ];

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

          {screen === "analytics" && <AnalyticsScreen />}

          {screen === "site" && (
            <SiteScreen
              data={data}
              setData={setData}
              go={go}
              save={save}
              dirty={dirty}
              onPasswordNotice={(message) => {
                setError("");
                setNotice(message);
              }}
              onPasswordError={(message) => {
                setNotice("");
                setError(message);
              }}
            />
          )}

          {screen === "about" && (
            <AboutScreen
              data={data}
              setData={setData}
              save={save}
              dirty={dirty}
            />
          )}

          {screen === "contact" && (
            <ContactScreen
              data={data}
              setData={setData}
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
              save={save}
              dirty={dirty}
            />
          )}

          {screen === "experience" && (
            <ExperienceListScreen data={data} setData={setData} go={go} addExperience={addExperience} />
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
            <ProjectsListScreen data={data} setData={setData} go={go} addProject={addProject} />
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
              uploadSkillIcon={uploadSkillIcon}
              uploading={uploading}
              save={save}
              dirty={dirty}
            />
          )}

          {screen === "craft" && (
            <CraftScreen
              data={data}
              setData={setData}
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
