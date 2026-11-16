"use client";

import type { SeasonConfig } from "@/content/seasons";
import { placementItemCount } from "@/content/season-placement-layout";
import { SeasonTrack } from "./SeasonTrack";
import { scheduleSummary, seasonBadges, seasonName } from "./season-labels";
import type { DayParts } from "./season-timeline";

/**
 * Converts a 3- or 6-digit hex code to an rgba() string.
 */
function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Master-list row: chronological rank, status badges, dates, mini timeline, switch, and preview button.
 * Selecting the row opens its editor; rows are sorted by nearest date.
 * @example <SeasonListRow item={item} rank={1} selected onSelect={select} … />
 */
export function SeasonListRow({
  item,
  rank,
  selected,
  showing,
  ended,
  previewing,
  previewDate,
  notice,
  countdown,
  overlap,
  today,
  variant = "row",
  onSelect,
  onToggle,
  onPreview,
}: {
  item: SeasonConfig;
  rank: number;
  selected: boolean;
  showing: boolean;
  ended: boolean;
  previewing: boolean;
  previewDate: string | null;
  notice: string | null;
  countdown: string | null;
  overlap: boolean;
  today: DayParts;
  /** "selector" is the compact horizontal festival card. */
  variant?: "row" | "selector";
  onSelect: () => void;
  onToggle: (enabled: boolean) => void;
  onPreview: () => void;
}) {
  const name = seasonName(item);
  const inverted = item.schedule.kind === "dated" && item.schedule.start > item.schedule.end;
  const badges = seasonBadges(item, showing, ended, inverted, overlap, today);
  const decoratedGroups = (item.placements ?? []).filter((group) => group.assets.length > 0);
  const decorationCount = decoratedGroups.reduce(
    (total, group) => total + placementItemCount(group),
    0,
  );
  const decorationsOff = decorationCount > 0 && item.intensity === "subtle";
  const decorationTitle = decorationsOff
    ? `${decorationCount} ornament${decorationCount === 1 ? "" : "s"} configured in ${decoratedGroups.length} group${decoratedGroups.length === 1 ? "" : "s"}, but this season is palette only.`
    : `${decorationCount} ornament${decorationCount === 1 ? "" : "s"} configured in ${decoratedGroups.length} group${decoratedGroups.length === 1 ? "" : "s"}.`;

  return (
    <li
      className={`wp-season-item${variant === "selector" ? " is-selector-card" : ""}${selected ? " is-selected" : ""}${showing ? " is-showing" : ""}${!item.enabled ? " is-off" : ""}`}
      style={{
        background: item.enabled
          ? `linear-gradient(115deg, ${hexToRgba(item.palette.brandFrom, 0.12)} 0%, ${hexToRgba(item.palette.brandTo, 0.06)} 40%, #ffffff 80%)`
          : undefined,
        borderColor: selected
          ? undefined
          : item.enabled
            ? hexToRgba(item.palette.brandFrom, 0.35)
            : undefined,
      }}
    >
      <div
        className="wp-season-color-bar"
        style={{
          background: `linear-gradient(180deg, ${item.palette.brandFrom}, ${item.palette.brandTo})`,
        }}
        aria-hidden="true"
      />

      <button
        type="button"
        className="wp-season-item-main"
        aria-expanded={selected}
        aria-controls="season-editor"
        onClick={onSelect}
      >
        <span
          className="wp-season-rank"
          style={{
            background: item.enabled
              ? `linear-gradient(135deg, ${item.palette.brandFrom}, ${item.palette.brandTo})`
              : undefined,
            color: item.enabled ? "#ffffff" : undefined,
          }}
          title={`Order #${rank} by date`}
          aria-label={`Order ${rank}`}
        >
          {rank}
        </span>
        <span className="wp-season-item-copy">
          <span className="wp-season-item-title">
            <span className="wp-season-item-name">{name}</span>
            <span
              className="wp-season-color-badge"
              style={{
                background: `linear-gradient(90deg, ${item.palette.brandFrom}, ${item.palette.brandTo})`,
              }}
              title={`Theme colors: ${item.palette.brandFrom} → ${item.palette.brandTo}`}
              aria-label={`Theme colors: ${item.palette.brandFrom} to ${item.palette.brandTo}`}
            />
            {badges.map((b) => (
              <span key={b.id} className={`wp-season-pill is-${b.id}`}>
                {b.label}
              </span>
            ))}
            {decorationCount > 0 ? (
              <span
                className={`wp-season-pill ${decorationsOff ? "is-decorations-off" : "is-decorated"}`}
                title={decorationTitle}
              >
                {decorationsOff
                  ? "Decorations hidden"
                  : `${decorationCount} ornament${decorationCount === 1 ? "" : "s"}`}
              </span>
            ) : null}
            {previewing ? <span className="wp-season-pill is-previewing">Preview</span> : null}
          </span>
          <span className="wp-season-item-meta">
            {scheduleSummary(item.schedule)}
            {countdown ? ` · ${countdown}` : ""}
          </span>
          {variant === "row" ? (
            <span className="wp-season-item-track">
              <SeasonTrack
                item={item}
                today={today}
                previewDate={previewing ? previewDate : null}
                label={name}
                off={!item.enabled}
              />
            </span>
          ) : null}
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
        {variant === "row" ? (
          <button
            type="button"
            className="wp-btn wp-btn-small"
            aria-label={`Preview ${name}`}
            title="Show this season in preview"
            onClick={onPreview}
          >
            Preview
          </button>
        ) : null}
      </div>
    </li>
  );
}
