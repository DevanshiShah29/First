/**
 * Visitor label for a blank CMS string.
 * Do not persist the result. A blank field stays blank in the database.
 * @example displayFallback("", "Role") // "Role"
 */
export function displayFallback(value: string, fallback: string): string {
  const trimmed = value.trim();
  return trimmed || fallback;
}
