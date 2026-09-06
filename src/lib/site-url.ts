/**
 * Absolute site origin from SITE_URL / Vercel / localhost.
 * @example siteOrigin() // "https://example.com"
 */
export function siteOrigin(): string {
  const explicit = process.env.SITE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `https://${host}`;
  }
  return "http://localhost:3000";
}
