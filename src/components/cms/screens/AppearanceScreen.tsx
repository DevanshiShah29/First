"use client";

import {
  DEFAULT_THEME,
  THEME_PALETTE_FIELDS,
  type ContentData,
  type ThemeMode,
} from "@/content/types";
import { AppearancePreview } from "../components/AppearancePreview";
import { Metabox, SectionTools } from "../components/Metabox";
import { Field, HexColorInput } from "../fields";

interface AppearanceScreenProps {
  data: ContentData;
  setData: (data: ContentData) => void;
  sectionState: Record<string, boolean>;
  expandAll: (ids: string[]) => void;
  collapseAll: (ids: string[]) => void;
  save: () => Promise<void>;
  dirty: boolean;
}

export function AppearanceScreen({
  data,
  setData,
  sectionState,
  expandAll,
  collapseAll,
  save,
  dirty,
}: AppearanceScreenProps) {
  const site = data.site;

  return (
    <>
      <h1 className="wp-screen-title">Appearance</h1>
      <p className="wp-sub">Colors and light/dark behavior for the public site. Each hex field shows a live preview.</p>
      <SectionTools
        onExpandAll={() =>
          expandAll(["app_preview", "app_options", "app_brand", "app_palette_dark", "app_palette_light"])
        }
        onCollapseAll={() =>
          collapseAll(["app_preview", "app_options", "app_brand", "app_palette_dark", "app_palette_light"])
        }
      />
      <Metabox id="app_preview" title="Live Preview" isOpen={sectionState["app_preview"]}>
        <AppearancePreview theme={data.theme} site={site} />
      </Metabox>
      <Metabox
        id="app_options"
        title="Theme options"
        badge={data.theme.defaultMode}
        isOpen={sectionState["app_options"]}
      >
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
                      checked={data.theme.defaultMode === mode}
                      onChange={() =>
                        setData({ ...data, theme: { ...data.theme, defaultMode: mode } })
                      }
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
                    checked={data.theme.allowToggle}
                    onChange={(e) =>
                      setData({ ...data, theme: { ...data.theme, allowToggle: e.target.checked } })
                    }
                  />
                  Show light/dark toggle in the header
                </label>
              </td>
            </tr>
          </tbody>
        </table>
      </Metabox>
      <Metabox id="app_brand" title="Brand colors" isOpen={sectionState["app_brand"]}>
        <table className="wp-form-table">
          <tbody>
            <Field label="Brand from" hint="Logo, buttons, timeline start">
              <HexColorInput
                value={data.theme.brandFrom}
                onChange={(brandFrom) => setData({ ...data, theme: { ...data.theme, brandFrom } })}
              />
            </Field>
            <Field label="Brand to" hint="Gradient end">
              <HexColorInput
                value={data.theme.brandTo}
                onChange={(brandTo) => setData({ ...data, theme: { ...data.theme, brandTo } })}
              />
            </Field>
          </tbody>
        </table>
      </Metabox>
      {(["dark", "light"] as const).map((mode) => (
        <Metabox
          key={mode}
          id={`app_palette_${mode}`}
          title={mode === "dark" ? "Dark palette" : "Light palette"}
          badge={mode}
          isOpen={sectionState[`app_palette_${mode}`]}
        >
          <table className="wp-form-table">
            <tbody>
              {THEME_PALETTE_FIELDS.map((field) => (
                <Field key={field.key} label={field.label}>
                  <HexColorInput
                    value={data.theme[mode][field.key]}
                    onChange={(value) =>
                      setData({
                        ...data,
                        theme: {
                          ...data.theme,
                          [mode]: { ...data.theme[mode], [field.key]: value },
                        },
                      })
                    }
                  />
                </Field>
              ))}
            </tbody>
          </table>
        </Metabox>
      ))}
      <p>
        <button
          type="button"
          className="wp-btn wp-btn-primary wp-btn-large"
          onClick={() => void save()}
          disabled={!dirty}
        >
          Save Changes
        </button>
        <button
          type="button"
          className="wp-btn"
          style={{ marginLeft: 8 }}
          onClick={() => setData({ ...data, theme: structuredClone(DEFAULT_THEME) })}
        >
          Reset to defaults
        </button>
      </p>
    </>
  );
}
