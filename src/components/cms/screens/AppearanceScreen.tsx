"use client";

// External dependencies
import { useCallback, useMemo, useState } from "react";

// Application services & types
import { THEME_PRESETS } from "@/content/theme-presets";
import {
  DEFAULT_THEME,
  type ContentData,
  type SavedTheme,
  type ThemeMode,
  type ThemePalette,
} from "@/content/types";
import {
  generateThemePalette,
  improveThemePalette,
} from "@/lib/cms-client";
import {
  applyAllSuggestions,
  applyPaletteSuggestion,
  checkPalette,
  type PaletteIssue,
} from "@/lib/theme-contrast";

// UI components
import { EditablePalette } from "../appearance/EditablePalette";
import { ThemePresetCard, type ThemeCardModel } from "../appearance/ThemePresetCard";
import { CmsSaveButton, type CmsSaveStatus } from "../components/CmsSaveButton";
import { Metabox } from "../components/Metabox";
import { Field, HexColorInput, TextInput } from "../fields";
import { EditorTabs } from "../preview/EditorTabs";
import { LivePreviewShell } from "../preview/LivePreviewShell";

interface AppearanceScreenProps {
  data: ContentData;
  setData: (data: ContentData) => void;
  save: () => Promise<void>;
  dirty: boolean;
  status: CmsSaveStatus;
}

type DraftTheme = {
  name: string;
  description: string;
  brandFrom: string;
  brandTo: string;
  light: ThemePalette;
  dark: ThemePalette;
};

/**
 * Creates a draft snapshot from the live theme content.
 * @example draftFromTheme(data.theme) // DraftTheme
 */
function draftFromTheme(theme: ContentData["theme"]): DraftTheme {
  return {
    name: "Current theme",
    description: "Working palette",
    brandFrom: theme.brandFrom,
    brandTo: theme.brandTo,
    light: { ...theme.light },
    dark: { ...theme.dark },
  };
}

/**
 * Builds a new saved-theme id.
 * @example newSavedId() // "saved-…"
 */
