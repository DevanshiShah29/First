import type { ReactNode } from "react";
import { NewTabHint } from "@/components/a11y";

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
      className="icon-btn rounded-full border border-line bg-chip p-3 transition-all duration-300 hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-accent-hover"
      aria-label={label}
    >
      {children}
      {external ? <NewTabHint /> : null}
    </a>
  );
}
