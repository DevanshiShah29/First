"use client";

import { useId, useState } from "react";
import { ornamentPlacementCopy } from "@/content/season-layout";
import { getSeasonPreset } from "@/content/season-presets";
import {
  defaultSeasonPalette,
  type SeasonConfig,
  type SeasonOrnament,
  type SeasonPalette,
  type SeasonSchedule,
} from "@/content/seasons";
import { EditablePalette, PaletteColorRow } from "./EditablePalette";
import { ConfirmButton } from "../components/ConfirmDialog";
import { SeasonAiPanel } from "./SeasonAiPanel";
import { SeasonOrnamentPicker } from "./SeasonOrnamentPicker";
import { seasonName } from "./season-labels";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type EditorTab = "dates" | "palette" | "ornaments";

const EDITOR_TABS: { id: EditorTab; label: string }[] = [
  { id: "dates", label: "Dates" },
  { id: "palette", label: "Palette" },
  { id: "ornaments", label: "Ornaments" },
];

/** Adds one year to a YYYY-MM-DD date. */
function shiftYear(iso: string): string {
  return `${Number(iso.slice(0, 4)) + 1}${iso.slice(4)}`;
}

/**
 * Dates, palette, and ornaments for the season selected in the master list.
 * Panels stay mounted while hidden so switching tabs keeps local drafts.
 * @example <SeasonEditor item={item} … onOpenCatalog={openCatalog} />
 */
