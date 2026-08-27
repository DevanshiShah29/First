export function normalizeHex(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const match = value.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) return fallback;
  let hex = match[1];
  if (hex.length === 3) hex = [...hex].map((ch) => ch + ch).join("");
  return `#${hex.toUpperCase()}`;
}
