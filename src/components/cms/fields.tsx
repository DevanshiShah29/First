"use client";

// External dependencies
import {
  Children,
  cloneElement,
  isValidElement,
  useId,
  type ReactElement,
  type ReactNode,
} from "react";

type FieldControlProps = {
  id?: string;
  "aria-describedby"?: string;
};

/**
 * Injects id/aria-describedby onto the first field control.
 * @example enhanceControl(child, id, hintId) // node
 */
function enhanceControl(
  child: ReactNode,
  id: string,
  describedBy?: string,
): ReactNode {
  if (!isValidElement(child)) return child;
  const el = child as ReactElement<FieldControlProps>;
  if (el.props.id) return child;
  return cloneElement(el, {
    id,
    ...(describedBy ? { "aria-describedby": describedBy } : {}),
  });
}

/**
 * Renders a labeled WP-style form row.
 * @example <Field label="Email"><TextInput … /></Field>
 */
export function Field({
  label,
  hint,
  children,
  wide,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const autoId = useId();
  const hintId = hint ? `${autoId}-hint` : undefined;
  const childArray = Children.toArray(children);
  const enhanced = childArray.map((child, index) =>
    index === 0 ? enhanceControl(child, autoId, hintId) : child,
  );

  return (
    <tr>
      <th scope="row">
        <label htmlFor={autoId}>{label}</label>
      </th>
      <td>
        <div style={wide ? { maxWidth: "100%" } : undefined}>{enhanced}</div>
        {hint ? (
          <span id={hintId} className="wp-description">
            {hint}
          </span>
        ) : null}
      </td>
    </tr>
  );
}

/**
 * Renders a CMS text input bound to a string.
 * @example <TextInput value={email} onChange={setEmail} />
 */
export function TextInput({
  id,
  value,
  onChange,
  placeholder,
  type = "text",
  small,
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  small?: boolean;
  "aria-describedby"?: string;
  "aria-label"?: string;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={small ? "wp-input wp-input-small" : "wp-input"}
      aria-describedby={ariaDescribedBy}
      aria-label={ariaLabel}
    />
  );
}

/**
 * Renders a CMS textarea bound to a string.
 * @example <TextArea value={bio} onChange={setBio} rows={6} />
 */
export function TextArea({
  id,
  value,
  onChange,
  rows = 4,
  placeholder,
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  "aria-describedby"?: string;
  "aria-label"?: string;
}) {
  return (
    <textarea
      id={id}
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="wp-textarea"
      aria-describedby={ariaDescribedBy}
      aria-label={ariaLabel}
    />
  );
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/**
 * Formats a Date as "D Mon YYYY".
 * @example formatReadableDate(new Date()) // "6 Sep 2026"
 */
export function formatReadableDate(d: Date): string {
  const day = d.getDate();
  const month = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Parses readable/ISO dates into YYYY-MM-DD.
 * @example toIsoDate("6 Sep 2026") // "2026-09-06"
 */
export function toIsoDate(val?: string): string {
  if (!val) return "";
  const trimmed = val.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const dmyMatch = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const monthName = dmyMatch[2].slice(0, 3).toLowerCase();
    const monthIdx = MONTH_NAMES.findIndex((m) => m.toLowerCase() === monthName);
    const year = parseInt(dmyMatch[3], 10);
    if (monthIdx >= 0) {
      const mm = String(monthIdx + 1).padStart(2, "0");
      const dd = String(day).padStart(2, "0");
      return `${year}-${mm}-${dd}`;
    }
  }

  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return "";
}

/**
 * Renders calendar + text date controls.
 * @example <DatePicker value={date} onChange={setDate} />
 */
export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Select date or type custom",
  "aria-describedby": ariaDescribedBy,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  "aria-describedby"?: string;
}) {
  const iso = toIsoDate(value);
  const calendarId = id ? `${id}-calendar` : undefined;

  /**
   * Converts a calendar ISO value into readable date text.
   * @example handleDateChange("2026-09-06") // void
   */
  const handleDateChange = (isoVal: string) => {
    if (!isoVal) {
      onChange("");
      return;
    }
    const [y, m, d] = isoVal.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    onChange(formatReadableDate(dateObj));
  };

  /**
   * Sets the date field to today's readable value.
   * @example setToday() // void
   */
  const setToday = () => {
    onChange(formatReadableDate(new Date()));
  };

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <input
        id={calendarId}
        type="date"
        className="wp-input"
        style={{ width: "auto", minWidth: 150 }}
        value={iso}
        onChange={(e) => handleDateChange(e.target.value)}
        aria-label="Pick date from calendar"
      />
      <TextInput
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        aria-describedby={ariaDescribedBy}
        aria-label="Date text"
      />
      <button type="button" className="wp-btn" onClick={setToday} title="Set to today">
        Today
      </button>
      {value ? (
        <button
          type="button"
          className="wp-btn-link"
          onClick={() => onChange("")}
          title="Clear date"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}

/**
 * Normalizes a CSS hex string or returns null.
 * @example parseCssHex("#abc") // "#aabbcc"
 */
export function parseCssHex(raw: string): string | null {
  const match = raw.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (!match) return null;
  let hex = match[1];
  if (hex.length === 3) hex = [...hex].map((ch) => ch + ch).join("");
  if (hex.length === 8) hex = hex.slice(0, 6);
  return `#${hex.toLowerCase()}`;
}

/**
 * Renders hex text + color picker for theme colors.
 * @example <HexColorInput value={hex} onChange={setHex} />
 */
export function HexColorInput({
  id,
  value,
  onChange,
  placeholder = "#61DAFB",
  "aria-describedby": ariaDescribedBy,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  "aria-describedby"?: string;
}) {
  const parsed = parseCssHex(value);
  const pickerId = id ? `${id}-picker` : undefined;
  return (
    <div className="wp-hex">
      <label
        className={`wp-hex-swatch${parsed ? " is-valid" : ""}`}
        title={parsed ? parsed : "Enter a hex color"}
        htmlFor={pickerId}
      >
        <span className="wp-hex-fill" style={parsed ? { background: parsed } : undefined} />
        <input
          id={pickerId}
          type="color"
          value={parsed || "#000000"}
          aria-label="Color preview and picker"
          onChange={(e) => onChange(e.target.value.toUpperCase())}
        />
      </label>
      <input
        id={id}
        className="wp-input"
        value={value}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        aria-label="Hex color value"
        aria-describedby={ariaDescribedBy}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

/**
 * Renders an editable reorderable string list.
 * @example <StringList values={tags} onChange={setTags} addLabel="Tag" />
 */
export function StringList({
  id,
  values,
  onChange,
  addLabel,
  placeholder,
  "aria-describedby": ariaDescribedBy,
}: {
  id?: string;
  values: string[];
  onChange: (values: string[]) => void;
  addLabel: string;
  placeholder?: string;
  "aria-describedby"?: string;
}) {
  /**
   * Moves a string-list item up or down.
   * @example moveItem(1, -1) // void
   */
  const moveItem = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= values.length) return;
    const next = [...values];
    [next[index], next[j]] = [next[j], next[index]];
    onChange(next);
  };

  return (
    <div className="wp-chip-row" role="group" aria-describedby={ariaDescribedBy}>
      {values.map((item, i) => (
        <div className="row" key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            id={i === 0 ? id : undefined}
            value={item}
            placeholder={placeholder}
            aria-label={`${addLabel} item ${i + 1}`}
            onChange={(e) => {
              const next = [...values];
              next[i] = e.target.value;
              onChange(next);
            }}
            className="wp-input"
          />
          <button
            type="button"
            className="wp-btn"
            disabled={i === 0}
            title="Move up"
            aria-label={`Move item ${i + 1} up`}
            onClick={() => moveItem(i, -1)}
            style={{ padding: "0 8px" }}
          >
            ↑
          </button>
          <button
            type="button"
            className="wp-btn"
            disabled={i === values.length - 1}
            title="Move down"
            aria-label={`Move item ${i + 1} down`}
            onClick={() => moveItem(i, 1)}
            style={{ padding: "0 8px" }}
          >
            ↓
          </button>
          <button
            type="button"
            className="wp-btn"
            aria-label={`Remove item ${i + 1}`}
            onClick={() => onChange(values.filter((_, j) => j !== i))}
          >
            Remove
          </button>
        </div>
      ))}
      <button type="button" className="wp-add" onClick={() => onChange([...values, ""])}>
        + {addLabel}
      </button>
    </div>
  );
}
