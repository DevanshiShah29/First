"use client";

import type { SeasonConfig } from "@/content/seasons";
import { SeasonTrack } from "./SeasonTrack";
import {
  scheduleSummary,
  seasonCardFlag,
  seasonName,
  type SeasonCardFlag,
} from "./season-labels";
import type { DayParts } from "./season-timeline";

const FLAG_LABEL: Record<SeasonCardFlag, string> = {
  showing: "Showing",
  off: "Off",
  ended: "Ended",
  dates: "Check dates",
};

/**
 * Master-list row: priority, status, dates, mini timeline, and switch.
 * Selecting the row opens its editor; the row itself keeps priority order.
 * @example <SeasonListRow item={item} rank={1} selected onSelect={select} … />
 */
export function SeasonListRow({
  item,
  rank,
  kind,
  selected,
  showing,
  ended,
  previewing,
  previewDate,
  notice,
  countdown,
  overlap,
  today,
  canMoveUp,
  canMoveDown,
  onSelect,
  onToggle,
  onPreview,
  onMoveUp,
  onMoveDown,
}: {
  item: SeasonConfig;
  rank: number;
  kind: "builtin" | "custom";
  selected: boolean;
  showing: boolean;
  ended: boolean;
  previewing: boolean;
  previewDate: string | null;
  notice: string | null;
  countdown: string | null;
  overlap: boolean;
  today: DayParts;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onSelect: () => void;
  onToggle: (enabled: boolean) => void;
  onPreview: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const name = seasonName(item);
  const inverted = item.schedule.kind === "dated" && item.schedule.start > item.schedule.end;
  const flag = seasonCardFlag(item, showing, ended, inverted);

  return (
    <li
      className={`wp-season-item${selected ? " is-selected" : ""}${showing ? " is-showing" : ""}`}
    >
      <button
        type="button"
        className="wp-season-item-main"
        aria-expanded={selected}
        aria-controls="season-editor"
        onClick={onSelect}
      >
        <span className="wp-season-rank" title="Priority — the first match wins" aria-label={`Priority ${rank}`}>
          {rank}
        </span>
        <span className="wp-season-item-copy">
          <span className="wp-season-item-title">
            <span className="wp-season-item-name">{name}</span>
            <span className={`wp-season-kind is-${kind}`}>
              {kind === "custom" ? "Festival" : "Built-in"}
            </span>
            {flag ? <span className={`wp-season-pill is-${flag}`}>{FLAG_LABEL[flag]}</span> : null}
            {previewing ? <span className="wp-season-pill is-previewing">Preview</span> : null}
            {overlap && !showing ? <span className="wp-season-pill is-overlap">Overlaps</span> : null}
          </span>
          <span className="wp-season-item-meta">
            {scheduleSummary(item.schedule)}
            {countdown ? ` · ${countdown}` : ""}
          </span>
          <span className="wp-season-item-track">
            <SeasonTrack
              item={item}
              today={today}
              previewDate={previewing ? previewDate : null}
              label={name}
              off={!item.enabled}
            />
          </span>
          {inverted ? (
            <span className="wp-season-item-note">End is before start, so this season cannot match.</span>
          ) : null}
          {notice ? <span className="wp-season-item-note">{notice}</span> : null}
        </span>
      </button>

      <div className="wp-season-item-side">
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
        <div className="wp-season-item-move">
          <button
            type="button"
            className="wp-btn wp-btn-small wp-btn-icon"
            aria-label={`Move ${name} up`}
            title="Move up (higher priority)"
            disabled={!canMoveUp}
            onClick={onMoveUp}
          >
            ↑
          </button>
          <button
            type="button"
            className="wp-btn wp-btn-small wp-btn-icon"
            aria-label={`Move ${name} down`}
            title="Move down"
            disabled={!canMoveDown}
            onClick={onMoveDown}
          >
            ↓
          </button>
          <button
            type="button"
            className="wp-btn wp-btn-small"
            aria-label={`Preview ${name}`}
            title="Show this season in preview"
            onClick={onPreview}
          >
            Preview
          </button>
        </div>
      </div>
    </li>
  );
}
