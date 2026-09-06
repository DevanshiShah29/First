"use client";

// External dependencies
import { useEffect, useId, useState, type MouseEvent } from "react";
import Link from "next/link";

// Application services & types
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
}: {
  name: string;
  allowToggle: boolean;
  variant?: "home" | "page";
}) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const nav = variant === "home" ? homeNav : pageNav;

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
            <Logo name={name} />
          </a>
        ) : (
          <Link href="/" className="group inline-flex items-center rounded-md">
            <Logo name={name} />
          </Link>
        )}
        <div className="flex items-center gap-3">
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
      <ul
        id={menuId}
        className={
          open
            ? "section-shell flex flex-col gap-3 border-t border-line py-4 md:hidden"
            : "hidden"
        }
      >
        {nav.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              className="block py-2 text-sm text-muted transition hover:text-accent-hover"
              onClick={(e) => onHashLink(e, item.href)}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </>
  );

  return (
    <header id="site-header" className="site-header sticky top-0 z-50 border-b border-line">
      {inner}
    </header>
  );
}
