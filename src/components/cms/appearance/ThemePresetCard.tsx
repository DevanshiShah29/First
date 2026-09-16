"use client";

import type { ThemePalette } from "@/content/types";
import { ColorPreviewStrip } from "./ColorPreviewStrip";

export type ThemeCardModel = {
  id: string;
  name: string;
  description: string;
  light: ThemePalette;
  dark: ThemePalette;
  kind: "preset" | "saved";
};

/**
 * Renders a theme preset / saved theme card with preview and actions.
 * @example <ThemePresetCard theme={…} active onApply={…} />
 */
export function ThemePresetCard({
  theme,
  active,
  onApply,
  onEdit,
  onDelete,
}: {
  theme: ThemeCardModel;
  active: boolean;
  onApply: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <article className={`wp-theme-card${active ? " is-active" : ""}`}>
      <div className="wp-theme-card-top">
        <div className="wp-theme-card-titles">
          <h3 className="wp-theme-card-name">
            {theme.name}
            {active ? <span className="wp-theme-active-pill">Active</span> : null}
          </h3>
          <p className="wp-theme-card-desc">{theme.description}</p>
        </div>
        <span className="wp-theme-card-kind">{theme.kind === "preset" ? "Preset" : "Saved"}</span>
      </div>

      <div className="wp-theme-card-previews">
        <div className="wp-theme-card-mode">
          <span className="wp-theme-card-mode-label">Light</span>
          <ColorPreviewStrip palette={theme.light} />
        </div>
        <div className="wp-theme-card-mode">
          <span className="wp-theme-card-mode-label">Dark</span>
          <ColorPreviewStrip palette={theme.dark} />
        </div>
      </div>

      <div className="wp-theme-card-actions">
        <button type="button" className="wp-btn wp-btn-primary wp-btn-small" onClick={onApply}>
          Apply
        </button>
        {onEdit ? (
          <button type="button" className="wp-btn wp-btn-small" onClick={onEdit}>
            Edit
          </button>
        ) : null}
        {onDelete ? (
          <button type="button" className="wp-btn wp-btn-small wp-btn-danger-outline" onClick={onDelete}>
            Delete
          </button>
        ) : null}
      </div>
    </article>
  );
}
