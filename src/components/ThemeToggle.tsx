"use client";

// External dependencies
import { useCallback, useSyncExternalStore } from "react";

// Icons
import { IconMoon, IconSun } from "./icons";

function applyTheme(next: "light" | "dark") {
  document.documentElement.setAttribute("data-theme", next);
  try {
    localStorage.setItem("theme", next);
  } catch {
    /* private mode / blocked storage */
  }
}

function readTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

function subscribe(onStoreChange: () => void) {
  const root = document.documentElement;
  const obs = new MutationObserver(onStoreChange);
  obs.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "dark" as const);

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
