import type { BreadcrumbItem } from "../types";

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null;

  return (
    <nav className="wp-breadcrumbs" aria-label="Breadcrumbs">
      <ol className="wp-breadcrumbs-list">
        {items.map((item, i) => {
          const isLast = i === items.length - 1 || item.current;
          return (
            <li key={i} className={`wp-breadcrumbs-item${isLast ? " is-current" : ""}`}>
              {isLast || !item.onClick ? (
                <span aria-current={isLast ? "page" : undefined}>{item.label}</span>
              ) : (
                <button type="button" onClick={item.onClick} className="wp-breadcrumbs-link">
                  {item.label}
                </button>
              )}
              {!isLast ? <span className="wp-breadcrumbs-sep" aria-hidden>›</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
