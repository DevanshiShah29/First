import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { connection } from "next/server";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { SeasonLayer } from "@/components/season/SeasonLayer";
import { loadContent } from "@/content/store";
import { resolveActiveSeason, themeWithSeason } from "@/content/seasons";
import { buildPageMetadata } from "@/lib/seo";
import { siteOrigin } from "@/lib/site-url";
import { themeCss, themeInitScript } from "@/lib/theme";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

/**
 * Builds root layout metadata from CMS site fields.
 * @example generateMetadata() // Metadata
 */
export async function generateMetadata(): Promise<Metadata> {
  try {
    const content = await loadContent();
    return {
      metadataBase: new URL(siteOrigin()),
      ...buildPageMetadata({
        title: content.site.title || content.site.name,
        description: content.site.description,
        path: "/",
        siteName: content.site.name,
      }),
    };
  } catch {
    return {
      metadataBase: new URL(siteOrigin()),
      title: "Portfolio",
      description: "Personal portfolio.",
    };
  }
}

/**
 * Renders the root layout with theme CSS and font.
 * @example default export for /
 */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const content = await loadContent();
  await connection();
  const season = resolveActiveSeason(content.site.seasons, new Date());
  const theme = themeWithSeason(content.theme, season);
  return (
    <html
      lang="en"
      className={`${outfit.variable} antialiased`}
      data-season={season?.id}
      data-season-intensity={season?.intensity}
      suppressHydrationWarning
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeCss(theme) }} />
      </head>
      <body className="min-h-screen bg-background text-foreground">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript(theme.defaultMode) }}
        />
        {season?.intensity === "full" ? (
          <SeasonLayer season={season.id} images={season.ornamentImages} />
        ) : null}
        <GoogleAnalytics />
        <AnalyticsTracker />
        <Analytics />
        {children}
      </body>
    </html>
  );
}
