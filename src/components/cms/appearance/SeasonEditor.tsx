"use client";

import { useId, useState, type Dispatch, type SetStateAction } from "react";
import { getSeasonPreset } from "@/content/season-presets";
import {
  defaultSeasonPalette,
  type SeasonConfig,
  type SeasonOrnament,
  type SeasonPalette,
  type SeasonSchedule,
} from "@/content/seasons";
import type { ContentData } from "@/content/types";
import { EditablePalette, PaletteColorRow } from "./EditablePalette";
import { ConfirmButton } from "../components/ConfirmDialog";
import type { PreviewSeasonSummary } from "../preview/preview-summary";
import { SeasonAiPanel } from "./SeasonAiPanel";
import { SeasonPlacementEditor } from "./SeasonPlacementEditor";
import { SeasonCatalogDrawer } from "./SeasonCatalogDrawer";
import { scheduleSummary, seasonName } from "./season-labels";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type EditorTab = "schedule" | "appearance" | "decorations";

const EDITOR_TABS: { id: EditorTab; label: string }[] = [
  { id: "schedule", label: "Schedule" },
  { id: "appearance", label: "Appearance" },
  { id: "decorations", label: "Decorations" },
];

/** Adds one year to a YYYY-MM-DD date. */
function shiftYear(iso: string): string {
  return `${Number(iso.slice(0, 4)) + 1}${iso.slice(4)}`;
}

type DateValidationResult = {
  isValid: boolean;
  status: "valid" | "error" | "warning";
  message: string;
  diffDays?: number;
};

/**
 * Validates the season schedule dates and returns user-friendly feedback.
 */
