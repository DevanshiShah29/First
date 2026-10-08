"use client";

// Application services & types
import { publishStatusOf, type PublishStatus } from "@/content/types";

const DEFAULT_HINT = "Drafts stay in the CMS and off the public site until you publish them.";

/**
 * Renders a Published / Draft badge.
 * @example <PublishStatusBadge status="draft" />
 */
export function PublishStatusBadge({ status }: { status?: PublishStatus }) {
  const value = publishStatusOf(status);
  const draft = value === "draft";
  return (
    <span className={`wp-status ${draft ? "is-visibility-draft" : "is-publish"}`}>
      {draft ? "Draft" : "Published"}
    </span>
  );
}

/**
 * Renders the CMS publish-status control.
 * Compact is the select alone, for tables and tight rows.
 * @example <PublishStatusControl status={item.status} onChange={setStatus} />
 */
export function PublishStatusControl({
  status,
  onChange,
  hint = DEFAULT_HINT,
  compact = false,
  label,
  id,
  "aria-describedby": ariaDescribedBy,
}: {
  status?: PublishStatus;
  onChange: (status: PublishStatus) => void;
  hint?: string;
  compact?: boolean;
  label?: string;
  id?: string;
  "aria-describedby"?: string;
}) {
  const value = publishStatusOf(status);
  const select = (
    <select
      id={id}
      className="wp-select"
      style={compact ? { width: "auto", maxWidth: 160 } : { maxWidth: 180 }}
      value={value}
      aria-label={label ?? "Publish status"}
      aria-describedby={ariaDescribedBy}
      onChange={(event) => onChange(event.target.value === "draft" ? "draft" : "published")}
    >
      <option value="published">Published</option>
      <option value="draft">Draft</option>
    </select>
  );

  if (compact) return select;

  return (
    <div className="wp-publish-misc">
      <p>
        Status: <PublishStatusBadge status={value} />
      </p>
      {select}
      {hint ? <p className="wp-publish-muted">{hint}</p> : null}
    </div>
  );
}