function newSavedId(): string {
  return `saved-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Appearance CMS screen: presets, AI generator, editable palette, live preview.
 * @example <AppearanceScreen data={data} setData={setData} … />
 */
export function AppearanceScreen({
  data,
  setData,
  save,
  dirty,
  status,
}: AppearanceScreenProps) {
  const [draft, setDraft] = useState<DraftTheme>(() => draftFromTheme(data.theme));
  const [paletteMode, setPaletteMode] = useState<"light" | "dark">("light");
  const [aiPrompt, setAiPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [checkSummary, setCheckSummary] = useState<string | null>(null);
  const [issues, setIssues] = useState<PaletteIssue[]>([]);
  const [saveName, setSaveName] = useState("");
  const [editingSavedId, setEditingSavedId] = useState<string | null>(null);
  const [baseline, setBaseline] = useState<DraftTheme>(() => draftFromTheme(data.theme));

  const savedThemes = useMemo(
    () => data.theme.savedThemes ?? [],
    [data.theme.savedThemes],
  );
  const activeThemeId = data.theme.activeThemeId ?? null;

  const presetCards: ThemeCardModel[] = useMemo(
    () =>
      THEME_PRESETS.map((preset) => ({
        id: preset.id,
        name: preset.name,
        description: preset.description,
        light: preset.light,
        dark: preset.dark,
        kind: "preset" as const,
      })),
    [],
  );

  const savedCards: ThemeCardModel[] = useMemo(
    () =>
      savedThemes.map((theme) => ({
        id: theme.id,
        name: theme.name,
        description: theme.description || "Saved custom palette",
        light: theme.light,
        dark: theme.dark,
        kind: "saved" as const,
      })),
    [savedThemes],
  );

  /**
   * Updates one mode of the draft palette, syncs live preview, clears check results.
   * @example updateDraftPalette(nextLight) // void
   */
  const updateDraftPalette = useCallback(
    (next: ThemePalette) => {
      const updated: DraftTheme = {
        ...draft,
        [paletteMode]: next,
      };
      setDraft(updated);
      setData({
        ...data,
        theme: {
          ...data.theme,
          light: updated.light,
          dark: updated.dark,
          brandFrom: updated.brandFrom,
          brandTo: updated.brandTo,
          activeThemeId: null,
        },
      });
      setIssues([]);
      setCheckSummary(null);
      setCheckError(null);
    },
    [data, draft, paletteMode, setData],
  );

  /**
   * Writes a draft into the live site theme (preview + publishable state).
   * @example applyDraft(draft, "sage") // void
   */
  const applyDraft = useCallback(
    (next: DraftTheme, activeId: string | null) => {
      setData({
        ...data,
        theme: {
          ...data.theme,
          brandFrom: next.brandFrom,
          brandTo: next.brandTo,
          light: { ...next.light },
          dark: { ...next.dark },
          activeThemeId: activeId,
        },
      });
      setDraft(next);
      setBaseline(next);
      setIssues([]);
      setCheckSummary(null);
    },
    [data, setData],
  );

  /**
   * Applies a built-in or saved theme card immediately.
   * @example applyThemeCard(card) // void
   */
  const applyThemeCard = useCallback(
    (card: ThemeCardModel) => {
      const preset = THEME_PRESETS.find((p) => p.id === card.id);
      const saved = savedThemes.find((t) => t.id === card.id);
      const next: DraftTheme = {
        name: card.name,
        description: card.description,
        brandFrom: preset?.brandFrom ?? saved?.brandFrom ?? data.theme.brandFrom,
        brandTo: preset?.brandTo ?? saved?.brandTo ?? data.theme.brandTo,
        light: { ...card.light },
        dark: { ...card.dark },
      };
      applyDraft(next, card.id);
      setEditingSavedId(card.kind === "saved" ? card.id : null);
      setSaveName(card.kind === "saved" ? card.name : "");
    },
    [applyDraft, data.theme.brandFrom, data.theme.brandTo, savedThemes],
  );

  /**
   * Loads a saved theme into the editor without applying.
   * @example editSavedTheme(theme) // void
   */
  const editSavedTheme = useCallback((theme: SavedTheme) => {
    const next: DraftTheme = {
      name: theme.name,
      description: theme.description || "Saved custom palette",
      brandFrom: theme.brandFrom,
      brandTo: theme.brandTo,
      light: { ...theme.light },
      dark: { ...theme.dark },
    };
    setDraft(next);
    setBaseline(next);
    setEditingSavedId(theme.id);
    setSaveName(theme.name);
    setIssues([]);
    setCheckSummary(null);
  }, []);

  /**
   * Deletes a saved theme from the library.
   * @example deleteSavedTheme(id) // void
   */
  const deleteSavedTheme = useCallback(
    (id: string) => {
      const nextSaved = savedThemes.filter((t) => t.id !== id);
      setData({
        ...data,
        theme: {
          ...data.theme,
          savedThemes: nextSaved,
          activeThemeId: activeThemeId === id ? null : activeThemeId,
        },
      });
      if (editingSavedId === id) {
        setEditingSavedId(null);
        setSaveName("");
      }
    },
    [activeThemeId, data, editingSavedId, savedThemes, setData],
  );

  /**
   * Calls AI to generate a cohesive light+dark palette from the prompt.
   * @example void generateTheme() // Promise
   */
  const generateTheme = async () => {
    setGenerating(true);
    setGenerateError(null);
    const result = await generateThemePalette({
      prompt: aiPrompt,
      seedLight: draft.light,
      seedDark: draft.dark,
    });
    setGenerating(false);
    if (!result.ok) {
      setGenerateError(result.error);
      return;
    }
    const next: DraftTheme = {
      name: result.data.name,
      description: result.data.description,
      brandFrom: result.data.brandFrom,
      brandTo: result.data.brandTo,
      light: result.data.light,
      dark: result.data.dark,
    };
    setDraft(next);
    setBaseline(next);
    setSaveName(result.data.name);
    setEditingSavedId(null);
    setIssues([]);
    setCheckSummary(null);
    // Live preview: apply immediately so preview updates as requested
    applyDraft(next, null);
  };

  /**
   * Resets the draft to the last baseline (generated or applied).
   * @example resetDraft() // void
   */
  const resetDraft = () => {
    const next = structuredClone(baseline);
    setDraft(next);
    setData({
      ...data,
      theme: {
        ...data.theme,
        brandFrom: next.brandFrom,
        brandTo: next.brandTo,
        light: { ...next.light },
        dark: { ...next.dark },
      },
    });
    setIssues([]);
    setCheckSummary(null);
    setCheckError(null);
  };

  /**
   * Saves the current draft into My Themes (does not auto-activate).
   * @example saveAsTheme() // void
   */
  const saveAsTheme = () => {
    const name = (saveName.trim() || draft.name || "Untitled theme").slice(0, 80);
    const now = new Date().toISOString();
    if (editingSavedId) {
      const nextSaved = savedThemes.map((theme) =>
        theme.id === editingSavedId
          ? {
              ...theme,
              name,
              description: draft.description,
              brandFrom: draft.brandFrom,
              brandTo: draft.brandTo,
              light: { ...draft.light },
              dark: { ...draft.dark },
              updatedAt: now,
            }
          : theme,
      );
      setData({
        ...data,
        theme: { ...data.theme, savedThemes: nextSaved },
      });
      setSaveName(name);
      return;
    }

    const entry: SavedTheme = {
      id: newSavedId(),
      name,
      description: draft.description,
      brandFrom: draft.brandFrom,
      brandTo: draft.brandTo,
      light: { ...draft.light },
      dark: { ...draft.dark },
      createdAt: now,
      updatedAt: now,
    };
    setData({
      ...data,
      theme: {
        ...data.theme,
        savedThemes: [entry, ...savedThemes].slice(0, 40),
      },
    });
    setEditingSavedId(entry.id);
    setSaveName(name);
  };

  /**
   * Runs a local contrast/hierarchy check on the focused palette mode.
   * @example runLocalCheck() // void
   */
  const runLocalCheck = () => {
    const found = checkPalette(draft[paletteMode]);
    setIssues(found);
    setCheckError(null);
    setCheckSummary(
      found.length === 0
        ? "No issues found — contrast and hierarchy look solid."
        : `Found ${found.length} issue${found.length === 1 ? "" : "s"} to review.`,
    );
  };

  /**
   * Asks AI to improve the palette; falls back to local suggestions server-side.
   * @example void runImprove() // Promise
   */
  const runImprove = async () => {
    setChecking(true);
    setCheckError(null);
    const result = await improveThemePalette({
      light: draft.light,
      dark: draft.dark,
      mode: paletteMode,
    });
    setChecking(false);
    if (!result.ok) {
      setCheckError(result.error);
      return;
    }
    const next: DraftTheme = {
      ...draft,
      light: result.data.light,
      dark: result.data.dark,
    };
    setDraft(next);
    setIssues(result.data.issues);
    setCheckSummary(result.data.summary);
    // Keep preview in sync with improved draft
    applyDraft(next, activeThemeId);
  };

  const currentPalette = draft[paletteMode];

  return (
    <>
      <h1 className="wp-screen-title">Appearance</h1>
      <p className="wp-sub">
        Design your portfolio theme with presets, AI generation, and live preview. All themes use the
        same 8 color variables so the site updates consistently.
      </p>
      <EditorTabs
        preview={<LivePreviewShell data={data} dirty={dirty} section="appearance" />}
      >
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
                onApply={() => applyThemeCard(card)}
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
                    onApply={() => applyThemeCard(card)}
                    onEdit={() => {
                      const saved = savedThemes.find((t) => t.id === card.id);
                      if (saved) editSavedTheme(saved);
                    }}
                    onDelete={() => deleteSavedTheme(card.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </Metabox>

        <Metabox id="app_ai_theme" title="Create with AI" badge="AI">
          <div className="wp-theme-ai">
            <label className="wp-theme-ai-label" htmlFor="theme-ai-prompt">
              Describe the visual personality
            </label>
            <textarea
              id="theme-ai-prompt"
              className="wp-textarea"
              rows={3}
              value={aiPrompt}
              placeholder='e.g. "Whimsical, warm, creative and slightly vintage"'
              onChange={(e) => setAiPrompt(e.target.value)}
            />
            <div className="wp-theme-ai-actions">
              <button
                type="button"
                className="wp-btn wp-btn-ai"
                disabled={generating || aiPrompt.trim().length < 3}
                onClick={() => void generateTheme()}
              >
                <span className={`wp-btn-ai-icon${generating ? " is-spin" : ""}`} aria-hidden="true">
                  ✦
                </span>
                {generating ? "Generating…" : "Generate Theme"}
              </button>
            </div>
            {generateError ? <p className="wp-ai-generate-error">{generateError}</p> : null}
          </div>
        </Metabox>

        <Metabox
          id="app_palette_edit"
          title="Edit palette"
          badge={paletteMode}
        >
          <EditablePalette
            palette={currentPalette}
            onChange={updateDraftPalette}
            mode={paletteMode}
            onModeChange={setPaletteMode}
          />

          <div className="wp-theme-edit-actions">
            <button type="button" className="wp-btn" onClick={resetDraft}>
              Reset
            </button>
            <button
              type="button"
              className="wp-btn"
              disabled={generating || aiPrompt.trim().length < 3}
              onClick={() => void generateTheme()}
            >
              Regenerate
            </button>
            <button
              type="button"
              className="wp-btn wp-btn-primary"
              onClick={() => applyDraft(draft, editingSavedId ?? activeThemeId)}
            >
              Apply
            </button>
          </div>

          <div className="wp-theme-save-row">
            <TextInput
              value={saveName}
              onChange={setSaveName}
              placeholder="Theme name"
              aria-label="Theme name"
            />
            <button type="button" className="wp-btn" onClick={saveAsTheme}>
              {editingSavedId ? "Update saved theme" : "Save as theme"}
            </button>
          </div>
          <p className="wp-description">
            Save adds the palette to My Themes without changing the active theme. Use Apply to push colors
            into the live preview and published palette.
          </p>
        </Metabox>

        <Metabox id="app_palette_check" title="AI Palette Check" badge="optional">
          <p className="wp-theme-section-lede">
            Check the current {paletteMode} palette for contrast, similarity, weak hovers, and hierarchy.
          </p>
          <div className="wp-theme-check-actions">
            <button type="button" className="wp-btn" onClick={runLocalCheck}>
              Check palette
            </button>
            <button
              type="button"
              className="wp-btn wp-btn-ai"
              disabled={checking}
              onClick={() => void runImprove()}
            >
              <span className={`wp-btn-ai-icon${checking ? " is-spin" : ""}`} aria-hidden="true">
                ✦
              </span>
              {checking ? "Improving…" : "Improve palette"}
            </button>
            {issues.length > 0 ? (
              <button
                type="button"
                className="wp-btn"
                onClick={() => {
                  const fixed = applyAllSuggestions(draft[paletteMode], issues);
                  updateDraftPalette(fixed);
                  setIssues([]);
                  setCheckSummary("Applied all suggestions.");
                }}
              >
                Apply all suggestions
              </button>
            ) : null}
          </div>
          {checkError ? <p className="wp-ai-generate-error">{checkError}</p> : null}
          {checkSummary ? <p className="wp-theme-check-summary">{checkSummary}</p> : null}
          {issues.length > 0 ? (
            <ul className="wp-theme-issues">
              {issues.map((issue) => (
                <li key={issue.id} className="wp-theme-issue">
                  <div className="wp-theme-issue-copy">
                    <p className="wp-theme-issue-msg">{issue.message}</p>
                    <p className="wp-theme-issue-suggest">
                      Suggested:{" "}
                      <span className="wp-theme-issue-hex" style={{ background: issue.current }}>
                        {issue.current}
                      </span>{" "}
                      →{" "}
                      <span className="wp-theme-issue-hex" style={{ background: issue.suggested }}>
                        {issue.suggested}
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    className="wp-btn wp-btn-small"
                    onClick={() => {
                      updateDraftPalette(applyPaletteSuggestion(draft[paletteMode], issue));
                      setIssues((prev) => prev.filter((i) => i.id !== issue.id));
                    }}
                  >
                    Apply suggestion
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </Metabox>

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
                      {mode === "system"
                        ? "Match the visitor’s system"
                        : mode === "dark"
                          ? "Dark"
                          : "Light"}
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
                        setData({
                          ...data,
                          theme: { ...data.theme, allowToggle: e.target.checked },
                        })
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
                  onChange={(brandFrom) => {
                    setData({ ...data, theme: { ...data.theme, brandFrom } });
                    setDraft((prev) => ({ ...prev, brandFrom }));
                  }}
                />
              </Field>
              <Field label="Brand to" hint="Gradient end">
                <HexColorInput
                  value={data.theme.brandTo}
                  onChange={(brandTo) => {
                    setData({ ...data, theme: { ...data.theme, brandTo } });
                    setDraft((prev) => ({ ...prev, brandTo }));
                  }}
                />
              </Field>
            </tbody>
          </table>
        </Metabox>

        <p>
          <CmsSaveButton save={save} dirty={dirty} status={status} />

          <button
            type="button"
            className="wp-btn"
            style={{ marginLeft: 8 }}
            onClick={() => {
              const next = structuredClone(DEFAULT_THEME);
              setData({ ...data, theme: { ...next, savedThemes: data.theme.savedThemes ?? [] } });
              const draftNext = draftFromTheme(next);
              setDraft(draftNext);
              setBaseline(draftNext);
              setEditingSavedId(null);
              setSaveName("");
              setIssues([]);
              setCheckSummary(null);
            }}
          >
            Reset to defaults
          </button>
        </p>
      </EditorTabs>
    </>
  );
}
