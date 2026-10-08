import type { ReactNode } from "react";
import { Cormorant_Garamond, Space_Mono, Waiting_for_the_Sunrise } from "next/font/google";
import "@/app/memory-jar/jar-of-stars.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

const sunrise = Waiting_for_the_Sunrise({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-sunrise",
  display: "swap",
  fallback: ["cursive"],
  adjustFontFallback: false,
});

/**
 * Renders the memories layout with jar fonts.
 * @example default export for /memories
 */
export default function MemoriesLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${cormorant.variable} ${spaceMono.variable} ${sunrise.variable}`}>
      {children}
    </div>
  );
}
