export const STAR_COLORS = [
  "pink",
  "yellow",
  "sage",
  "sky",
  "coral",
  "lavender",
  "mint",
  "peach",
] as const;

export type StarColor = (typeof STAR_COLORS)[number];

export type PaperTheme = {
  paper: string;
  paperLight: string;
  paperDeep: string;
  ink: string;
  inkMuted: string;
  border: string;
  photoBorder: string;
  line: string;
  background: string;
  backgroundDark: string;
};

export const PAPER_THEMES: Record<StarColor, PaperTheme> = {
  pink: {
    paper: "#E8D8D4",
    paperLight: "#F7F0ED",
    paperDeep: "#D9C8C3",
    ink: "#3A322C",
    inkMuted: "#6E6258",
    border: "rgba(90, 72, 68, 0.22)",
    photoBorder: "#FAF6F4",
    line: "rgba(90, 72, 68, 0.08)",
    background: "radial-gradient(circle at 50% 35%, #fce7ef 0%, #f6cadc 50%, #e5a5bd 100%)",
    backgroundDark: "radial-gradient(circle at 50% 35%, #381a28 0%, #26111b 55%, #170910 100%)",
  },
  yellow: {
    paper: "#E8DFC8",
    paperLight: "#F8F3E4",
    paperDeep: "#D9CEB4",
    ink: "#3A3428",
    inkMuted: "#6E6554",
    border: "rgba(100, 88, 58, 0.22)",
    photoBorder: "#FAF7EE",
    line: "rgba(100, 88, 58, 0.08)",
    background: "radial-gradient(circle at 50% 35%, #fef7dc 0%, #faeab2 50%, #eed580 100%)",
    backgroundDark: "radial-gradient(circle at 50% 35%, #362c12 0%, #251e0c 55%, #161206 100%)",
  },
  sage: {
    paper: "#DDE2D4",
    paperLight: "#F2F4ED",
    paperDeep: "#CDD4C4",
    ink: "#2E3428",
    inkMuted: "#5A6250",
    border: "rgba(72, 82, 62, 0.22)",
    photoBorder: "#F6F7F2",
    line: "rgba(72, 82, 62, 0.08)",
    background: "radial-gradient(circle at 50% 35%, #e6ece3 0%, #d1ded0 50%, #b2c6b0 100%)",
    backgroundDark: "radial-gradient(circle at 50% 35%, #1e281c 0%, #141c13 55%, #0b100a 100%)",
  },
  sky: {
    paper: "#D8DEE4",
    paperLight: "#F0F3F6",
    paperDeep: "#C8D0D8",
    ink: "#2C3238",
    inkMuted: "#566068",
    border: "rgba(68, 78, 90, 0.22)",
    photoBorder: "#F4F6F8",
    line: "rgba(68, 78, 90, 0.08)",
    background: "radial-gradient(circle at 50% 35%, #e2f0fb 0%, #cbe3f7 50%, #a8cfed 100%)",
    backgroundDark: "radial-gradient(circle at 50% 35%, #18283b 0%, #101c2a 55%, #091019 100%)",
  },
  coral: {
    paper: "#E8DCD2",
    paperLight: "#F7F1EA",
    paperDeep: "#D9CBC0",
    ink: "#3A3028",
    inkMuted: "#6E6054",
    border: "rgba(98, 78, 62, 0.22)",
    photoBorder: "#FAF6F2",
    line: "rgba(98, 78, 62, 0.08)",
    background: "radial-gradient(circle at 50% 35%, #fdeae4 0%, #fad0c3 50%, #f0a790 100%)",
    backgroundDark: "radial-gradient(circle at 50% 35%, #3a1d17 0%, #28130f 55%, #180a08 100%)",
  },
  lavender: {
    paper: "#E0DAE4",
    paperLight: "#F3F0F5",
    paperDeep: "#D0C8D4",
    ink: "#342E38",
    inkMuted: "#625A68",
    border: "rgba(82, 72, 90, 0.22)",
    photoBorder: "#F7F5F8",
    line: "rgba(82, 72, 90, 0.08)",
    background: "radial-gradient(circle at 50% 35%, #ede5f7 0%, #dfd2f0 50%, #cebde1 100%)",
    backgroundDark: "radial-gradient(circle at 50% 35%, #2a1e3c 0%, #1c1429 55%, #120c1c 100%)",
  },
  mint: {
    paper: "#D6E4DC",
    paperLight: "#EFF5F1",
    paperDeep: "#C6D6CC",
    ink: "#2A3430",
    inkMuted: "#56625C",
    border: "rgba(68, 88, 78, 0.22)",
    photoBorder: "#F4F8F6",
    line: "rgba(68, 88, 78, 0.08)",
    background: "radial-gradient(circle at 50% 35%, #e2f3e8 0%, #cae8d4 50%, #a7d6b8 100%)",
    backgroundDark: "radial-gradient(circle at 50% 35%, #162f22 0%, #0e2017 55%, #08130d 100%)",
  },
  peach: {
    paper: "#E8DDD0",
    paperLight: "#F7F1E8",
    paperDeep: "#D9CEC0",
    ink: "#3A3228",
    inkMuted: "#6E6256",
    border: "rgba(98, 82, 64, 0.22)",
    photoBorder: "#FAF6F0",
    line: "rgba(98, 82, 64, 0.08)",
    background: "radial-gradient(circle at 50% 35%, #fdeee5 0%, #fbd8c5 50%, #f1b79b 100%)",
    backgroundDark: "radial-gradient(circle at 50% 35%, #382117 0%, #27160f 55%, #170c07 100%)",
  },
};

