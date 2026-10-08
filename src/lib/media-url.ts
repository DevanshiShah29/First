export type PlayableMedia =
  | { type: "file"; src: string; kind: "video" | "image" }
  | { type: "iframe"; src: string }
  | { type: "unsupported"; reason: string };

const FILE_EXT = /\.(mp4|webm|ogg|ogv|mov|m4v)(?:\?|#|$)/i;
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|heic|heif|svg)(?:\?|#|$)/i;

/**
 * Extracts a YouTube video id from a URL or bare id.
 * @example youtubeVideoId("https://youtu.be/dQw4w9WgXcQ") // "dQw4w9WgXcQ"
 */
export function youtubeVideoId(url: string) {
  const raw = url.trim();
  if (!raw) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;
  const fromPath = raw.match(
    /(?:youtube\.com\/(?:embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i,
  );
  if (fromPath?.[1]) return fromPath[1];
  const fromQuery = raw.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  return fromQuery?.[1] ?? null;
}

/**
 * Extracts a Vimeo video id from a URL.
 * @example vimeoId("https://vimeo.com/123") // "123"
 */
function vimeoId(url: string) {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  return m?.[1] ?? null;
}

/**
 * Extracts a Pexels video id from a page/download URL.
 * @example pexelsVideoId("…/video/foo-123") // "123"
 */
function pexelsVideoId(url: string) {
  const m = url.match(/pexels\.com\/(?:video\/(?:[a-z0-9-]+-)?|download\/video\/)(\d+)/i);
  return m?.[1] ?? null;
}

/**
 * Classifies a media URL into file, iframe, or unsupported.
 * @example parsePlayableMedia(url) // { type: "iframe", src }
 */
export function parsePlayableMedia(raw: string, preferred?: "image" | "video" | "none"): PlayableMedia {
  const url = raw.trim();
  if (!url) return { type: "unsupported", reason: "No URL yet." };

  const yt = youtubeVideoId(url);
  if (yt) {
    return {
      type: "iframe",
      src: `https://www.youtube.com/embed/${yt}?autoplay=1&mute=1&loop=1&playlist=${yt}&controls=0&playsinline=1`,
    };
  }

  const vimeo = vimeoId(url);
  if (vimeo) {
    return {
      type: "iframe",
      src: `https://player.vimeo.com/video/${vimeo}?background=1&autoplay=1&muted=1&loop=1`,
    };
  }

  const pexels = pexelsVideoId(url);
  if (pexels) {
    return { type: "file", src: `https://www.pexels.com/download/video/${pexels}/`, kind: "video" };
  }

  if (FILE_EXT.test(url) || url.includes("videos.pexels.com/video-files/")) {
    return { type: "file", src: url, kind: "video" };
  }

  if (IMAGE_EXT.test(url) || url.includes("images.pexels.com/") || url.includes("images.unsplash.com/")) {
    return { type: "file", src: url, kind: "image" };
  }

  if (preferred === "image") return { type: "file", src: url, kind: "image" };

  if (/pexels\.com\/video\//i.test(url) || /pixabay\.com\/videos\//i.test(url)) {
    return {
      type: "unsupported",
      reason: "This is a webpage, not a video file. Use a YouTube/Vimeo link, a direct .mp4 URL, or upload the file.",
    };
  }

  if (/^https?:\/\//i.test(url) && !FILE_EXT.test(url) && preferred === "video") {
    return {
      type: "unsupported",
      reason: "This link is not a playable video file. Paste a YouTube, Vimeo, Pexels video page, or a direct .mp4 URL.",
    };
  }

  return { type: "file", src: url, kind: preferred === "video" ? "video" : "image" };
}

/**
 * Short CMS hint for how a media URL will be used.
 * @example mediaHint(ytUrl) // "YouTube link — will embed in the hero."
 */
export function mediaHint(url: string) {
  const parsed = parsePlayableMedia(url, "video");
  if (parsed.type === "unsupported") return parsed.reason;
  if (youtubeVideoId(url)) return "YouTube link — will embed in the hero.";
  if (vimeoId(url)) return "Vimeo link — will embed in the hero.";
  if (pexelsVideoId(url)) return "Pexels page — will use the actual video file.";
  if (FILE_EXT.test(url)) return "Direct video file.";
  return "";
}