export function SeasonEditor({
  item,
  ornaments,
  ended,
  year,
  onChange,
  onPalette,
  onImages,
  onClose,
  onPreview,
  onOpenCatalog,
  onRemove,
}: {
  item: SeasonConfig;
  ornaments: SeasonOrnament[];
  ended: boolean;
  year: number;
  onChange: (patch: Partial<SeasonConfig>) => void;
  onPalette: (palette: SeasonPalette) => void;
  onImages: (images: string[]) => void;
  onClose: () => void;
  onPreview: () => void;
  onOpenCatalog: () => void;
  onRemove?: () => void;
}) {
  const preset = getSeasonPreset(item.id);
  const name = seasonName(item);
  const inverted = item.schedule.kind === "dated" && item.schedule.start > item.schedule.end;
  const [tab, setTab] = useState<EditorTab>("dates");
  const [aiNotes, setAiNotes] = useState<Record<string, string>>({});
  const tabId = useId();
  const aiNote = aiNotes[item.id] ?? "";

  /**
   * Rolls a dated window one year forward so it can run again.
   * @example moveToNextYear() // void
   */
  const moveToNextYear = () => {
    if (item.schedule.kind !== "dated") return;
    onChange({
      schedule: {
        kind: "dated",
        start: shiftYear(item.schedule.start),
        end: shiftYear(item.schedule.end),
      },
    });
  };

  return (
    <section className="wp-season-editor" aria-label={`Edit ${name}`}>
      <div className="wp-season-editor-head">
        <div>
          <h3 className="wp-theme-card-name">Edit {name}</h3>
          <p className="wp-theme-card-desc">
            {preset ? preset.description : "Set the name, dates, colors, and ornament images. Save to publish."}
          </p>
        </div>
        <div className="wp-theme-card-actions">
          <button type="button" className="wp-btn wp-btn-small" onClick={onPreview}>
            Preview
          </button>
          <button type="button" className="wp-btn wp-btn-small" onClick={onClose}>
            Close
          </button>
          {onRemove ? (
            <ConfirmButton
              className="wp-btn wp-btn-small wp-btn-danger-outline"
              title={`Delete ${name}?`}
              confirmLabel="Delete"
              onConfirm={onRemove}
            >
              Delete
            </ConfirmButton>
          ) : null}
        </div>
      </div>

      <div className="wp-editor-tablist wp-season-editor-tabs" role="tablist" aria-label="Season editor sections">
        {EDITOR_TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            id={`${tabId}-${entry.id}-tab`}
            aria-selected={tab === entry.id}
            aria-controls={`${tabId}-${entry.id}-panel`}
            tabIndex={tab === entry.id ? 0 : -1}
            className={`wp-editor-tab${tab === entry.id ? " is-active" : ""}`}
            onClick={() => setTab(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`${tabId}-dates-panel`}
        aria-labelledby={`${tabId}-dates-tab`}
        className="wp-season-editor-panel"
        hidden={tab !== "dates"}
      >
        {preset ? null : (
          <label className="wp-season-name">
            Name
            <input
              className="wp-input"
              value={item.name}
              maxLength={60}
              placeholder="Festival"
              aria-label="Festival name"
              onChange={(event) => onChange({ name: event.target.value })}
            />
          </label>
        )}

        {preset ? null : (
          <fieldset className="wp-media-choice">
            <legend>Dates</legend>
            <div className="wp-seg">
              {(
                [
                  ["annual", "Every year"],
                  ["dated", "These dates"],
                ] as const
              ).map(([kind, label]) => (
                <label key={kind} className={item.schedule.kind === kind ? "is-selected" : undefined}>
                  <input
                    type="radio"
                    name={`season-dates-${item.id}`}
                    checked={item.schedule.kind === kind}
                    onChange={() => onChange({ schedule: scheduleOfKind(item.schedule, kind, year) })}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {item.schedule.kind === "annual" ? (
          <AnnualDates
            start={item.schedule.start}
            end={item.schedule.end}
            onChange={(start, end) => onChange({ schedule: { kind: "annual", start, end } })}
          />
        ) : (
          <div className="wp-season-dates">
            <label>
              Starts
              <input
                className="wp-input"
                type="date"
                value={item.schedule.start}
                onChange={(event) =>
                  onChange({
                    schedule: { kind: "dated", start: event.target.value, end: item.schedule.end },
                  })
                }
              />
            </label>
            <label>
              Ends
              <input
                className="wp-input"
                type="date"
                value={item.schedule.end}
                onChange={(event) =>
                  onChange({
                    schedule: { kind: "dated", start: item.schedule.start, end: event.target.value },
                  })
                }
              />
            </label>
          </div>
        )}
        {inverted ? (
          <p className="wp-season-note is-inline">End is before start, so this season cannot match.</p>
        ) : null}
        {ended ? (
          <p className="wp-season-note is-inline">
            This window has ended.{" "}
            <button type="button" className="wp-btn wp-btn-small" onClick={moveToNextYear}>
              Move to next year
            </button>
          </p>
        ) : null}
      </div>

      <div
        role="tabpanel"
        id={`${tabId}-palette-panel`}
        aria-labelledby={`${tabId}-palette-tab`}
        className="wp-season-editor-panel"
        hidden={tab !== "palette"}
      >
        <p className="wp-description">
          Change a hex value or its color picker. The public site uses these colors only while this season
          is showing.
        </p>
        <div className="wp-palette-columns">
          <section className="wp-palette-column" aria-label="Brand colors">
            <h3 className="wp-palette-column-title">Brand colors</h3>
            <div className="wp-palette-rows">
              <PaletteColorRow
                label="Brand from"
                fieldKey="brandFrom"
                value={item.palette.brandFrom}
                onChange={(brandFrom) => onPalette({ ...item.palette, brandFrom })}
              />
              <PaletteColorRow
                label="Brand to"
                fieldKey="brandTo"
                value={item.palette.brandTo}
                onChange={(brandTo) => onPalette({ ...item.palette, brandTo })}
              />
            </div>
          </section>
        </div>
        <EditablePalette
          light={item.palette.light}
          dark={item.palette.dark}
          onChange={(mode, next) => onPalette({ ...item.palette, [mode]: next })}
        />
        <div className="wp-theme-edit-actions">
          <button type="button" className="wp-btn wp-btn-small" onClick={() => onPalette(defaultSeasonPalette(item.id))}>
            Reset palette
          </button>
        </div>
        <div className="wp-season-editor-sep">
          <SeasonAiPanel
            key={item.id}
            item={item}
            note={aiNote}
            onNote={(note) =>
              setAiNotes((current) => ({ ...current, [item.id]: note }))
            }
            onApply={onPalette}
          />
        </div>
      </div>

      <div
        role="tabpanel"
        id={`${tabId}-ornaments-panel`}
        aria-labelledby={`${tabId}-ornaments-tab`}
        className="wp-season-editor-panel"
        hidden={tab !== "ornaments"}
      >
        <fieldset className="wp-media-choice">
          <legend>Look</legend>
          <div className="wp-seg">
            {(
              [
                ["subtle", "Palette only"],
                ["full", "Palette and ornaments"],
              ] as const
            ).map(([intensity, label]) => (
              <label key={intensity} className={item.intensity === intensity ? "is-selected" : undefined}>
                <input
                  type="radio"
                  name={`season-intensity-${item.id}`}
                  checked={item.intensity === intensity}
                  onChange={() => onChange({ intensity })}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="wp-season-catalog-link">
          <p className="wp-description">{ornamentPlacementCopy(item.id)}</p>
          <p className="wp-description">
            Pick images from the shared catalog. Upload or rename them once, then reuse them here.
          </p>
          <button type="button" className="wp-btn wp-btn-small" onClick={onOpenCatalog}>
            Manage catalog
          </button>
        </div>
        <SeasonOrnamentPicker
          images={item.ornamentImages}
          ornaments={ornaments}
          cursorOrnament={item.cursorOrnament ?? null}
          onImages={onImages}
          onCursorOrnament={(cursorOrnament) => onChange({ cursorOrnament })}
        />
      </div>
    </section>
  );
}

/**
 * Month and day fields for a repeating window.
 * @example <AnnualDates start="12-20" end="12-26" onChange={set} />
 */
function AnnualDates({
  start,
  end,
  onChange,
}: {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
}) {
  return (
    <div className="wp-season-dates">
      <MonthDay label="Starts" value={start} onChange={(next) => onChange(next, end)} />
      <MonthDay label="Ends" value={end} onChange={(next) => onChange(start, next)} />
    </div>
  );
}

/**
 * One MM-DD split into month and day selects.
 * @example <MonthDay label="Starts" value="10-25" onChange={set} />
 */
function MonthDay({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const month = Number(value.slice(0, 2));
  const day = Number(value.slice(3, 5));
  const max = daysInMonth(month);
  return (
    <label>
      {label}
      <span className="wp-season-dates">
        <select
          className="wp-select"
          aria-label={`${label} month`}
          value={month}
          onChange={(event) => {
            const nextMonth = Number(event.target.value);
            onChange(joinMonthDay(nextMonth, Math.min(day, daysInMonth(nextMonth))));
          }}
        >
          {MONTHS.map((name, index) => (
            <option key={name} value={index + 1}>
              {name}
            </option>
          ))}
        </select>
        <select
          className="wp-select"
          aria-label={`${label} day`}
          value={Math.min(day, max)}
          onChange={(event) => onChange(joinMonthDay(month, Number(event.target.value)))}
        >
          {Array.from({ length: max }, (_, index) => index + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
}

/**
 * February keeps leap day so an annual window can include it.
 * @example daysInMonth(2) // 29
 */
function daysInMonth(month: number): number {
  if (month === 2) return 29;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

/**
 * Pads a month-day pair.
 * @example joinMonthDay(12, 5) // "12-05"
 */
function joinMonthDay(month: number, day: number): string {
  return `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Switches a window between a repeating month-day and a dated year.
 * @example scheduleOfKind(schedule, "annual", 2026) // SeasonSchedule
 */
function scheduleOfKind(schedule: SeasonSchedule, kind: SeasonSchedule["kind"], year: number): SeasonSchedule {
  if (schedule.kind === kind) return schedule;
  if (kind === "annual") {
    return { kind: "annual", start: schedule.start.slice(5), end: schedule.end.slice(5) };
  }
  return { kind: "dated", start: `${year}-${schedule.start}`, end: `${year}-${schedule.end}` };
}
