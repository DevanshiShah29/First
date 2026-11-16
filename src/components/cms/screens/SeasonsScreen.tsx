"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { ContentData } from "@/content/types";
import { resolveActiveSeason, seasonForIsoDate } from "@/content/seasons";
import { SeasonOrnamentCatalog } from "../appearance/SeasonOrnamentCatalog";
import { SeasonRenderSummary } from "../appearance/SeasonRenderSummary";
import { SeasonsPanel } from "../appearance/SeasonsPanel";
import { CmsSaveButton, type CmsSaveStatus } from "../components/CmsSaveButton";
import { Metabox } from "../components/Metabox";
import { LivePreviewShell } from "../preview/LivePreviewShell";
import {
  samePreviewSummary,
  type PreviewSeasonSummary,
  type PreviewViewport,
} from "../preview/preview-summary";

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
  return withManualSeason(data, resolveActiveSeason(data.site.seasons, new Date())?.id ?? null);
}

/**
 * Festive seasons CMS screen. The year-round theme stays on Appearance.
 * Editing and the live preview stay side by side at wide widths.
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
  const activeSeason = resolveActiveSeason(data.site.seasons, new Date());
  const [previewId, setPreviewId] = useState<string | null>(
    () => data.site.seasons.manualId ?? activeSeason?.id ?? data.site.seasons.items[0]?.id ?? null,
  );
  const [previewDate, setPreviewDate] = useState<string | null>(null);
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport>("desktop");
  const [renderSummary, setRenderSummary] = useState<PreviewSeasonSummary | null>(null);
  const previewViewportRef = useRef(previewViewport);
  useEffect(() => {
    previewViewportRef.current = previewViewport;
  }, [previewViewport]);

  const previewData = useMemo(
    () => withPreview(data, previewId, previewDate),
    [data, previewId, previewDate],
  );

  const previewSeason = useMemo(() => {
    if (previewId) return data.site.seasons.items.find((item) => item.id === previewId) ?? null;
    if (previewDate) return seasonForIsoDate(data.site.seasons, previewDate);
    return resolveActiveSeason(data.site.seasons, new Date());
  }, [data.site.seasons, previewId, previewDate]);

  const seasonSummary =
    renderSummary &&
    previewSeason &&
    renderSummary.seasonId === previewSeason.id &&
    renderSummary.viewport === previewViewport
      ? renderSummary
      : null;

  /**
   * Keeps the editor summary in sync with the rendered iframe without render loops.
   * A late report from an unmounted device frame is ignored using the latest width.
   */
  const handleRendered = useCallback((next: PreviewSeasonSummary) => {
    if (next.viewport !== previewViewportRef.current) return;
    setRenderSummary((current) => (samePreviewSummary(current, next) ? current : next));
  }, []);

  /**
   * Brings the split preview into view when its own Preview button is used on a narrow screen.
   */
  const focusPreview = useCallback(() => {
    if (!window.matchMedia("(max-width: 1180px)").matches) return;
    document.getElementById("season-preview")?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, []);

  return (
    <>
      <h1 className="wp-screen-title">Seasons</h1>
      <p className="wp-sub">
        Festive themes sit on top of the Appearance theme during holidays or custom dates.
        Pick a season to edit its dates, color palette, and ornaments.
      </p>
      <SeasonsPanel
        data={data}
        setData={setData}
        renderSummary={seasonSummary}
        previewId={previewId}
        previewDate={previewDate}
        catalogue={
          <>
            <Metabox id="season_ornament_catalog" title="Ornament catalogue">
              <SeasonOrnamentCatalog data={data} setData={setData} />
            </Metabox>
            <p className="wp-season-save-bar">
              <CmsSaveButton save={save} dirty={dirty} status={status} />
            </p>
          </>
        }
        preview={
          <div id="season-preview" className="wp-season-preview">
            <LivePreviewShell
              data={previewData}
              dirty={dirty}
              section="seasons"
              viewport={previewViewport}
              onViewportChange={(next) => {
                setRenderSummary(null);
                setPreviewViewport(next);
              }}
              onRendered={handleRendered}
            />
            <SeasonRenderSummary season={previewSeason} summary={seasonSummary} />
          </div>
        }
        onPreviewSeason={(id, options) => {
          setPreviewId(id);
          if (id) setPreviewDate(null);
          if (options?.openTab) focusPreview();
        }}
        onPreviewDate={(iso) => {
          setPreviewDate(iso);
          if (iso) setPreviewId(null);
        }}
      />
      <p className="wp-season-save-bar">
        <CmsSaveButton save={save} dirty={dirty} status={status} />
      </p>
    </>
  );
}
