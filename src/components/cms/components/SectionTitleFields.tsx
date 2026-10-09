"use client";

import {
  SECTION_TITLE_FALLBACKS,
  setSectionTitle,
  type SectionTitleKey,
} from "@/content/section-titles";
import type { SiteContent } from "@/content/types";
import { Field, TextInput } from "../fields";

const TITLE_FIELDS: { key: SectionTitleKey; label: string }[] = [
  { key: "about", label: "About heading" },
  { key: "aboutNav", label: "About menu" },
  { key: "experience", label: "Experience" },
  { key: "projects", label: "Projects" },
  { key: "skills", label: "Skills heading" },
  { key: "skillsNav", label: "Skills menu" },
  { key: "contact", label: "Contact heading" },
  { key: "contactNav", label: "Contact menu" },
  { key: "reading", label: "Book Nook" },
  { key: "readingNow", label: "Currently reading" },
  { key: "readingDone", label: "Read" },
  { key: "readingWant", label: "Want to read" },
  { key: "memories", label: "Memories" },
];

/**
 * Settings fields for public page and section titles.
 * A blank field keeps the placeholder wording and is stored empty.
 * @example <SectionTitleFields site={site} onSite={setSite} />
 */
export function SectionTitleFields({
  site,
  onSite,
}: {
  site: SiteContent;
  onSite: (site: SiteContent) => void;
}) {
  return (
    <table className="wp-form-table">
      <tbody>
        {TITLE_FIELDS.map((field) => (
          <Field key={field.key} label={field.label}>
            <TextInput
              value={site.titles?.[field.key] ?? ""}
              placeholder={SECTION_TITLE_FALLBACKS[field.key]}
              onChange={(value) => onSite(setSectionTitle(site, field.key, value))}
            />
          </Field>
        ))}
      </tbody>
    </table>
  );
}
