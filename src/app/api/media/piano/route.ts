import { NextResponse } from "next/server";
import { loadContent } from "@/content/store";
import { youtubeVideoId } from "@/lib/media-url";

export const runtime = "nodejs";

/**
 * Opaque same-origin piano player. Resolves the YouTube URL only on the server
 * so public pages never receive the raw media URL in RSC/client props.
 */
export async function GET(req: Request) {
  const { site } = await loadContent();
  const videoId = youtubeVideoId(site.pianoYoutubeUrl ?? "");
  if (!videoId) {
    return new NextResponse("Piano media is not configured.", {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const url = new URL(req.url);
  const origin = encodeURIComponent(url.origin);
  const embed = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&playsinline=1&rel=0&modestbranding=1&controls=0&disablekb=1&fs=0&origin=${origin}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="robots" content="noindex"/>
  <title>Piano</title>
  <style>
    html,body{margin:0;height:100%;background:#000;overflow:hidden}
    iframe{border:0;width:100%;height:100%;position:fixed;inset:0}
  </style>
</head>
<body>
  <iframe
    src="${embed}"
    title="Piano music"
    allow="autoplay; encrypted-media"
    referrerpolicy="strict-origin-when-cross-origin"
  ></iframe>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
      "Referrer-Policy": "no-referrer",
    },
  });
}
