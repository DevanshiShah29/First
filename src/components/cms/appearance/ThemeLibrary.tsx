"use client";

import { THEME_PRESETS } from "@/content/theme-presets";
import type { SavedTheme } from "@/content/types";
import { Metabox } from "../components/Metabox";
import { ThemePresetCard, type ThemeCardModel } from "./ThemePresetCard";

export function ThemeLibrary({
  presetCards,
  savedCards,
  savedThemes,
  activeThemeId,
  onApply,
  onEdit,
  onDelete,
}: {
  presetCards: ThemeCardModel[];
  savedCards: ThemeCardModel[];
  savedThemes: SavedTheme[];
  activeThemeId: string | null;
  onApply: (card: ThemeCardModel) => void;
  onEdit: (theme: SavedTheme) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Metabox id="app_presets" title="Theme Presets" badge={`${THEME_PRESETS.length} built-in`}>
      <p className="wp-theme-section-lede">
        Pick a professionally designed starting point. Apply updates the live palette immediately.
      </p>
      <div className="wp-theme-grid">
        {presetCards.map((card) => (
          <ThemePresetCard
            key={card.id}
            theme={card}
            active={activeThemeId === card.id}
            onApply={() => onApply(card)}
          />
        ))}
      </div>

      <div className="wp-theme-saved-block">
        <div className="wp-theme-saved-head">
          <h3 className="wp-theme-saved-title">My Themes</h3>
          <p className="wp-theme-saved-desc">
            Saved AI or custom palettes. Saving never replaces the active theme until you Apply.
          </p>
        </div>
        {savedCards.length === 0 ? (
          <p className="wp-theme-empty">No saved themes yet. Generate or customize a palette, then Save as theme.</p>
        ) : (
          <div className="wp-theme-grid">
            {savedCards.map((card) => (
              <ThemePresetCard
                key={card.id}
                theme={card}
                active={activeThemeId === card.id}
                onApply={() => onApply(card)}
                onEdit={() => {
                  const saved = savedThemes.find((theme) => theme.id === card.id);
                  if (saved) onEdit(saved);
                }}
                onDelete={() => onDelete(card.id)}
              />
            ))}
          </div>
        )}
      </div>
    </Metabox>
  );
}
