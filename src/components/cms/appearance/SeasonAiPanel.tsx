"use client";

import { useState } from "react";
import type { SeasonConfig, SeasonPalette } from "@/content/seasons";
import { generateSeasonLook } from "@/lib/cms-client";
import { AiFormSection, AiGeneratePanel } from "../components/AiGeneratePanel";
import { Field, TextArea } from "../fields";
import { seasonName } from "./season-labels";

/**
 * Generate with AI for the season open in the editor. Writes its palette.
 * The note is controlled so switching seasons keeps each season's draft note.
 * @example <SeasonAiPanel item={item} note={note} onNote={setNote} onApply={applyPalette} />
 */
export function SeasonAiPanel({
  item,
  note,
  onNote,
  onApply,
}: {
  item: SeasonConfig;
  note: string;
  onNote: (note: string) => void;
  onApply: (palette: SeasonPalette) => void;
}) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasNote = Boolean(note.trim());
  const name = seasonName(item);

  /**
   * Requests a new palette, then writes it onto the open season.
   * @example void onGenerate() // Promise
   */
  async function onGenerate() {
    if (generating) return;
    setError(null);
    setGenerating(true);
    const result = await generateSeasonLook({
      seasonId: item.id,
      name,
      note,
      palette: item.palette,
    });
    setGenerating(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onApply(result.data.palette);
  }

  return (
    <div className="wp-ai-stack wp-season-ai">
      <AiFormSection
        step={1}
        title="Generate a palette"
        description={`Restyle ${name} from its current colors. A look note is optional.`}
      >
        <ul className="wp-ai-source-summary">
          <li>
            <strong>Season</strong>
            <span>{name}</span>
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
            <Field
              label="Look note"
              wide
              hint="Optional. Leave blank to restyle this season from its current colors."
            >
              <TextArea
                value={note}
                onChange={onNote}
                rows={3}
                placeholder="e.g. Softer gold, less maroon"
              />
            </Field>
          </tbody>
        </table>
      </AiFormSection>

      <AiGeneratePanel
        basisItems={[
          { label: name, ready: true },
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
