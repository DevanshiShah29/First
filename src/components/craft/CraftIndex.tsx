"use client";

// External dependencies
import { useEffect, useState } from "react";

export type CraftIndexItem = {
  id: string;
  label: string;
  count: number;
};

/**
 * Sticky group index for /craft; highlights the group currently in view.
 * @example <CraftIndex items={[{ id: "craft-group-0", label: "Systems", count: 3 }]} />
 */
export function CraftIndex({ items }: { items: CraftIndexItem[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const sectionIds = items.map((item) => item.id).join(" ");

  useEffect(() => {
    const ids = sectionIds ? sectionIds.split(" ") : [];
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const current = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (current) setActiveId(current.target.id);
      },
      { rootMargin: "-120px 0px -55% 0px", threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [sectionIds]);

  return (
    <nav aria-label="Craft sections" className="sticky top-24">
      <p className="text-2xs font-medium uppercase tracking-kicker-tight text-muted-soft">
        On this page
      </p>
      <ol className="mt-4 border-l border-line">
        {items.map((item, index) => {
          const active = item.id === activeId;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={active ? "location" : undefined}
                className={`-ml-px flex items-baseline gap-3 border-l-2 py-2.5 pl-4 text-sm transition-colors ${
                  active
                    ? "border-brand text-foreground"
                    : "border-transparent text-muted hover:border-line hover:text-foreground"
                }`}
              >
                <span
                  className={`text-2xs tabular-nums ${
                    active ? "text-accent-text" : "text-muted-soft"
                  }`}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="flex-1">{item.label}</span>
                <span className="text-2xs tabular-nums text-muted-soft">{item.count}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
