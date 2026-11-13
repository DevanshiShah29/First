import { asRecord } from "./parse-fields";

/** Follower drawn with the brand arrow. `none` keeps the arrow alone. */
export const CURSOR_STYLE_IDS = ["none", "shadow", "ring", "dots", "glow", "echo"] as const;

export type CursorStyle = (typeof CURSOR_STYLE_IDS)[number];

export type CursorSettings = {
  style: CursorStyle;
};

/** Used when a site has no saved cursor choice. */
export const DEFAULT_CURSOR: CursorSettings = { style: "dots" };

export const CURSOR_STYLE_OPTIONS: { id: CursorStyle; label: string; hint: string }[] = [
  { id: "none", label: "Arrow only", hint: "Brand arrow, with nothing following it." },
  { id: "shadow", label: "Shadow", hint: "A soft blur lags behind the arrow." },
  { id: "ring", label: "Ring", hint: "A thin circle follows the arrow and grows on links and buttons." },
  { id: "dots", label: "Dots", hint: "Three dots follow the arrow, each a little slower than the last." },
  { id: "glow", label: "Glow", hint: "The arrow itself carries a soft brand glow." },
  { id: "echo", label: "Echo", hint: "A fainter copy of the arrow lags behind." },
];

/**
 * True when a value is one of the saved cursor styles.
 * @example isCursorStyle("dots") // true
 */
export function isCursorStyle(value: unknown): value is CursorStyle {
  return typeof value === "string" && (CURSOR_STYLE_IDS as readonly string[]).includes(value);
}

/**
 * Parses stored cursor JSON. Unknown styles fall back to the default.
 * @example parseCursor({ style: "ring" }) // { style: "ring" }
 */
export function parseCursor(value: unknown): CursorSettings {
  const row = asRecord(value);
  return { style: isCursorStyle(row.style) ? row.style : DEFAULT_CURSOR.style };
}
