/**
 * Coerces unknown to a plain object.
 * @example asRecord({a:1}) // {a:1}, asRecord(null) // {}
 */
export function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/**
 * Reads a string field or returns fallback.
 * @example str("hi") // "hi", str(1, "x") // "x"
 */
export function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

/**
 * Reads a boolean field or returns fallback.
 * @example bool(true) // true, bool("yes") // false
 */
export function bool(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

/**
 * Reads a finite number or returns fallback.
 * @example num(3) // 3, num(NaN, 0) // 0
 */
export function num(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/**
 * Maps an array to non-empty strings.
 * @example strList(["a", ""]) // ["a"]
 */
export function strList(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => str(item)).filter(Boolean) : [];
}
