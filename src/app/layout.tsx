import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { loadContent } from "@/content/store";
import { themeCss, themeInitScript } from "@/lib/theme";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Devanshi Shah | Product Manager Portfolio",
  description:
    "Portfolio of Devanshi Shah — product-minded engineer turning messy problems into products people actually use.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const content = await loadContent();
  return (
    <html lang="en" className={`${outfit.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript(content.theme.defaultMode) }} />
        <style dangerouslySetInnerHTML={{ __html: themeCss(content.theme) }} />
      </head>
      <body className="min-h-screen bg-background text-foreground">{children}</body>
    </html>
  );
}
