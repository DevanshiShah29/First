import { ImageResponse } from "next/og";
import { loadContent } from "@/content/store";

export const runtime = "nodejs";
export const alt = "Portfolio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  let name = "Portfolio";
  let line = "Product-minded work, clearly told.";
  try {
    const content = await loadContent();
    name = content.site.name || name;
    line = content.site.line?.trim() || content.site.description?.trim() || line;
  } catch {
    // DB unavailable at build/edge — keep defaults
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#F7F2E8",
          color: "#1C1917",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#8B4513",
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
          }}
        >
          Portfolio
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", fontSize: 72, lineHeight: 1.05, fontWeight: 700 }}>
            {name}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 32,
              lineHeight: 1.35,
              color: "#44403C",
              maxWidth: 920,
            }}
          >
            {line.length > 140 ? `${line.slice(0, 137)}…` : line}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            height: 8,
            width: 160,
            background: "#A85A3A",
            borderRadius: 4,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
