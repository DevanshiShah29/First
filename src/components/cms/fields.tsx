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
