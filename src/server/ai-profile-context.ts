import { promises as fs } from "fs";
import path from "path";
import { assertPublicHttpsUrl } from "@/server/safe-fetch";

const FETCH_TIMEOUT_MS = 8_000;
const MAX_RESUME_BYTES = 4_000_000;
const MAX_LINKEDIN_TEXT = 5_000;
const LINKEDIN_HOST = /(^|\.)linkedin\.com$/i;

export type ProfileContext = {
  linkedin: { url: string; text: string; ok: boolean };
  resume: { url: string; pdfBase64?: string; note: string };
};

type GeminiPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } };

/**
 * Coerces unknown to a trimmed string capped at max.
 * @example str(" hi ", 2) // "hi"
 */
function str(v: unknown, max = 400): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/**
 * Pulls the first matching meta tag content from HTML.
 * @example metaContent(html, ["og:title"]) // "Jane Doe"
 */
function metaContent(html: string, names: string[]): string {
  for (const name of names) {
    const re = new RegExp(
      `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["'][^>]*>|<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["'][^>]*>`,
      "i",
    );
    const m = html.match(re);
    const value = (m?.[1] || m?.[2] || "").trim();
    if (value) return value.slice(0, 500);
  }
  return "";
}

/**
 * Decodes common HTML entities and collapses whitespace.
 * @example decodeEntities("A &amp; B") // "A & B"
 */
function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Fetches a URL and aborts after FETCH_TIMEOUT_MS.
 * @example await fetchWithTimeout(url) // Response
 */
async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal, redirect: "follow" });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Normalizes to an https linkedin.com URL or "".
 * @example normalizeLinkedInUrl("linkedin.com/in/x") // "https://linkedin.com/in/x"
 */
