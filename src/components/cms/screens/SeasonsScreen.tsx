"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import type { ContentData } from "@/content/types";
import { seasonForIsoDate } from "@/content/seasons";
import { SeasonsPanel } from "../appearance/SeasonsPanel";
import { CmsSaveButton, type CmsSaveStatus } from "../components/CmsSaveButton";
import { EditorTabs } from "../preview/EditorTabs";
import { LivePreviewShell } from "../preview/LivePreviewShell";

/**
 * Forces one season (or the year-round theme) without changing the saved schedule.
 * @example withManualSeason(data, "diwali") // ContentData
 */
function withManualSeason(data: ContentData, manualId: string | null): ContentData {
  return {
    ...data,
    site: {
      ...data.site,
      seasons: { ...data.site.seasons, mode: "manual", manualId },
    },
  };
}

/**
 * Preview copy for the current selection: a forced season, a date, or live today.
 * A date resolves what the calendar would pick on that day in the season timezone.
 * @example withPreview(data, null, "2026-12-25") // ContentData
 */
function withPreview(data: ContentData, previewId: string | null, previewDate: string | null): ContentData {
  if (previewId) return withManualSeason(data, previewId);
  if (previewDate) {
    const resolved = seasonForIsoDate(data.site.seasons, previewDate);
    return withManualSeason(data, resolved?.id ?? null);
  }
  return data;
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
  setData: Dispatch<SetStateAction<ContentData>>;
  save: () => Promise<void>;
  dirty: boolean;
  status: CmsSaveStatus;
}) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewDate, setPreviewDate] = useState<string | null>(null);
  const [previewTick, setPreviewTick] = useState(0);
  const previewData = useMemo(
    () => withPreview(data, previewId, previewDate),
    [data, previewId, previewDate],
  );

  return (
    <>
      <h1 className="wp-screen-title">Seasons</h1>
      <p className="wp-sub">
        Halloween, Diwali, and Christmas sit on top of the Appearance theme. Add a festival for any
        other dates. Pick a season to edit its dates, palette, and ornaments. Preview paints that
        season or a chosen date without changing the saved schedule. Shared ornament images live in
        the Ornaments tab of any season.
      </p>
      <EditorTabs
        previewTick={previewTick}
        preview={<LivePreviewShell data={previewData} dirty={dirty} section="seasons" />}
      >
        <SeasonsPanel
          data={data}
          setData={setData}
          previewId={previewId}
          previewDate={previewDate}
          onPreviewSeason={(id, options) => {
            setPreviewId(id);
            if (id) setPreviewDate(null);
            if (options?.openTab) setPreviewTick((tick) => tick + 1);
          }}
          onPreviewDate={(iso) => {
            setPreviewDate(iso);
            if (iso) setPreviewId(null);
          }}
        />
        <p>
          <CmsSaveButton save={save} dirty={dirty} status={status} />
        </p>
      </EditorTabs>
    </>
  );
}
