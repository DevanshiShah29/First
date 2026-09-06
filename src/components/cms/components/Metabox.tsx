"use client";

// External dependencies
import { useMemo, useState, type ReactNode } from "react";

export function Metabox({
  title,
  children,
  defaultOpen = true,
  isOpen: controlledOpen,
  badge,
  actions,
  id,
  className = "",
}: {
  title: string | ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  isOpen?: boolean;
  badge?: ReactNode;
  actions?: ReactNode;
  id?: string;
  className?: string;
}) {
  const storageKey = useMemo(() => {
    if (id) return `wp_metabox_${id}`;
    if (typeof title === "string") return `wp_metabox_${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
    return null;
  }, [id, title]);

  const [internalOpen, setInternalOpen] = useState(() => {
    if (typeof window === "undefined" || !storageKey) return defaultOpen;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) return stored === "true";
    } catch {
      // Ignore
    }
    return defaultOpen;
  });

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const toggle = () => {
    const next = !open;
    setInternalOpen(next);
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, String(next));
      } catch {
        // Ignore
      }
    }
  };

  const titleString = typeof title === "string" ? title : "";

  return (
    <section className={`wp-metabox${!open ? " is-collapsed" : ""}${className ? ` ${className}` : ""}`}>
      <div className="wp-metabox-h" onClick={toggle}>
        <div className="wp-metabox-h-title">
          <h2 className="wp-metabox-title-text">{title}</h2>
          {badge ? <span className="wp-metabox-badge">{badge}</span> : null}
        </div>
        <div className="wp-metabox-h-actions" onClick={(e) => e.stopPropagation()}>
          {actions}
          <button
            type="button"
            className="wp-metabox-toggle"
            aria-expanded={open}
            aria-label={open ? `Collapse ${titleString || "section"}` : `Expand ${titleString || "section"}`}
            title={open ? "Click to collapse" : "Click to expand"}
            onClick={(e) => {
              e.stopPropagation();
              toggle();
            }}
          >
            <svg
              className={`wp-metabox-toggle-icon${!open ? " is-collapsed" : ""}`}
              viewBox="0 0 20 20"
              width="20"
              height="20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </button>
        </div>
      </div>
      <div className="wp-metabox-b" hidden={!open}>
        {children}
      </div>
    </section>
  );
}

export function SectionTools({
  onExpandAll,
  onCollapseAll,
}: {
  onExpandAll: () => void;
  onCollapseAll: () => void;
}) {
  return (
    <div className="wp-section-tools">
      <span>Sections:</span>
      <button type="button" onClick={onExpandAll}>
        Expand all
      </button>
      <span>·</span>
      <button type="button" onClick={onCollapseAll}>
        Collapse all
      </button>
    </div>
  );
}
