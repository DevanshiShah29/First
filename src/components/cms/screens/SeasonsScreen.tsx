"use client";

import { useMemo, useState } from "react";
import type { ContentData } from "@/content/types";
import { SeasonsPanel } from "../appearance/SeasonsPanel";
import { CmsSaveButton, type CmsSaveStatus } from "../components/CmsSaveButton";
import { EditorTabs } from "../preview/EditorTabs";
import { LivePreviewShell } from "../preview/LivePreviewShell";

/**
 * Preview copy that paints one season without changing the saved schedule.
 * @example withPreviewSeason(data, "diwali") // ContentData
 */
function withPreviewSeason(data: ContentData, previewId: string | null): ContentData {
  if (!previewId) return data;
  return {
    ...data,
    site: {
      ...data.site,
      seasons: { ...data.site.seasons, mode: "manual", manualId: previewId },
    },
  };
}

/**
 * Festive seasons CMS screen. The year-round theme stays on Appearance.
 * @example <SeasonsScreen data={data} setData={setData} save={save} … />
 */
export function SeasonsScreen({
  data,
  setData,
  save,
  dirty,
  status,
}: {
  data: ContentData;
  setData: (data: ContentData) => void;
  save: () => Promise<void>;
  dirty: boolean;
  status: CmsSaveStatus;
}) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewTick, setPreviewTick] = useState(0);
  const previewData = useMemo(() => withPreviewSeason(data, previewId), [data, previewId]);

  return (
    <>
      <h1 className="wp-screen-title">Seasons</h1>
      <p className="wp-sub">
        Halloween, Diwali, and Christmas sit on top of the Appearance theme. Add a festival for any
        other dates. Pick a card to edit it. Preview paints that season without changing the saved
        schedule.
      </p>
      <EditorTabs
        previewTick={previewTick}
        preview={<LivePreviewShell data={previewData} dirty={dirty} section="seasons" />}
      >
        <SeasonsPanel
          data={data}
          setData={setData}
          previewId={previewId}
          onPreviewSeason={(id, options) => {
            setPreviewId(id);
            if (options?.openTab) setPreviewTick((tick) => tick + 1);
          }}
        />
        <p>
          <CmsSaveButton save={save} dirty={dirty} status={status} />
        </p>
      </EditorTabs>
    </>
  );
}
