"use client";

import { useEffect, useRef, useState } from "react";
import {
  createCustomSeason,
  datedWindowEnded,
  isCustomSeasonId,
  MAX_CUSTOM_SEASONS,
  resolveActiveSeason,
  SEASON_TIMEZONES,
  seasonsMatchingToday,
  zonedDateParts,
  type SeasonConfig,
  type SeasonPalette,
  type SeasonsSettings,
} from "@/content/seasons";
import type { ContentData } from "@/content/types";
import { Metabox } from "../components/Metabox";
import { SeasonAiPanel } from "./SeasonAiPanel";
import { SeasonEditor } from "./SeasonEditor";
import { SeasonSummaryCard } from "./SeasonSummaryCard";
import { formatZonedDate, seasonName, seasonStatusCopy } from "./season-labels";

/**
 * Festive-season controls. The saved Appearance theme stays underneath.
 * @example <SeasonsPanel data={data} setData={setData} />
 */
export function SeasonsPanel({
  data,
  setData,
  previewId,
  onPreviewSeason,
}: {
  data: ContentData;
  setData: (data: ContentData) => void;
  previewId?: SeasonConfig["id"] | null;
  onPreviewSeason?: (id: string | null, options?: { openTab?: boolean }) => void;
}) {
  const seasons = data.site.seasons;
  const now = new Date();
  const parts = zonedDateParts(now, seasons.timezone);
  const active = resolveActiveSeason(seasons, now);
  const matches = seasonsMatchingToday(seasons, now);
  const status = seasonStatusCopy(seasons.mode, active);
  const zones = SEASON_TIMEZONES.includes(seasons.timezone as (typeof SEASON_TIMEZONES)[number])
    ? [...SEASON_TIMEZONES]
    : [seasons.timezone, ...SEASON_TIMEZONES];
  const [openId, setOpenId] = useState<SeasonConfig["id"] | null>(null);
  const [aiId, setAiId] = useState<SeasonConfig["id"]>(seasons.items[0]?.id ?? "halloween");
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openId) return;
    editorRef.current?.scrollIntoView({ block: "nearest" });
  }, [openId]);

  /**
   * Replaces the season document on the site draft.
   * @example update({ mode: "off" }) // void
   */
  function update(patch: Partial<SeasonsSettings>) {
    setData({
      ...data,
      site: { ...data.site, seasons: { ...seasons, ...patch } },
    });
  }

  /**
   * Replaces one season card.
   * @example updateItem("diwali", { enabled: false }) // void
   */
  function updateItem(id: SeasonConfig["id"], patch: Partial<SeasonConfig>) {
    update({
      items: seasons.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });
  }

  /**
   * Saves a season palette and keeps that season painted in the preview.
   * @example changePalette("halloween", palette) // void
   */
  function changePalette(id: SeasonConfig["id"], palette: SeasonPalette) {
    updateItem(id, { palette });
    onPreviewSeason?.(id);
  }

  /**
   * Saves ornament images and keeps that season painted in the preview.
   * @example changeImages("diwali", ["/bat.png"]) // void
   */
  function changeImages(id: SeasonConfig["id"], ornamentImages: string[]) {
    updateItem(id, { ornamentImages });
    onPreviewSeason?.(id);
  }

  const openItem = seasons.items.find((item) => item.id === openId) ?? null;
  const aiTargetId = openId ?? aiId;
  const customCount = seasons.items.filter((item) => isCustomSeasonId(item.id)).length;

  /**
   * Appends an unnamed festival and opens it.
   * @example addFestival() // void
   */
  function addFestival() {
    if (customCount >= MAX_CUSTOM_SEASONS) return;
    const season = createCustomSeason(new Date(), seasons.timezone);
    update({ items: [...seasons.items, season] });
    setAiId(season.id);
    setOpenId(season.id);
    onPreviewSeason?.(season.id);
  }

  /**
   * Removes an added festival. Built-in seasons stay.
   * @example removeFestival("fest-ab12cd34ef56") // void
   */
  function removeFestival(id: string) {
    if (!isCustomSeasonId(id)) return;
    update({
      items: seasons.items.filter((item) => item.id !== id),
      manualId: seasons.manualId === id ? null : seasons.manualId,
    });
    if (openId === id) setOpenId(null);
    if (previewId === id) onPreviewSeason?.(null);
    if (aiId === id) setAiId(seasons.items.find((item) => item.id !== id)?.id ?? "halloween");
  }

  /**
   * Points Generate with AI at a season. An open editor follows that choice.
   * @example chooseSeason("christmas") // void
   */
  function chooseSeason(id: SeasonConfig["id"]) {
    setAiId(id);
    if (!openId) return;
    setOpenId(id);
    onPreviewSeason?.(id);
  }

  /**
   * Writes a generated palette onto one season and opens it.
   * @example applyGenerated("diwali", palette) // void
   */
  function applyGenerated(id: SeasonConfig["id"], palette: SeasonPalette) {
    updateItem(id, { palette });
    setAiId(id);
    setOpenId(id);
    onPreviewSeason?.(id);
  }

  return (
    <Metabox id="app_seasons" title="Festive seasons" badge={active ? seasonName(active) : "Off"}>
      <div className={`wp-season-status${status.quiet ? " is-quiet" : ""}`}>
        <div>
          <p className="wp-season-status-title">{status.title}</p>
          <p className="wp-season-status-detail">{status.detail}</p>
        </div>
        <p className="wp-season-status-today">
          Today is {formatZonedDate(parts)}
          <span>{seasons.timezone.replaceAll("_", " ")}</span>
        </p>
      </div>

      <fieldset className="wp-media-choice">
        <legend>When</legend>
        <div className="wp-seg">
          {(
            [
              ["off", "Off"],
              ["schedule", "Follow the calendar"],
              ["manual", "Force one season"],
            ] as const
          ).map(([mode, label]) => (
            <label key={mode} className={seasons.mode === mode ? "is-selected" : undefined}>
              <input
                type="radio"
                name="seasonMode"
                checked={seasons.mode === mode}
                onChange={() => update({ mode })}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {seasons.mode === "manual" ? (
        <div className="wp-season-field">
          <label htmlFor="season-force">Force</label>
          <select
            id="season-force"
            className="wp-select"
            value={seasons.manualId ?? ""}
            onChange={(event) =>
              update({ manualId: event.target.value || null })
            }
          >
            <option value="">None</option>
            {seasons.items.map((item) => (
              <option key={item.id} value={item.id}>
                {seasonName(item)}
              </option>
            ))}
          </select>
          <span className="wp-description">Ignores the dates. The calendar still uses the on/off switch.</span>
        </div>
      ) : null}

      {seasons.mode === "schedule" ? (
        <div className="wp-season-field">
          <label htmlFor="season-zone">Timezone</label>
          <select
            id="season-zone"
            className="wp-select"
            value={seasons.timezone}
            onChange={(event) => update({ timezone: event.target.value })}
          >
            {zones.map((zone) => (
              <option key={zone} value={zone}>
                {zone.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <span className="wp-description">Dates are read in this timezone. The first matching card is the one that shows.</span>
        </div>
      ) : null}

      {seasons.mode === "schedule" && matches.length > 1 ? (
        <p className="wp-season-note">
          More than one season matches today. {seasonName(matches[0])} is the one that shows.
        </p>
      ) : null}

      <SeasonAiPanel
        items={seasons.items}
        selectedId={aiTargetId}
        onSelect={chooseSeason}
        onApply={applyGenerated}
      />

      <div className="wp-season-add">
        <button
          type="button"
          className="wp-btn wp-btn-primary"
          disabled={customCount >= MAX_CUSTOM_SEASONS}
          onClick={addFestival}
        >
          Add festival
        </button>
        <p className="wp-description">
          {customCount >= MAX_CUSTOM_SEASONS
            ? `${MAX_CUSTOM_SEASONS} added festivals is the limit.`
            : "Name, dates, colors, and ornament images. Save to publish."}
        </p>
      </div>

      <div className="wp-season-grid">
        {seasons.items.map((item) => {
          const covered =
            seasons.mode === "schedule" &&
            active &&
            active.id !== item.id &&
            matches.some((match) => match.id === item.id);
          const forcedWhileOff = seasons.mode === "manual" && active?.id === item.id && !item.enabled;
          const notice = forcedWhileOff
            ? "Forced on, so the switch is ignored until you follow the calendar."
            : covered && active
              ? `${seasonName(active)} is ahead of this one today.`
              : null;
          return (
            <SeasonSummaryCard
              key={item.id}
              item={item}
              showing={active?.id === item.id}
              ended={datedWindowEnded(item, parts)}
              open={openId === item.id}
              previewing={previewId === item.id}
              notice={notice}
              onToggle={(enabled) => updateItem(item.id, { enabled })}
              onEdit={() => {
                const next = openId === item.id ? null : item.id;
                setOpenId(next);
                if (next) {
                  setAiId(next);
                  onPreviewSeason?.(next);
                }
              }}
              onPreview={() => onPreviewSeason?.(item.id, { openTab: true })}
            />
          );
        })}
      </div>

      {openItem ? (
        <div ref={editorRef}>
          <SeasonEditor
            item={openItem}
            ended={datedWindowEnded(openItem, parts)}
            year={parts.year}
            onChange={(patch) => updateItem(openItem.id, patch)}
            onPalette={(palette) => changePalette(openItem.id, palette)}
            onImages={(images) => changeImages(openItem.id, images)}
            onClose={() => setOpenId(null)}
            onPreview={() => onPreviewSeason?.(openItem.id, { openTab: true })}
            onRemove={isCustomSeasonId(openItem.id) ? () => removeFestival(openItem.id) : undefined}
          />
        </div>
      ) : null}
    </Metabox>
  );
}
