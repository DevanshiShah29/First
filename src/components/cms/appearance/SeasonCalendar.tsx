"use client";

import type { SeasonConfig } from "@/content/seasons";
import { SeasonTrack } from "./SeasonTrack";
import { seasonName } from "./season-labels";
import type { DayParts } from "./season-timeline";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Year-at-a-glance strip: one row per season with its active window,
 * plus a "today" marker and a date control that previews any day.
 * @example <SeasonCalendar items={items} parts={parts} previewDate={previewDate} onPreviewDate={set} />
 */
export function SeasonCalendar({
  items,
  parts,
  previewDate,
  onPreviewDate,
}: {
  items: SeasonConfig[];
  parts: DayParts;
  previewDate: string | null;
  onPreviewDate: (iso: string | null) => void;
}) {
  return (
    <div className="wp-season-calendar">
      <div className="wp-season-calendar-head">
        <h3 className="wp-palette-column-title">Year calendar</h3>
        <div className="wp-season-calendar-controls">
          <input
            type="date"
            className="wp-input"
            value={previewDate ?? ""}
            aria-label="Preview a date"
            onChange={(event) => onPreviewDate(event.target.value || null)}
          />
          {previewDate ? (
            <button type="button" className="wp-btn wp-btn-small" onClick={() => onPreviewDate(null)}>
              Today
            </button>
          ) : null}
        </div>
      </div>

      <div className="wp-season-row is-head" aria-hidden="true">
        <span className="wp-season-row-label" />
        <span className="wp-season-row-track wp-season-months">
          {MONTHS.map((month) => (
            <span key={month}>{month}</span>
          ))}
        </span>
      </div>

      <div className="wp-season-tracks">
        {items.map((item) => (
          <div className="wp-season-row" key={item.id}>
            <span className="wp-season-row-label">{seasonName(item)}</span>
            <SeasonTrack
              item={item}
              today={parts}
              previewDate={previewDate}
              label={seasonName(item)}
              off={!item.enabled}
            />
          </div>
        ))}
      </div>

      <p className="wp-description">
        Top row wins when windows overlap. Choose a date to preview what the calendar picks.
      </p>
    </div>
  );
}
