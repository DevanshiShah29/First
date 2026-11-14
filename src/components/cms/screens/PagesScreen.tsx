"use client";

// Application services & types
import {
  SECTION_TITLE_FALLBACKS,
  setSectionTitle,
  type SectionTitleKey,
} from "@/content/section-titles";
import {
  SITE_SECTIONS,
  normalizeSections,
  sectionEnabled,
  type ContentData,
  type SiteSectionId,
} from "@/content/types";
import type { Screen } from "../types";

// UI components
import { CmsSaveButton, type CmsSaveStatus } from "../components/CmsSaveButton";
import { Metabox } from "../components/Metabox";
import { TextInput } from "../fields";

const SECTION_SCREEN: Record<SiteSectionId, Screen> = {
  hero: "hero",
  about: "about",
  experience: "experience",
  projects: "projects",
  skills: "skills",
  technologies: "technologies",
  contact: "contact",
  craft: "craft",
  memories: "memories",
  reading: "artifacts",
};

const SECTION_TITLES: Record<
  SiteSectionId,
  { key: SectionTitleKey; label: string }[]
> = {
  hero: [],
  about: [
    { key: "about", label: "Heading" },
    { key: "aboutNav", label: "Menu label" },
  ],
  experience: [{ key: "experience", label: "Heading" }],
  projects: [{ key: "projects", label: "Heading" }],
  skills: [
    { key: "skills", label: "Heading" },
    { key: "skillsNav", label: "Menu label" },
  ],
  technologies: [],
  contact: [
    { key: "contact", label: "Heading" },
    { key: "contactNav", label: "Menu label" },
  ],
  craft: [],
  memories: [{ key: "memories", label: "Heading" }],
  reading: [
    { key: "reading", label: "Page title" },
    { key: "readingNow", label: "Currently reading" },
    { key: "readingDone", label: "Read" },
    { key: "readingWant", label: "Want to read" },
  ],
};

interface PagesScreenProps {
  data: ContentData;
  setData: (data: ContentData) => void;
  go: (screen: Screen) => void;
  save: () => Promise<void>;
  dirty: boolean;
  status: CmsSaveStatus;
}

/**
 * Manages live site section visibility and each section's title directly under its toggle.
 * @example <PagesScreen data={data} setData={setData} go={go} save={save} … />
 */
export function PagesScreen({
  data,
  setData,
  go,
  save,
  dirty,
  status,
}: PagesScreenProps) {
  const site = data.site;
  const sections = normalizeSections(site.sections);
  const shownCount = SITE_SECTIONS.filter((section) =>
    sectionEnabled(sections, section.id),
  ).length;

  /**
   * Toggles whether a site section appears on the public site.
   * @example setShown("hero", false) // hides hero
   */
  function setShown(id: SiteSectionId, shown: boolean) {
    setData({
      ...data,
      site: {
        ...site,
        sections: { ...sections, [id]: shown },
      },
    });
  }

  /**
   * Updates one section title key.
   * @example onTitleChange("about", "Story") // updates about heading
   */
  function onTitleChange(key: SectionTitleKey, value: string) {
    setData({
      ...data,
      site: setSectionTitle(site, key, value),
    });
  }

  return (
    <>
      <h1 className="wp-screen-title">Pages</h1>
      <p className="wp-sub">
        Manage pages and sections, control live site visibility, and customize public titles.
      </p>

      <Metabox
        id="pages_manager"
        title="Live website"
        badge={`${shownCount} of ${SITE_SECTIONS.length} shown`}
      >
        <p className="wp-sub" style={{ marginTop: 0 }}>
          Turn a section off to hide it on the live site. Edit titles and menu labels directly below each section. Leave a field blank to keep the default placeholder. Save to apply.
        </p>

        <ul className="wp-section-list">
          {SITE_SECTIONS.map((section) => {
            const shown = sectionEnabled(sections, section.id);
            const fields = SECTION_TITLES[section.id];

            return (
              <li key={section.id} className="wp-section-item">
                <div className="wp-section-row">
                  <div>
                    <button
                      type="button"
                      onClick={() => go(SECTION_SCREEN[section.id])}
                    >
                      {section.label}
                    </button>
                    <span className="wp-section-where">{section.where}</span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    className={`wp-switch${shown ? " is-on" : ""}`}
                    aria-checked={shown}
                    aria-label={`${shown ? "Hide" : "Show"} ${section.label} on the live site`}
                    onClick={() => setShown(section.id, !shown)}
                  >
                    <span className="wp-switch-track" aria-hidden="true">
                      <span className="wp-switch-knob" />
                    </span>
                    {shown ? "Shown" : "Hidden"}
                  </button>
                </div>

                {fields.length > 0 && (
                  <div className="wp-section-titles">
                    {fields.map((field) => (
                      <div key={field.key} className="wp-section-title-field">
                        <label
                          htmlFor={`title-${field.key}`}
                          className="wp-section-title-label"
                        >
                          {field.label}
                        </label>
                        <TextInput
                          id={`title-${field.key}`}
                          value={site.titles?.[field.key] ?? ""}
                          placeholder={SECTION_TITLE_FALLBACKS[field.key]}
                          onChange={(value) =>
                            onTitleChange(field.key, value)
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Metabox>

      <p>
        <CmsSaveButton save={save} dirty={dirty} status={status} />
      </p>
    </>
  );
}
