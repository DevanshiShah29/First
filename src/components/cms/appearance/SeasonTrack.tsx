"use client";

import type { SeasonConfig } from "@/content/seasons";
import { dayOffset, daysInYear, isoParts, seasonSegments, type DayParts } from "./season-timeline";

/**
 * One season's active window on a year strip, with today and preview markers.
 * @example <SeasonTrack item={item} today={parts} previewDate={null} label="Diwali" off={false} />
 */
export function SeasonTrack({
  item,
  today,
  previewDate,
  label,
  off,
}: {
  item: SeasonConfig;
  today: DayParts;
  previewDate?: string | null;
  label: string;
  off: boolean;
}) {
  const days = daysInYear(today.year);
  const segments = seasonSegments(item, today.year);
  const todayIdx = dayOffset(today, today.year);
  const previewIdx = previewDate ? dayOffset(isoParts(previewDate), today.year) : null;

  return (
    <span
      className={`wp-season-row-track${off ? " is-off" : ""}`}
      aria-label={`${label} window`}
    >
      {segments?.map((segment, index) => (
        <span
          key={index}
          className="wp-season-track-bar"
          style={{
            left: `${(segment.start / days) * 100}%`,
            width: `${((segment.end - segment.start + 1) / days) * 100}%`,
            background: `linear-gradient(90deg, ${item.palette.brandFrom}, ${item.palette.brandTo})`,
          }}
        />
      ))}
      <span
        className="wp-season-track-marker is-today"
        style={{ left: `${(todayIdx / days) * 100}%` }}
        title="Today"
      />
      {previewIdx != null && previewIdx >= 0 && previewIdx < days ? (
        <span
          className="wp-season-track-marker is-preview"
          style={{ left: `${(previewIdx / days) * 100}%` }}
          title={`Previewing ${previewDate}`}
        />
      ) : null}
    </span>
  );
}
