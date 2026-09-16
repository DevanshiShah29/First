/** Shared string coercion for CMS AI request bodies and model JSON. */

/**
 * Coerces unknown to a trimmed string capped at max.
 * @example str(" hi ", 2) // "hi"
 */
export function str(v: unknown, max = 200): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/**
 * Coerces an unknown array to trimmed strings.
 * @example strList(["a", 1, "b"]) // ["a", "b"]
 */
export function strList(v: unknown, maxItems = 12, maxLen = 200): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.trim().slice(0, maxLen))
    .filter(Boolean)
    .slice(0, maxItems);
}

/**
 * Flattens nested string lists and dedupes.
 * @example strListNested([["React"], "Node"]) // ["React", "Node"]
 */
export function strListNested(v: unknown, maxLists = 20, maxItems = 16): string[] {
  if (!Array.isArray(v)) return [];
  const flat: string[] = [];
  for (const entry of v.slice(0, maxLists)) {
    if (typeof entry === "string") {
      const s = entry.trim().slice(0, 80);
      if (s) flat.push(s);
      continue;
    }
    if (Array.isArray(entry)) {
      for (const item of entry.slice(0, maxItems)) {
        if (typeof item === "string") {
          const s = item.trim().slice(0, 80);
          if (s) flat.push(s);
        }
      }
    }
  }
  return [...new Set(flat)].slice(0, 60);
}

/**
 * Strips markdown JSON fences from model output.
 * @example stripJsonFence(fenced) // "{}"
 */
export function stripJsonFence(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

/**
 * Parses fenced JSON into a plain object or null.
 * @example parseJsonObject('{"a":1}') // { a: 1 }
 */
export function parseJsonObject(raw: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(stripJsonFence(raw));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Normalizes a hex color to #RRGGBB or undefined.
 * @example normalizeHex("#abc") // "#AABBCC"
 */
export function normalizeHex(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const value = raw.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value.toUpperCase();
  const short = value.match(/^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/);
  if (short) {
    const [, a, b, c] = short;
    return `#${a}${a}${b}${b}${c}${c}`.toUpperCase();
  }
  return undefined;
}
