"use client";

import type { ThemeMode } from "@/content/types";
import { Metabox } from "../components/Metabox";
import { Field, HexColorInput } from "../fields";

export function ThemeOptionsPanel({
  defaultMode,
  allowToggle,
  onDefaultMode,
  onAllowToggle,
}: {
  defaultMode: ThemeMode;
  allowToggle: boolean;
  onDefaultMode: (mode: ThemeMode) => void;
  onAllowToggle: (allow: boolean) => void;
}) {
  return (
    <Metabox id="app_options" title="Theme options" badge={defaultMode}>
      <table className="wp-form-table">
        <tbody>
          <tr>
            <th scope="row">Default theme</th>
            <td>
              {(["system", "dark", "light"] as ThemeMode[]).map((mode) => (
                <label key={mode} className="wp-check">
                  <input
                    type="radio"
                    name="defaultMode"
                    checked={defaultMode === mode}
                    onChange={() => onDefaultMode(mode)}
                  />
                  {mode === "system" ? "Match the visitor’s system" : mode === "dark" ? "Dark" : "Light"}
                </label>
              ))}
            </td>
          </tr>
          <tr>
            <th scope="row">Visitor toggle</th>
            <td>
              <label className="wp-check">
                <input
                  type="checkbox"
                  checked={allowToggle}
                  onChange={(event) => onAllowToggle(event.target.checked)}
                />
                Show light/dark toggle in the header
              </label>
            </td>
          </tr>
        </tbody>
      </table>
    </Metabox>
  );
}

export function ThemeBrandPanel({
  brandFrom,
  brandTo,
  onBrandFrom,
  onBrandTo,
}: {
  brandFrom: string;
  brandTo: string;
  onBrandFrom: (value: string) => void;
  onBrandTo: (value: string) => void;
}) {
  return (
    <Metabox id="app_brand" title="Brand colors">
      <table className="wp-form-table">
        <tbody>
          <Field label="Brand from" hint="Logo, buttons, timeline start">
            <HexColorInput value={brandFrom} onChange={onBrandFrom} />
          </Field>
          <Field label="Brand to" hint="Gradient end">
            <HexColorInput value={brandTo} onChange={onBrandTo} />
          </Field>
        </tbody>
      </table>
    </Metabox>
  );
}
