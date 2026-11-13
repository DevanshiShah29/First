"use client";

import type { SeasonConfig } from "@/content/seasons";
import { ColorPreviewStrip } from "./ColorPreviewStrip";
import {
  intensitySummary,
  scheduleSummary,
  seasonCardFlag,
  seasonName,
  type SeasonCardFlag,
} from "./season-labels";

const FLAG_LABEL: Record<SeasonCardFlag, string> = {
  showing: "Showing",
  off: "Off",
  ended: "Ended",
  dates: "Check dates",
};

/**
 * Compact season card: status, dates, and swatches. Editing opens below the grid.
 * @example <SeasonSummaryCard item={item} showing={false} ended={false} open={false} previewing={false} notice={null} onToggle={fn} onEdit={fn} onPreview={fn} />
 */
export function SeasonSummaryCard({
  item,
  showing,
  ended,
  open,
  previewing,
  notice,
  onToggle,
  onEdit,
  onPreview,
}: {
  item: SeasonConfig;
  showing: boolean;
  ended: boolean;
  open: boolean;
  previewing: boolean;
  notice: string | null;
  onToggle: (enabled: boolean) => void;
  onEdit: () => void;
  onPreview: () => void;
}) {
  const name = seasonName(item);
  const inverted = item.schedule.kind === "dated" && item.schedule.start > item.schedule.end;
  const flag = seasonCardFlag(item, showing, ended, inverted);
  const ornamentNote =
    item.intensity === "full"
      ? item.ornamentImages.length
        ? `${item.ornamentImages.length} image${item.ornamentImages.length === 1 ? "" : "s"}`
        : "No images"
      : null;

  return (
    <article className={`wp-theme-card wp-season-card${open ? " is-open" : ""}${showing ? " is-showing" : ""}`}>
      <div className="wp-theme-card-top">
        <div className="wp-theme-card-titles">
          <h3 className="wp-theme-card-name">
            {name}
            {flag ? <span className={`wp-season-pill is-${flag}`}>{FLAG_LABEL[flag]}</span> : null}
          </h3>
          <p className="wp-theme-card-desc">{scheduleSummary(item.schedule)}</p>
        </div>
        <button
          type="button"
          role="switch"
          className={`wp-switch${item.enabled ? " is-on" : ""}`}
          aria-checked={item.enabled}
          aria-label={`${item.enabled ? "Turn off" : "Turn on"} ${name}`}
          onClick={() => onToggle(!item.enabled)}
        >
          <span className="wp-switch-track" aria-hidden="true">
            <span className="wp-switch-knob" />
          </span>
          {item.enabled ? "On" : "Off"}
        </button>
      </div>

      <div
        className="wp-season-brand"
        style={{ background: `linear-gradient(90deg, ${item.palette.brandFrom}, ${item.palette.brandTo})` }}
        aria-hidden="true"
      />
      <ColorPreviewStrip palette={item.palette.light} size="sm" />
      <p className="wp-season-card-meta">
        {intensitySummary(item.intensity)}
        {ornamentNote ? ` · ${ornamentNote}` : ""}
      </p>
      {inverted ? <p className="wp-season-note is-inline">End is before start, so this season cannot match.</p> : null}
      {notice ? <p className="wp-season-note is-inline">{notice}</p> : null}

      <div className="wp-theme-card-actions">
        <button
          type="button"
          className={`wp-btn wp-btn-small${open ? " wp-btn-primary" : ""}`}
          aria-expanded={open}
          onClick={onEdit}
        >
          {open ? "Close editor" : "Edit"}
        </button>
        <button type="button" className="wp-btn wp-btn-small" onClick={onPreview}>
          {previewing ? "In preview" : "Preview"}
        </button>
      </div>
    </article>
  );
}
