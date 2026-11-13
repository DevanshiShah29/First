"use client";

import { useState } from "react";
import type { SeasonConfig, SeasonPalette } from "@/content/seasons";
import { generateSeasonLook } from "@/lib/cms-client";
import { AiFormSection, AiGeneratePanel } from "../components/AiGeneratePanel";
import { Field, TextArea } from "../fields";
import { seasonName } from "./season-labels";

/**
 * Generate with AI for one festive season. Writes the palette.
 * @example <SeasonAiPanel items={items} selectedId="diwali" onSelect={setId} onApply={apply} />
 */
export function SeasonAiPanel({
  items,
  selectedId,
  onSelect,
  onApply,
}: {
  items: SeasonConfig[];
  selectedId: SeasonConfig["id"];
  onSelect: (id: SeasonConfig["id"]) => void;
  onApply: (id: SeasonConfig["id"], palette: SeasonPalette) => void;
}) {
  const item = items.find((season) => season.id === selectedId) ?? items[0];
  const [note, setNote] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasNote = Boolean(note.trim());

  /**
   * Requests a new palette, then writes it onto the season.
   * @example void onGenerate() // Promise
   */
  async function onGenerate() {
    if (!item || generating) return;
    setError(null);
    setGenerating(true);
    const result = await generateSeasonLook({
      seasonId: item.id,
      name: seasonName(item),
      note,
      palette: item.palette,
    });
    setGenerating(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onApply(item.id, result.data.palette);
  }

  if (!item) return null;

  return (
    <div className="wp-ai-stack wp-season-ai">
      <AiFormSection
        step={1}
        title="Sources for AI"
        description="Uses this season and its current colors. A look note is optional."
      >
        <ul className="wp-ai-source-summary">
          <li>
            <strong>Season</strong>
            <span>{seasonName(item)}</span>
          </li>
          <li>
            <strong>Current palette</strong>
            <span>
              {item.palette.brandFrom} → {item.palette.brandTo}
            </span>
          </li>
        </ul>
        <table className="wp-form-table">
          <tbody>
            <Field label="Season">
              <select
                className="wp-select"
                value={item.id}
                onChange={(event) => onSelect(event.target.value)}
              >
                {items.map((season) => (
                  <option key={season.id} value={season.id}>
                    {seasonName(season)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Look note" wide hint="Optional. Leave blank to restyle this season from its current colors.">
              <TextArea
                value={note}
                onChange={setNote}
                rows={3}
                placeholder="e.g. Softer gold, less maroon"
              />
            </Field>
          </tbody>
        </table>
      </AiFormSection>

      <AiGeneratePanel
        basisItems={[
          { label: seasonName(item), ready: true },
          { label: "Current palette", ready: true },
          { label: "Look note", ready: hasNote, optional: true },
        ]}
        fills="the palette"
        generating={generating}
        error={error}
        onGenerate={() => void onGenerate()}
      />
    </div>
  );
}
