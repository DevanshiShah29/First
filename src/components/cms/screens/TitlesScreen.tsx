"use client";

// Application services & types
import type { ContentData } from "@/content/types";

// UI components
import { CmsSaveButton, type CmsSaveStatus } from "../components/CmsSaveButton";
import { Metabox } from "../components/Metabox";
import { SectionTitleFields } from "../components/SectionTitleFields";

interface TitlesScreenProps {
  data: ContentData;
  setData: (data: ContentData) => void;
  save: () => Promise<void>;
  dirty: boolean;
  status: CmsSaveStatus;
}

/**
 * Renders public page and section titles.
 * @example <TitlesScreen data={data} setData={setData} save={save} … />
 */
export function TitlesScreen({
  data,
  setData,
  save,
  dirty,
  status,
}: TitlesScreenProps) {
  const site = data.site;

  return (
    <>
      <h1 className="wp-screen-title">Page titles</h1>
      <p className="wp-sub">
        Names for the pages and sections. Leave a field blank to keep the placeholder.
      </p>
      <Metabox id="page_titles" title="Page titles">
        <SectionTitleFields site={site} onSite={(next) => setData({ ...data, site: next })} />
      </Metabox>
      <p>
        <CmsSaveButton save={save} dirty={dirty} status={status} />
      </p>
    </>
  );
}
