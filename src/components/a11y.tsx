"use client";

// External dependencies
import { type MouseEvent, type ReactNode } from "react";

// Application services & types
import { useReducedMotion } from "@/hooks/reduced-motion";
import { scrollToHash } from "@/lib/scroll";

export function NewTabHint() {
  return <span className="sr-only"> (opens in a new tab)</span>;
}

export function SkipLink({
  href = "#main-content",
  children = "Skip to content",
}: {
  href?: string;
  children?: ReactNode;
}) {
  const reduce = useReducedMotion();

  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    if (!href.startsWith("#")) return;
    e.preventDefault();
    scrollToHash(href, Boolean(reduce));
  }

  return (
    <a href={href} className="skip" onClick={onClick}>
      {children}
    </a>
  );
}
