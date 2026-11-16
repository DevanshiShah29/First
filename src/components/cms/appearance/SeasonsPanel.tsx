"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import {
  createCustomSeason,
  datedWindowEnded,
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
import { SeasonCalendar } from "./SeasonCalendar";
import { SeasonEditor } from "./SeasonEditor";
import { SeasonListRow } from "./SeasonListRow";
import {
  formatZonedDate,
  seasonCountdown,
  seasonName,
  seasonStatusCopy,
  sortSeasonsByNearestDate,
} from "./season-labels";
import { seasonsOverlap } from "./season-timeline";

/**
 * Festive-season master list with a detail editor. The saved Appearance theme stays underneath.
 * @example <SeasonsPanel data={data} setData={setData} />
 */
export function SeasonsPanel({
  data,
  setData,
  previewId,
  previewDate,
  onPreviewSeason,
  onPreviewDate,
}: {
  data: ContentData;
  setData: Dispatch<SetStateAction<ContentData>>;
  previewId?: SeasonConfig["id"] | null;
  previewDate?: string | null;
  onPreviewSeason?: (id: string | null, options?: { openTab?: boolean }) => void;
  onPreviewDate?: (iso: string | null) => void;
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

  const [selectedId, setSelectedId] = useState<SeasonConfig["id"] | null>(
    () => previewId ?? active?.id ?? seasons.items[0]?.id ?? null,
  );
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");

  const canAdd = seasons.items.length < 24;

  const sortedItems = sortSeasonsByNearestDate(seasons.items, parts);

  const overlappingItemIds = new Set<string>();
  const enabledItems = seasons.items.filter((item) => item.enabled);
  for (let i = 0; i < enabledItems.length; i++) {
    for (let j = i + 1; j < enabledItems.length; j++) {
      if (seasonsOverlap(enabledItems[i], enabledItems[j], parts.year)) {
        overlappingItemIds.add(enabledItems[i].id);
        overlappingItemIds.add(enabledItems[j].id);
      }
    }
  }

  /**
   * Replaces the season document on the site draft, sorted by nearest date.
   */
  function update(patch: Partial<SeasonsSettings>) {
    const nextSeasons = { ...seasons, ...patch };
    if (patch.items) {
      nextSeasons.items = sortSeasonsByNearestDate(patch.items, parts);
    }
    setData({
      ...data,
      site: { ...data.site, seasons: nextSeasons },
    });
  }

  /**
   * Replaces one season row.
   */
  function updateItem(id: SeasonConfig["id"], patch: Partial<SeasonConfig>) {
    onPreviewSeason?.(id);
    update({
      items: seasons.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });
  }

  /**
   * Saves a season palette and keeps that season painted in the preview.
   */
  function changePalette(id: SeasonConfig["id"], palette: SeasonPalette) {
    updateItem(id, { palette });
    onPreviewSeason?.(id);
  }

  /**
   * Opens one season beside the list and paints it in the preview.
   */
  function selectSeason(id: SeasonConfig["id"]) {
    setSelectedId(id);
    onPreviewSeason?.(id);
    const editor = document.getElementById("season-editor");
    if (editor) {
      editor.scrollTop = 0;
    }
    if (!window.matchMedia("(max-width: 1100px)").matches) return;
    window.setTimeout(() => {
      if (!editor) return;
      const top = editor.getBoundingClientRect().top;
      if (top >= 0 && top < window.innerHeight) return;
      editor.scrollIntoView({ block: "start" });
    }, 0);
  }

  const selectedItem = seasons.items.find((item) => item.id === selectedId) ?? null;

  /**
   * Opens the inline add form with defaults for the next seven days.
   */
  function beginAdd() {
    if (!canAdd) return;
    const draft = createCustomSeason(new Date(), seasons.timezone);
    setNewName("");
    setNewStart(draft.schedule.kind === "dated" ? draft.schedule.start : "");
    setNewEnd(draft.schedule.kind === "dated" ? draft.schedule.end : "");
    setAdding(true);
  }

  /**
   * Appends a named festival from the inline form and selects it.
   */
  function submitNewFestival() {
    if (!canAdd) return;
    const start = newStart.trim();
    const end = newEnd.trim();
    if (!start || !end || start > end) return;
    const season = createCustomSeason(new Date(), seasons.timezone);
    const next: SeasonConfig = {
      ...season,
      name: newName.trim() || "Festival",
      schedule: { kind: "dated", start, end },
    };
    update({ items: [...seasons.items, next] });
    setAdding(false);
    setNewName("");
    setNewStart("");
    setNewEnd("");
    setSelectedId(next.id);
    onPreviewSeason?.(next.id);
  }

  /**
   * Removes any festival.
   */
  function removeFestival(id: string) {
    update({
      items: seasons.items.filter((item) => item.id !== id),
      manualId: seasons.manualId === id ? null : seasons.manualId,
      deletedIds: [...(seasons.deletedIds ?? []), id],
    });
    if (selectedId === id) setSelectedId(null);
    if (previewId === id) onPreviewSeason?.(null);
  }

  return (
    <>
      <Metabox id="app_seasons" title="Festive seasons" badge={active ? seasonName(active) : "Off"}>
        <div className={`wp-season-toolbar${status.quiet ? " is-quiet" : ""}`}>
          <div className="wp-season-toolbar-status">
            <p className="wp-season-toolbar-title">{status.title}</p>
            <p className="wp-season-toolbar-detail">{status.detail}</p>
          </div>

          <div className="wp-season-toolbar-controls">
            <div className="wp-seg" role="group" aria-label="Season mode">
              {(
                [
                  ["off", "Off"],
                  ["schedule", "Calendar"],
                  ["manual", "Force one"],
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

            {seasons.mode === "manual" ? (
              <label className="wp-season-toolbar-field" htmlFor="season-force">
                <span>Force:</span>
                <select
                  id="season-force"
                  className="wp-select"
                  value={seasons.manualId ?? ""}
                  onChange={(event) => update({ manualId: event.target.value || null })}
                >
                  <option value="">None</option>
                  {seasons.items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {seasonName(item)}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {seasons.mode === "schedule" ? (
              <label className="wp-season-toolbar-field" htmlFor="season-zone">
                <span>Timezone:</span>
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
              </label>
            ) : null}

            <p className="wp-season-toolbar-today">
              Today is {formatZonedDate(parts)}
              <span>{seasons.timezone.replaceAll("_", " ")}</span>
            </p>
          </div>
        </div>

        {seasons.mode === "schedule" && matches.length > 1 ? (
          <p className="wp-season-note">
            More than one season matches today. {seasonName(matches[0])} is the one that shows.
          </p>
        ) : null}

        <div className="wp-season-workspace">
          <div className="wp-season-master">
            <div className="wp-season-master-head">
              <div>
                <h3 className="wp-palette-column-title">Seasons</h3>
                <p className="wp-description">
                  Sorted by nearest date — currently active and upcoming festivals appear first.
                </p>
              </div>
              {adding ? null : (
                <button
                  type="button"
                  className="wp-btn wp-btn-secondary"
                  disabled={!canAdd}
                  onClick={beginAdd}
                >
                  + Add festival
                </button>
              )}
            </div>

            {adding ? (
              <form
                className="wp-season-add-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  submitNewFestival();
                }}
              >
                <label className="wp-season-add-field">
                  Name
                  <input
                    className="wp-input"
                    value={newName}
                    maxLength={60}
                    placeholder="Festival"
                    autoFocus
                    required
                    onChange={(event) => setNewName(event.target.value)}
                  />
                </label>
                <label className="wp-season-add-field">
                  Starts
                  <input
                    className="wp-input"
                    type="date"
                    value={newStart}
                    required
                    onChange={(event) => setNewStart(event.target.value)}
                  />
                </label>
                <label className="wp-season-add-field">
                  Ends
                  <input
                    className="wp-input"
                    type="date"
                    value={newEnd}
                    required
                    onChange={(event) => setNewEnd(event.target.value)}
                  />
                </label>
                <div className="wp-season-add-actions">
                  <button
                    type="submit"
                    className="wp-btn wp-btn-primary"
                    disabled={!newStart.trim() || !newEnd.trim() || newStart.trim() > newEnd.trim()}
                  >
                    Add festival
                  </button>
                  <button type="button" className="wp-btn" onClick={() => setAdding(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : null}

            <ul className="wp-season-list">
              {sortedItems.map((item, index) => {
                const covered =
                  seasons.mode === "schedule" &&
                  active &&
                  active.id !== item.id &&
                  matches.some((match) => match.id === item.id);
                const hasDateOverlap = item.enabled && overlappingItemIds.has(item.id);
                const isOverlapping = Boolean(covered || hasDateOverlap);
                const forcedWhileOff =
                  seasons.mode === "manual" && active?.id === item.id && !item.enabled;
                const notice = forcedWhileOff
                  ? "Forced on, so the switch is ignored until you follow the calendar."
                  : covered && active
                    ? `${seasonName(active)} is higher, so it wins today.`
                    : null;
                return (
                  <SeasonListRow
                    key={item.id}
                    item={item}
                    rank={index + 1}
                    selected={selectedId === item.id}
                    showing={active?.id === item.id}
                    ended={datedWindowEnded(item, parts)}
                    previewing={previewId === item.id}
                    previewDate={previewDate ?? null}
                    notice={notice}
                    countdown={seasonCountdown(item, parts)}
                    overlap={isOverlapping}
                    today={parts}
                    onSelect={() => selectSeason(item.id)}
                    onToggle={(enabled) => updateItem(item.id, { enabled })}
                    onPreview={() => onPreviewSeason?.(item.id, { openTab: true })}
                  />
                );
              })}
            </ul>

            <details className="wp-season-overview">
              <summary className="wp-season-overview-summary">
                <span className="wp-season-overview-title">
                  <svg
                    className="wp-season-overview-chevron"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  Year overview
                </span>
                <span className="wp-season-overview-hint">Windows in {parts.year}</span>
              </summary>
              <SeasonCalendar
                items={seasons.items}
                parts={parts}
                previewDate={previewDate ?? null}
                onPreviewDate={(iso) => onPreviewDate?.(iso)}
              />
            </details>
          </div>

          <div className="wp-season-detail" id="season-editor">
            {selectedItem ? (
              <SeasonEditor
                item={selectedItem}
                ornaments={seasons.ornaments ?? []}
                ended={datedWindowEnded(selectedItem, parts)}
                year={parts.year}
                rank={sortedItems.findIndex((item) => item.id === selectedItem.id) + 1}
                totalCount={sortedItems.length}
                data={data}
                setData={setData}
                onChange={(patch) => updateItem(selectedItem.id, patch)}
                onPalette={(palette) => changePalette(selectedItem.id, palette)}
                onClose={() => setSelectedId(null)}
                onPreview={() => onPreviewSeason?.(selectedItem.id, { openTab: true })}
                onRemove={() => removeFestival(selectedItem.id)}
              />
            ) : (
              <div className="wp-season-detail-empty">
                <p className="wp-palette-column-title">No season selected</p>
                <p className="wp-description">
                  Pick a season from the list to edit its dates, palette, and ornaments.
                </p>
              </div>
            )}
          </div>
        </div>
      </Metabox>
    </>
  );
}
