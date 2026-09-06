import type { ThemeContent, ThemeMode, ThemePalette } from "@/content/types";

/**
 * CSS custom properties for one theme palette.
 * @example paletteVars(dark, "25") // "--background:#…;…"
 */
function paletteVars(p: ThemePalette, orb: string) {
  return `--background:${p.background};--foreground:${p.foreground};--card:${p.card};--card-hover:${p.cardHover};--chip:${p.chip};--accent-text:${p.accentText};--accent-hover:${p.accentHover};--badge:${p.badge};--muted:color-mix(in srgb,var(--foreground) 58%,transparent);--muted-soft:color-mix(in srgb,var(--foreground) 38%,transparent);--border:color-mix(in srgb,var(--foreground) 10%,transparent);--header:color-mix(in srgb,var(--background) 94%,transparent);--inset:color-mix(in srgb,var(--background) 70%,transparent);--company-from:${p.accentText};--company-to:${p.accentHover};--skill-mono:${p.foreground};--orb-a:color-mix(in srgb,var(--brand-from) ${orb}%,transparent);--orb-b:color-mix(in srgb,var(--brand-to) ${Math.max(8, Number(orb) - 8)}%,transparent);`;
}

/**
 * Light/dark theme CSS string for injection.
 * @example themeCss(theme) // ':root,[data-theme="dark"]{…}'
 */
export function themeCss(theme: ThemeContent): string {
  const brand = `--brand-from:${theme.brandFrom};--brand-to:${theme.brandTo};`;
  return `:root,[data-theme="dark"]{color-scheme:dark;${brand}${paletteVars(theme.dark, "25")}}[data-theme="light"]{color-scheme:light;${brand}${paletteVars(theme.light, "16")}}`;
}

/**
 * Inline script that sets data-theme before paint.
 * @example themeInitScript("dark") // "(function(){…})();"
 */
export function themeInitScript(defaultMode: ThemeMode): string {
  const fallback = defaultMode === "light" ? "light" : "dark";
  return `(function(){try{var t=localStorage.getItem("theme");var d=${JSON.stringify(defaultMode)};if(t!=="light"&&t!=="dark"){if(d==="light"||d==="dark")t=d;else t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme",${JSON.stringify(fallback)});}})();`;
}