function normalizeLinkedInUrl(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  try {
    const withProto = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    const u = new URL(withProto);
    if (!LINKEDIN_HOST.test(u.hostname)) return "";
    u.protocol = "https:";
    u.hash = "";
    u.search = "";
    return u.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

/**
 * Builds a short LinkedIn text summary from HTML.
 * @example summarizeLinkedInHtml(html, url) // "URL: …\nTitle: …"
 */
function summarizeLinkedInHtml(html: string, url: string): string {
  const title = decodeEntities(metaContent(html, ["og:title", "twitter:title"]));
  const description = decodeEntities(
    metaContent(html, ["og:description", "description", "twitter:description"]),
  );
  const lines = [`URL: ${url}`];
  if (title) lines.push(`Title: ${title}`);
  if (description) lines.push(`About: ${description}`);

  const ldBlocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const block of ldBlocks.slice(0, 2)) {
    try {
      const parsed = JSON.parse(block[1]) as unknown;
      const blob = JSON.stringify(parsed);
      if (blob.includes('"Person"') || blob.includes('"Organization"') || blob.includes("alumniOf")) {
        lines.push(`Structured data: ${blob.slice(0, 1_800)}`);
        break;
      }
    } catch {
      // ignore invalid JSON-LD
    }
  }

  return lines.join("\n").slice(0, MAX_LINKEDIN_TEXT);
}

/**
 * Fetches and summarizes a LinkedIn profile URL.
 * @example await gatherLinkedIn(url) // { url, text, ok }
 */
async function gatherLinkedIn(urlRaw: string): Promise<ProfileContext["linkedin"]> {
  const url = normalizeLinkedInUrl(urlRaw);
  if (!url) return { url: "", text: "", ok: false };

  try {
    const safe = await assertPublicHttpsUrl(url);
    if (!LINKEDIN_HOST.test(safe.hostname)) {
      return {
        url,
        ok: false,
        text: `URL: ${url}\n(Only linkedin.com profiles are allowed.)`,
      };
    }
    // Do not follow redirects — avoids SSRF via redirect to a private host.
    const res = await fetchWithTimeout(safe.toString(), {
      redirect: "error",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "Accept-Language": "en-US,en;q=0.9",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) {
      return {
        url,
        ok: false,
        text: `URL: ${url}\n(Fetch failed with HTTP ${res.status}. Use the URL only as a weak hint.)`,
      };
    }
    const html = await res.text();
    const text = summarizeLinkedInHtml(html, url);
    const ok = Boolean(metaContent(html, ["og:title", "og:description", "description"]));
    return {
      url,
      ok,
      text: text || `URL: ${url}\n(Page fetched but little public profile text was available.)`,
    };
  } catch (err) {
    console.error("LinkedIn context fetch failed", err);
    return {
      url,
      ok: false,
      text: `URL: ${url}\n(Could not fetch public profile details. Use the URL only as a weak hint.)`,
    };
  }
}

/**
 * Resolves a resume URL to a path under public/uploads or null.
 * @example localResumePath("/uploads/resume/x.pdf") // "/…/public/uploads/resume/x.pdf"
 */
function localResumePath(resumeUrl: string): string | null {
  const clean = resumeUrl.trim().split("?")[0].split("#")[0];
  if (!clean) return null;

  let pathname = "";
  if (clean.startsWith("/")) {
    pathname = clean;
  } else {
    try {
      pathname = new URL(clean).pathname;
    } catch {
      return null;
    }
  }

  if (!pathname.startsWith("/uploads/")) return null;
  if (pathname.includes("\0") || pathname.split("/").includes("..")) return null;

  const uploadsRoot = path.resolve(process.cwd(), "public", "uploads");
  const resolved = path.resolve(process.cwd(), "public", pathname.slice(1));
  const relative = path.relative(uploadsRoot, resolved);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }
  return resolved;
}

/**
 * Loads resume PDF bytes from disk or HTTPS.
 * @example await gatherResume(url) // { url, pdfBase64?, note }
 */
async function gatherResume(resumeUrlRaw: string): Promise<ProfileContext["resume"]> {
  const url = str(resumeUrlRaw, 500);
  if (!url) return { url: "", note: "Resume: (not set in Site settings)" };

  const localPath = localResumePath(url);
  try {
    if (localPath) {
      const buf = await fs.readFile(localPath);
      if (buf.length > MAX_RESUME_BYTES) {
        return { url, note: "Resume PDF is too large to attach." };
      }
      return {
        url,
        pdfBase64: buf.toString("base64"),
        note: "Resume PDF attached — treat it as a primary factual source.",
      };
    }

    if (!/^https?:\/\//i.test(url)) {
      return { url, note: "Resume path could not be resolved." };
    }

    let safe: URL;
    try {
      safe = await assertPublicHttpsUrl(url);
    } catch {
      return { url, note: "Resume URL is not allowed (public HTTPS hosts only)." };
    }

    // Do not follow redirects — avoids SSRF via redirect to a private host.
    const res = await fetchWithTimeout(safe.toString(), {
      redirect: "error",
      headers: { Accept: "application/pdf,*/*" },
    });
    if (!res.ok) {
      return { url, note: `Resume fetch failed (HTTP ${res.status}).` };
    }
    const ab = await res.arrayBuffer();
    if (ab.byteLength > MAX_RESUME_BYTES) {
      return { url, note: "Resume PDF is too large to attach." };
    }
    return {
      url,
      pdfBase64: Buffer.from(ab).toString("base64"),
      note: "Resume PDF attached — treat it as a primary factual source.",
    };
  } catch (err) {
    console.error("Resume context load failed", err);
    return { url, note: "Resume could not be read from disk or URL." };
  }
}

/**
 * Loads LinkedIn + resume context in parallel.
 * @example await gatherProfileContext({ linkedin, resume }) // ProfileContext
 */
export async function gatherProfileContext(input: {
  linkedin?: string;
  resume?: string;
}): Promise<ProfileContext> {
  const [linkedin, resume] = await Promise.all([
    gatherLinkedIn(str(input.linkedin, 400)),
    gatherResume(str(input.resume, 500)),
  ]);
  return { linkedin, resume };
}

/**
 * Formats profile context as prompt sections.
 * @example formatProfileContextForPrompt(ctx) // "### LinkedIn profile\n…"
 */
export function formatProfileContextForPrompt(ctx: ProfileContext): string {
  return [
    "### LinkedIn profile",
    ctx.linkedin.url
      ? ctx.linkedin.text || `URL: ${ctx.linkedin.url}`
      : "(not set in Site settings)",
    "",
    "### Resume",
    ctx.resume.url
      ? `${ctx.resume.note}\nURL: ${ctx.resume.url}`
      : "(not set in Site settings)",
  ].join("\n");
}

/**
 * Builds Gemini parts with optional resume PDF inline.
 * @example geminiPartsWithProfile(prompt, ctx) // [{ text }, { inline_data? }]
 */
export function geminiPartsWithProfile(prompt: string, ctx: ProfileContext): GeminiPart[] {
  const parts: GeminiPart[] = [{ text: prompt }];
  if (ctx.resume.pdfBase64) {
    parts.push({
      inline_data: {
        mime_type: "application/pdf",
        data: ctx.resume.pdfBase64,
      },
    });
  }
  return parts;
}

/**
 * Reports whether LinkedIn/resume URLs are present.
 * @example profileContextReady(ctx) // { hasLinkedIn, hasResume, hasAny }
 */
export function profileContextReady(ctx: ProfileContext): {
  hasLinkedIn: boolean;
  hasResume: boolean;
  hasAny: boolean;
} {
  const hasLinkedIn = Boolean(ctx.linkedin.url);
  const hasResume = Boolean(ctx.resume.url);
  return { hasLinkedIn, hasResume, hasAny: hasLinkedIn || hasResume };
}
