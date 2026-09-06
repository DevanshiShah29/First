"use client";

// External dependencies
import { useCallback, useSyncExternalStore } from "react";

// Icons
import { IconMoon, IconSun } from "./icons";

/**
 * Applies theme to <html> and persists it.
 * @example applyTheme("dark") // data-theme="dark"
 */
function applyTheme(next: "light" | "dark") {
  document.documentElement.setAttribute("data-theme", next);
  try {
    localStorage.setItem("theme", next);
  } catch {
    /* private mode / blocked storage */
  }
}

/**
 * Reads the current theme from the document.
 * @example readTheme() // "light" | "dark"
 */
function readTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

/**
 * Subscribes to data-theme mutations.
 * @example subscribe(onChange) // unsubscribe
 */
function subscribe(onStoreChange: () => void) {
  const root = document.documentElement;
  const obs = new MutationObserver(onStoreChange);
  obs.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}

/**
 * Renders the light/dark mode switch.
 * @example <ThemeToggle className="ml-2" />
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "dark" as const);

  /**
   * Flips between light and dark themes.
   * @example toggle() // opposite theme
   */
  const toggle = useCallback(() => {
    applyTheme(theme === "light" ? "dark" : "light");
  }, [theme]);

  return (
    <button
      type="button"
      onClick={toggle}
      className={`icon-btn inline-flex items-center justify-center rounded-md border-0 bg-transparent text-foreground transition hover:text-accent-hover ${className}`}
      role="switch"
      aria-checked={theme === "dark"}
      aria-label="Dark mode"
    >
      <IconSun className="theme-toggle-icon theme-icon-sun" />
      <IconMoon className="theme-toggle-icon theme-icon-moon" />
    </button>
  );
}
