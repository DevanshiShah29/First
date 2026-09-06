/**
 * Trims a resume URL for use as an href.
 * @example resumeHref(" /resume.pdf ") // "/resume.pdf"
 */
export function resumeHref(url: string) {
  return url.trim();
}

/**
 * File name from a resume URL path.
 * @example resumeFileLabel("/files/Devanshi.pdf") // "Devanshi.pdf"
 */
export function resumeFileLabel(url: string) {
  const clean = resumeHref(url).split("?")[0].split("#")[0];
  if (!clean) return "";
  const parts = clean.split("/");
  return decodeURIComponent(parts[parts.length - 1] || clean);
}

/**
 * Suggested download filename from URL + site name.
 * @example resumeDownloadName("/a.pdf", "Devanshi") // "Devanshi-Resume.pdf"
 */
export function resumeDownloadName(url: string, siteName: string) {
  const path = resumeHref(url).split("?")[0].split("#")[0];
  const ext = path.match(/\.([a-z0-9]+)$/i)?.[1] ?? "pdf";
  const slug =
    siteName
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^A-Za-z0-9-_]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "Resume";
  return `${slug}-Resume.${ext}`;
}

/**
 * Anchor props for opening/downloading a resume.
 * @example resumeDownloadProps("/r.pdf", "Devanshi") // { href, download }
 */
export function resumeDownloadProps(url: string, siteName: string) {
  const href = resumeHref(url);
  if (!href) return null;
  const sameOrigin = href.startsWith("/") || href.startsWith("./");
  return {
    href,
    download: sameOrigin ? resumeDownloadName(href, siteName) : undefined,
    target: sameOrigin ? undefined : "_blank",
    rel: sameOrigin ? undefined : "noopener noreferrer",
  };
}
