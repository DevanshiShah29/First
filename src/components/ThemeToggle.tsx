"use client";

import { IconMoon, IconSun } from "./icons";

function applyTheme(next: "light" | "dark") {
  document.documentElement.setAttribute("data-theme", next);
  try {
    localStorage.setItem("theme", next);
  } catch {
    /* private mode / blocked storage */
  }
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  function toggle() {
    const current = document.documentElement.getAttribute("data-theme");
    applyTheme(current === "light" ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md border-0 bg-transparent text-foreground transition hover:text-accent-hover ${className}`}
      aria-label="Toggle color theme"
    >
      <IconSun className="theme-toggle-icon theme-icon-sun" />
      <IconMoon className="theme-toggle-icon theme-icon-moon" />
    </button>
  );
}
