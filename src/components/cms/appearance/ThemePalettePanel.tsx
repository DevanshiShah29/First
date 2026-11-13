"use client";

import type { ReactNode } from "react";
import type { ThemePalette } from "@/content/types";
import { Metabox } from "../components/Metabox";
import { TextInput } from "../fields";
import { EditablePalette } from "./EditablePalette";

export function ThemePalettePanel({
  light,
  dark,
  onPaletteChange,
  checkPanel,
  generating,
  canRegenerate,
  onReset,
  onRegenerate,
  onApply,
  saveName,
  onSaveName,
  editingSaved,
  onSave,
}: {
  light: ThemePalette;
  dark: ThemePalette;
  onPaletteChange: (mode: "light" | "dark", next: ThemePalette) => void;
  checkPanel: ReactNode;
  generating: boolean;
  canRegenerate: boolean;
  onReset: () => void;
  onRegenerate: () => void;
  onApply: () => void;
  saveName: string;
  onSaveName: (value: string) => void;
  editingSaved: boolean;
  onSave: () => void;
}) {
  return (
    <Metabox id="app_palette_edit" title="Edit palette" badge="light + dark">
      <EditablePalette light={light} dark={dark} onChange={onPaletteChange} />

      {checkPanel}

      <div className="wp-theme-edit-actions">
        <button type="button" className="wp-btn" onClick={onReset}>
          Reset
        </button>
        <button
          type="button"
          className="wp-btn"
          disabled={generating || !canRegenerate}
          title="Generates a new palette from the prompt in Create with AI"
          onClick={onRegenerate}
        >
          Regenerate with AI
        </button>
        <button type="button" className="wp-btn wp-btn-primary" onClick={onApply}>
          Apply
        </button>
      </div>

      <div className="wp-theme-save-row">
        <TextInput
          value={saveName}
          onChange={onSaveName}
          placeholder="Theme name"
          aria-label="Theme name"
        />
        <button type="button" className="wp-btn" onClick={onSave}>
          {editingSaved ? "Update saved theme" : "Save as theme"}
        </button>
      </div>
      <p className="wp-description">
        Save adds the palette to My Themes without changing the active theme. Use Apply to push colors
        into the live preview and published palette.
      </p>
    </Metabox>
  );
}
