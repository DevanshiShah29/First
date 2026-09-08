"use client";

// Application services & types
import {
  DEFAULT_THEME,
  THEME_PALETTE_FIELDS,
  type ContentData,
  type ThemeMode,
} from "@/content/types";

// UI components
import { Metabox } from "../components/Metabox";
import { EditorTabs } from "../preview/EditorTabs";
import { LivePreviewShell } from "../preview/LivePreviewShell";
import { Field, HexColorInput } from "../fields";

interface AppearanceScreenProps {
  data: ContentData;
  setData: (data: ContentData) => void;
  save: () => Promise<void>;
  dirty: boolean;
}

/**
 * Renders theme color editors and live preview.
 * @example <AppearanceScreen data={data} setData={setData} … />
 */
export function AppearanceScreen({
  data,
  setData,
  save,
  dirty,
}: AppearanceScreenProps) {
  return (
    <>
      <h1 className="wp-screen-title">Appearance</h1>
      <p className="wp-sub">Colors and light/dark behavior for the public site. Each hex field shows a live preview.</p>
      <EditorTabs
        preview={<LivePreviewShell data={data} dirty={dirty} section="appearance" />}
      >
      <Metabox
        id="app_options"
        title="Theme options"
        badge={data.theme.defaultMode}
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
      <Metabox id="app_brand" title="Brand colors">
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
      </EditorTabs>
    </>
  );
}