function validateSeasonDates(schedule: SeasonSchedule, ended: boolean): DateValidationResult {
  if (schedule.kind === "dated") {
    if (!schedule.start || !schedule.end) {
      return {
        isValid: false,
        status: "error",
        message: "Start and end dates are required.",
      };
    }
    if (schedule.start > schedule.end) {
      return {
        isValid: false,
        status: "error",
        message: "End date cannot be earlier than start date. This season cannot be activated.",
      };
    }
    const startD = new Date(schedule.start + "T00:00:00");
    const endD = new Date(schedule.end + "T00:00:00");
    const diffDays = Math.round((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (ended) {
      return {
        isValid: true,
        status: "warning",
        message: `Date window ended in the past (${diffDays} ${diffDays === 1 ? "day" : "days"}). Move to next year to reactivate.`,
        diffDays,
      };
    }
    return {
      isValid: true,
      status: "valid",
      message: `Valid date window: ${diffDays} ${diffDays === 1 ? "day" : "days"} (${schedule.start} to ${schedule.end}).`,
      diffDays,
    };
  }

  // Annual
  const startMonth = Number(schedule.start.slice(0, 2));
  const startDay = Number(schedule.start.slice(3, 5));
  const endMonth = Number(schedule.end.slice(0, 2));
  const endDay = Number(schedule.end.slice(3, 5));

  if (!startMonth || !startDay || !endMonth || !endDay) {
    return {
      isValid: false,
      status: "error",
      message: "Please choose valid annual start and end dates.",
    };
  }

  if (schedule.start === schedule.end) {
    return {
      isValid: true,
      status: "valid",
      message: `Valid annual schedule: Active for 1 day every year (${scheduleSummary(schedule)}).`,
    };
  }

  if (schedule.start > schedule.end) {
    return {
      isValid: true,
      status: "valid",
      message: `Valid annual schedule: Spans across New Year (${scheduleSummary(schedule)}).`,
    };
  }

  return {
    isValid: true,
    status: "valid",
    message: `Valid annual schedule: Repeats every year (${scheduleSummary(schedule)}).`,
  };
}

/**
 * Right panel: Schedule, Appearance, and Decorations for the selected season.
 * Panels stay mounted while hidden so switching tabs keeps local drafts.
 * @example <SeasonEditor item={item} ornaments={ornaments} … />
 */
export function SeasonEditor({
  item,
  ornaments,
  ended,
  year,
  rank,
  totalCount,
  data,
  setData,
  renderSummary,
  onOpenCatalog,
  onChange,
  onPalette,
  onClose,
  onPreview,
  onRemove,
}: {
  item: SeasonConfig;
  ornaments: SeasonOrnament[];
  ended: boolean;
  year: number;
  rank?: number;
  totalCount?: number;
  data?: ContentData;
  setData?: Dispatch<SetStateAction<ContentData>>;
  renderSummary?: PreviewSeasonSummary | null;
  onOpenCatalog?: () => void;
  onChange: (patch: Partial<SeasonConfig>) => void;
  onPalette: (palette: SeasonPalette) => void;
  onClose: () => void;
  onPreview: () => void;
  onRemove?: () => void;
}) {
  const preset = getSeasonPreset(item.id);
  const name = seasonName(item);
  const [tab, setTab] = useState<EditorTab>("schedule");
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [aiNotes, setAiNotes] = useState<Record<string, string>>({});
  const tabId = useId();
  const aiNote = aiNotes[item.id] ?? "";

  const validation = validateSeasonDates(item.schedule, ended);
  const configuredGroups = (item.placements ?? []).filter((group) => group.assets.length > 0).length;

  /**
   * Rolls a dated window one year forward so it can run again.
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

  /**
   * Opens the asset catalog drawer or notifies parent.
   */
  const handleOpenCatalog = () => {
    if (onOpenCatalog) {
      onOpenCatalog();
    } else {
      setCatalogOpen(true);
    }
  };

  return (
    <section className="wp-season-editor" aria-label={`Edit ${name}`}>
      <div className="wp-season-editor-head">
        <div>
          <h3 className="wp-theme-card-name">Edit {name}</h3>
          <p className="wp-theme-card-desc">
            {preset
              ? preset.description
              : "Set the name, dates, colors, and ornament images. Save to publish."}
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

      <div
        className="wp-editor-tablist wp-season-editor-tabs"
        role="tablist"
        aria-label="Season editor sections"
      >
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

      {/* Tab 1: Schedule */}
      <div
        role="tabpanel"
        id={`${tabId}-schedule-panel`}
        aria-labelledby={`${tabId}-schedule-tab`}
        className="wp-season-editor-panel"
        hidden={tab !== "schedule"}
      >
        <label className="wp-season-name">
          Festival name
          <input
            className="wp-input"
            value={item.name}
            maxLength={60}
            placeholder={preset?.name ?? "Festival"}
            aria-label="Festival name"
            onChange={(event) => onChange({ name: event.target.value })}
          />
        </label>

        <fieldset className="wp-media-choice">
          <legend>Dates schedule</legend>
          <div className="wp-seg">
            {(
              [
                ["annual", "Annual"],
                ["dated", "Specific dates"],
              ] as const
            ).map(([kind, label]) => (
              <label key={kind} className={item.schedule.kind === kind ? "is-selected" : undefined}>
                <input
                  type="radio"
                  name={`season-dates-${item.id}`}
                  checked={item.schedule.kind === kind}
                  onChange={() =>
                    onChange({ schedule: scheduleOfKind(item.schedule, kind, year) })
                  }
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        {item.schedule.kind === "annual" ? (
          <AnnualDates
            start={item.schedule.start}
            end={item.schedule.end}
            onChange={(start, end) => onChange({ schedule: { kind: "annual", start, end } })}
          />
        ) : (
          <div className="wp-season-dates">
            <label>
              Start date
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
              End date
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

        {/* Date Validation Feedback */}
        <div className={`wp-season-validation is-${validation.status}`} role="status">
          <span className="wp-season-validation-icon" aria-hidden="true">
            {validation.status === "valid" ? "✓" : validation.status === "error" ? "⚠" : "ℹ"}
          </span>
          <span className="wp-season-validation-text">{validation.message}</span>
        </div>

        {/* Move to next year action */}
        {item.schedule.kind === "dated" ? (
          <div className="wp-season-next-year-box">
            <div className="wp-season-next-year-meta">
              <strong>Move to next year</strong>
              <span className="wp-description">
                Advance dates to {shiftYear(item.schedule.start)} – {shiftYear(item.schedule.end)}
              </span>
            </div>
            <button
              type="button"
              className="wp-btn wp-btn-small"
              onClick={moveToNextYear}
            >
              Move to next year
            </button>
          </div>
        ) : null}

        {/* Priority information */}
        <div className="wp-season-priority-box">
          <div className="wp-season-priority-head">
            <h4 className="wp-palette-column-title">Priority information</h4>
            {rank != null && totalCount != null ? (
              <span className="wp-season-rank-badge">
                Priority #{rank} of {totalCount}
              </span>
            ) : null}
          </div>
          <p className="wp-description">
            Festive seasons use priority ordering. When two or more festivals have overlapping dates,
            the festival ordered higher in the list takes precedence on the public website.
          </p>
          {rank === 1 ? (
            <p className="wp-season-priority-status is-highest">
              ★ Highest priority — will always be displayed when its dates match.
            </p>
          ) : rank != null ? (
            <p className="wp-season-priority-status">
              Evaluated after {rank - 1} higher-ranked festival{rank - 1 === 1 ? "" : "s"} if dates coincide.
            </p>
          ) : null}
        </div>
      </div>

      {/* Tab 2: Appearance */}
      <div
        role="tabpanel"
        id={`${tabId}-appearance-panel`}
        aria-labelledby={`${tabId}-appearance-tab`}
        className="wp-season-editor-panel"
        hidden={tab !== "appearance"}
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
          <button
            type="button"
            className="wp-btn wp-btn-small"
            onClick={() => onPalette(defaultSeasonPalette(item.id))}
          >
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

      {/* Tab 3: Decorations */}
      <div
        role="tabpanel"
        id={`${tabId}-decorations-panel`}
        aria-labelledby={`${tabId}-decorations-tab`}
        className="wp-season-editor-panel"
        hidden={tab !== "decorations"}
      >
        <fieldset className="wp-media-choice">
          <legend>Decorations look</legend>
          <div className="wp-seg">
            {(
              [
                ["subtle", "Palette only"],
                ["full", "Palette + Ornaments"],
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

        <p className="wp-description">
          {item.intensity === "subtle"
            ? "Palette only: applies festive brand gradient and theme colors. Ornaments and custom cursor stay hidden."
            : "Palette + Ornaments: displays custom theme colors, screen ornaments, and custom cursor."}
        </p>

        {item.intensity === "subtle" && configuredGroups > 0 ? (
          <p className="wp-season-validation is-warning" role="status">
            <span className="wp-season-validation-icon" aria-hidden="true">
              ℹ
            </span>
            <span className="wp-season-validation-text">
              {configuredGroups} group{configuredGroups === 1 ? " is" : "s are"} configured but will
              not render while this season is set to Palette only. The preview below shows the
              public result.
            </span>
          </p>
        ) : null}

        {/* Placement Groups & Decorations */}
        <SeasonPlacementEditor
          placements={item.placements ?? []}
          ornaments={ornaments}
          renderSummary={item.intensity === "subtle" ? null : renderSummary}
          cursorOrnament={item.cursorOrnament ?? null}
          onOpenCatalog={handleOpenCatalog}
          onChangePlacements={(placements) => {
            const allAssets: string[] = [];
            for (const group of placements) {
              for (const asset of group.assets) {
                if (asset && !allAssets.includes(asset)) {
                  allAssets.push(asset);
                }
              }
            }
            let nextCursor = item.cursorOrnament;
            if (nextCursor && !allAssets.includes(nextCursor)) {
              nextCursor = null;
            }
            onChange({
              placements,
              ornamentImages: allAssets,
              cursorOrnament: nextCursor,
            });
          }}
          onCursorOrnament={(cursorOrnament) => {
            onChange({ cursorOrnament });
          }}
        />
      </div>

      {/* Shared Ornament Catalog Drawer */}
      {catalogOpen && data && setData ? (
        <SeasonCatalogDrawer
          data={data}
          setData={setData}
          onClose={() => setCatalogOpen(false)}
        />
      ) : null}
    </section>
  );
}

/**
 * Month and day fields for a repeating annual window.
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
function scheduleOfKind(
  schedule: SeasonSchedule,
  kind: SeasonSchedule["kind"],
  year: number,
): SeasonSchedule {
  if (schedule.kind === kind) return schedule;
  if (kind === "annual") {
    return { kind: "annual", start: schedule.start.slice(5), end: schedule.end.slice(5) };
  }
  return { kind: "dated", start: `${year}-${schedule.start}`, end: `${year}-${schedule.end}` };
}
