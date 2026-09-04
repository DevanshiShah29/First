import type { ReactNode } from "react";

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
  return (
    <tr>
      <th scope="row">{label}</th>
      <td>
        <div style={wide ? { maxWidth: "100%" } : undefined}>{children}</div>
        {hint ? <span className="wp-description">{hint}</span> : null}
      </td>
    </tr>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  small,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  small?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={small ? "wp-input wp-input-small" : "wp-input"}
    />
  );
}

export function TextArea({
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="wp-textarea"
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

export function formatReadableDate(d: Date): string {
  const day = d.getDate();
  const month = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

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

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date or type custom",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const iso = toIsoDate(value);

  const handleDateChange = (isoVal: string) => {
    if (!isoVal) {
      onChange("");
      return;
    }
    const [y, m, d] = isoVal.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    onChange(formatReadableDate(dateObj));
  };

  const setToday = () => {
    onChange(formatReadableDate(new Date()));
  };

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <input
        type="date"
        className="wp-input"
        style={{ width: "auto", minWidth: 150 }}
        value={iso}
        onChange={(e) => handleDateChange(e.target.value)}
        aria-label="Pick date from calendar"
      />
      <TextInput
        value={value}
        placeholder={placeholder}
        onChange={onChange}
      />
      <button
        type="button"
        className="wp-btn"
        onClick={setToday}
        title="Set to today"
      >
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

export function parseCssHex(raw: string): string | null {
  const match = raw.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (!match) return null;
  let hex = match[1];
  if (hex.length === 3) hex = [...hex].map((ch) => ch + ch).join("");
  if (hex.length === 8) hex = hex.slice(0, 6);
  return `#${hex.toLowerCase()}`;
}

export function HexColorInput({
  value,
  onChange,
  placeholder = "#61DAFB",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const parsed = parseCssHex(value);
  return (
    <div className="wp-hex">
      <label className={`wp-hex-swatch${parsed ? " is-valid" : ""}`} title={parsed ? parsed : "Enter a hex color"}>
        <span className="wp-hex-fill" style={parsed ? { background: parsed } : undefined} />
        <input
          type="color"
          value={parsed || "#000000"}
          aria-label="Color preview and picker"
          onChange={(e) => onChange(e.target.value.toUpperCase())}
        />
      </label>
      <input
        className="wp-input"
        value={value}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        aria-label="Hex color value"
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function StringList({
  values,
  onChange,
  addLabel,
  placeholder,
}: {
  values: string[];
  onChange: (values: string[]) => void;
  addLabel: string;
  placeholder?: string;
}) {
  const moveItem = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= values.length) return;
    const next = [...values];
    [next[index], next[j]] = [next[j], next[index]];
    onChange(next);
  };

  return (
    <div className="wp-chip-row">
      {values.map((item, i) => (
        <div className="row" key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            value={item}
            placeholder={placeholder}
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
            aria-label="Move up"
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
            aria-label="Move down"
            onClick={() => moveItem(i, 1)}
            style={{ padding: "0 8px" }}
          >
            ↓
          </button>
          <button type="button" className="wp-btn" onClick={() => onChange(values.filter((_, j) => j !== i))}>
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