const ALIASES: Record<string, StarColor> = {
  pink: "pink",
  yellow: "yellow",
  butter: "yellow",
  sage: "sage",
  mint: "mint",
  sky: "sky",
  coral: "coral",
  lavender: "lavender",
  peach: "peach",
  // Portfolio hex accents → nearest paper-star colors
  "#a78bfa": "lavender",
  "#7c3aed": "lavender",
  "#8b5cf6": "lavender",
  "#6366f1": "sky",
  "#4f46e5": "sky",
  "#fbbf24": "yellow",
  "#f59e0b": "yellow",
  "#f472b6": "pink",
  "#ec4899": "pink",
  "#db2777": "pink",
  "#34d399": "mint",
  "#10b981": "mint",
  "#059669": "sage",
  "#60a5fa": "sky",
  "#2563eb": "sky",
  "#fb7185": "coral",
  "#e11d48": "coral",
  "#fdba74": "peach",
  "#ea580c": "peach",
  "#f97316": "peach",
};
export function resolveStarColor(color?: string, seed = ""): StarColor {
  if (!color) {
    let hash = 0;
    const key = seed || "yellow";
    for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    return STAR_COLORS[hash % STAR_COLORS.length];
  }
  const key = color.trim().toLowerCase();
  if (key in ALIASES) return ALIASES[key];
  if ((STAR_COLORS as readonly string[]).includes(key)) return key as StarColor;
  let hash = 0;
  const source = seed || color;
  for (let i = 0; i < source.length; i++) hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
  return STAR_COLORS[hash % STAR_COLORS.length];
}

export const JAR_ASSETS = {
  masonJar: "/memory-jar/mason-jar.png",
  masonJarDark: "/memory-jar/mason-jar-dark.png",
  parchment: "/memory-jar/parchment.png",
  cursor: "/memory-jar/cursor-star.png",
  star: (color: StarColor) => `/memory-jar/stars/${color}.png`,
  paper: (color: StarColor) => `/memory-jar/papers/${color}.png`,
} as const;

/** Inner jar star window, matching alittlejarofstars proportions. */
export const JAR_STAR_BOUNDS = {
  left: 29,
  right: 71,
  top: 23,
  bottom: 74,
} as const;
