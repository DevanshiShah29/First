"use client";

// External dependencies
import { useEffect, useId, useState, type MouseEvent } from "react";
import Link from "next/link";

import {
  isNavHrefEnabled,
  isPublished,
  type CraftContent,
  type PublicSiteContent,
  type SiteContent,
} from "@/content/types";
import { useReducedMotion } from "@/hooks/reduced-motion";
import { scrollToHash } from "@/lib/scroll";

// UI components
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

// Icons
import { IconClose, IconMenu } from "./icons";

const homeNav = [
  { href: "#about", label: "About" },
  { href: "#projects", label: "Projects" },
  { href: "#skills", label: "Skills" },
  { href: "#contact", label: "Contact" },
] as const;

const pageNav = [
  { href: "/#about", label: "About" },
  { href: "/#projects", label: "Projects" },
  { href: "/#skills", label: "Skills" },
  { href: "/#contact", label: "Contact" },
] as const;

/**
 * Renders sticky primary navigation.
 * @example <SiteHeader name="Devanshi" allowToggle variant="home" />
 */
export function SiteHeader({
  name,
  allowToggle,
  variant = "page",
  site,
  craft,
}: {
  name: string;
  allowToggle: boolean;
  variant?: "home" | "page";
  site?: PublicSiteContent | SiteContent;
  craft?: CraftContent;
}) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const nav = (variant === "home" ? homeNav : pageNav).filter((item) =>
    isNavHrefEnabled(item.href, site?.sections),
  );
  const displayName = site?.name || name;
  const notesLabel = craft?.title?.trim() || "Notes";

  const mobilePages = [
    { href: "/reading", label: "Book Nook" },
    { href: "/memories", label: "Memories" },
    ...(craft && isPublished(craft.status) ? [{ href: "/craft", label: notesLabel }] : []),
  ].filter((item) => isNavHrefEnabled(item.href, site?.sections));

  useEffect(() => {
    /**
     * Closes the mobile menu on Escape.
     * @example onKey({ key: "Escape" }) // menu closed
     */
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 768 && open) {
        setOpen(false);
      }
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  /**
   * Handles in-page hash nav on the home header.
   * @example onHashLink(event, "#about") // scrolled
   */
  function onHashLink(e: MouseEvent<HTMLAnchorElement>, href: string) {
    if (variant !== "home" || !href.startsWith("#")) {
      setOpen(false);
      return;
    }
    e.preventDefault();
    const menuOpen = open;
    setOpen(false);
    window.setTimeout(
      () => {
        scrollToHash(href, Boolean(reduce));
        history.replaceState(null, "", href);
      },
      menuOpen ? 80 : 0,
    );
  }

  const inner = (
    <>
      <nav className="section-shell flex h-18 items-center justify-between" aria-label="Primary">
        {variant === "home" ? (
          <a
            href="#top"
            className="group inline-flex items-center rounded-md"
            onClick={(e) => onHashLink(e, "#top")}
          >
            <Logo name={displayName} />
          </a>
        ) : (
          <Link href="/" className="group inline-flex items-center rounded-md">
            <Logo name={displayName} />
          </Link>
        )}
        <div className="flex items-center gap-3">
          {nav.length ? (
            <ul className="hidden items-center gap-8 md:flex">
              {nav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="nav-link text-sm"
                    onClick={(e) => onHashLink(e, item.href)}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
          {allowToggle ? <ThemeToggle /> : null}
          <button
            type="button"
            className="icon-btn inline-flex rounded-md border border-line p-2 text-foreground md:hidden"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </nav>

      {/* Full-width slide-over menu panel (opens from right to left) */}
      <aside
        id={menuId}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!open}
        className={`fixed inset-0 z-50 flex h-full w-full flex-col bg-background transition-transform duration-300 ease-in-out md:hidden ${
          open ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
      >
        <div className="section-shell flex h-18 items-center justify-between border-b border-line">
          {variant === "home" ? (
            <a
              href="#top"
              className="group inline-flex items-center rounded-md"
              onClick={(e) => onHashLink(e, "#top")}
            >
              <Logo name={displayName} />
            </a>
          ) : (
            <Link
              href="/"
              className="group inline-flex items-center rounded-md"
              onClick={() => setOpen(false)}
            >
              <Logo name={displayName} />
            </Link>
          )}
          <button
            type="button"
            className="icon-btn rounded-md border border-line p-2 text-foreground"
            aria-label="Close navigation menu"
            onClick={() => setOpen(false)}
          >
            <IconClose />
          </button>
        </div>

        <div className="section-shell flex flex-1 flex-col justify-between overflow-y-auto py-8">
          <nav aria-label="Mobile navigation">
            {nav.length ? (
              <ul className="space-y-1">
                {nav.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className="block rounded-lg px-3 py-2.5 text-base font-medium text-muted transition hover:bg-brand/10 hover:text-accent-hover"
                      onClick={(e) => onHashLink(e, item.href)}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
            {nav.length && mobilePages.length ? <div className="my-4 border-t border-line" /> : null}
            {mobilePages.length ? (
              <ul className="space-y-1">
                {mobilePages.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="block rounded-lg px-3 py-2.5 text-base font-medium text-muted transition hover:bg-brand/10 hover:text-accent-hover"
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </nav>

          {allowToggle ? (
            <div className="mt-8 border-t border-line pt-4 flex items-center justify-between">
              <span className="text-2xs font-medium uppercase tracking-kicker-tight text-muted-soft">
                Theme
              </span>
              <ThemeToggle />
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );

  return (
    <header id="site-header" className="site-header sticky top-0 z-50 border-b border-line">
      {inner}
    </header>
  );
}
