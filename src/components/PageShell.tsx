"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import type { ContentData } from "@/content/types";
import { Cursor } from "./Cursor";
import { Logo } from "./Logo";
import { SiteFooter } from "./SiteFooter";
import { ThemeToggle } from "./ThemeToggle";
import { IconClose, IconMenu } from "./icons";

const nav = [
  { href: "/#about", label: "About" },
  { href: "/#projects", label: "Projects" },
  { href: "/#skills", label: "Skills" },
  { href: "/#contact", label: "Contact" },
] as const;

export function PageShell({
  content,
  children,
}: {
  content: ContentData;
  children: ReactNode;
}) {
  const { site } = content;
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Cursor />
      <a href="#library" className="skip">
        Skip to content
      </a>
      <header id="site-header" className="sticky top-0 z-50 border-b border-line bg-header backdrop-blur-xl">
        <nav className="section-shell flex h-18 items-center justify-between">
          <Link href="/" className="group inline-flex items-center">
            <Logo name={site.name} />
          </Link>
          <div className="flex items-center gap-3">
            <ul className="hidden items-center gap-8 md:flex">
              {nav.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="nav-link text-sm">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            {content.theme.allowToggle ? <ThemeToggle /> : null}
            <button
              type="button"
              className="inline-flex rounded-md border border-line p-2 text-foreground md:hidden"
              aria-label={open ? "Close navigation menu" : "Toggle navigation menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <IconClose /> : <IconMenu />}
            </button>
          </div>
        </nav>
        {open ? (
          <ul className="section-shell flex flex-col gap-3 border-t border-line py-4 md:hidden">
            {nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="block py-1 text-sm text-muted transition hover:text-accent-hover"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </header>
      <main className="w-full">{children}</main>
      <SiteFooter site={site} />
    </div>
  );
}
