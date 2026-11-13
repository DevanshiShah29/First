"use client";

import { getSeasonPreset } from "@/content/season-presets";
import { defaultSeasonPalette, type SeasonConfig, type SeasonPalette, type SeasonSchedule } from "@/content/seasons";
import { EditablePalette, PaletteColorRow } from "./EditablePalette";
import { ConfirmButton } from "../components/ConfirmDialog";
import { SeasonOrnamentsEditor } from "./SeasonOrnamentsEditor";
import { seasonName } from "./season-labels";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Dates, look, palette, and ornaments for the season that is open.
 * @example <SeasonEditor item={item} ended={false} year={2026} onChange={patch} onPalette={setPalette} onImages={setImages} onClose={close} onPreview={preview} />
 */
export function SeasonEditor({
  item,
  ended,
  year,
  onChange,
  onPalette,
  onImages,
  onClose,
  onPreview,
  onRemove,
}: {
  item: SeasonConfig;
  ended: boolean;
  year: number;
  onChange: (patch: Partial<SeasonConfig>) => void;
  onPalette: (palette: SeasonPalette) => void;
  onImages: (images: string[]) => void;
  onClose: () => void;
  onPreview: () => void;
  onRemove?: () => void;
}) {
  const preset = getSeasonPreset(item.id);
  const name = seasonName(item);
  const inverted = item.schedule.kind === "dated" && item.schedule.start > item.schedule.end;

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
              className="wp-btn wp-btn-small"
              title={`Remove ${name}?`}
              confirmLabel="Remove"
              onConfirm={onRemove}
            >
              Remove
            </ConfirmButton>
          ) : null}
        </div>
      </div>

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
        <p className="wp-season-note is-inline">This window has ended. Set next year’s dates to run it again.</p>
      ) : null}

      <div className="wp-season-block">
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
      </div>

      <div className="wp-season-block wp-season-palette">
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
        <SeasonOrnamentsEditor images={item.ornamentImages} onImages={onImages} />
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
