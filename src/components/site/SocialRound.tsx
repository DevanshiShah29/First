import type { ReactNode } from "react";
import { NewTabHint } from "@/components/a11y";

/**
 * Renders a round social icon link.
 * @example <SocialRound href={url} label="GitHub"><IconGitHub /></SocialRound>
 */
export function SocialRound({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="icon-btn text-brand backgound-white rounded-full border border-line  p-3 transition-all duration-300 hover:border-brand/40 hover:bg-brand/10 hover:text-accent-hover"
      aria-label={label}>
      {children}
      {external ? <NewTabHint /> : null}
    </a>
  );
}
