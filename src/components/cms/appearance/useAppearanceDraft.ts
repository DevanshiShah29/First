"use client";

import { useCallback, useMemo, useState } from "react";
import { THEME_PRESETS } from "@/content/theme-presets";
import { DEFAULT_THEME, type ContentData, type SavedTheme, type ThemePalette } from "@/content/types";
import { generateThemePalette, improveThemePalette } from "@/lib/cms-client";
import {
  applyAllSuggestions,
  applyPaletteSuggestion,
  checkPalette,
  type PaletteIssue,
} from "@/lib/theme-contrast";
import { type ThemeCardModel } from "./ThemePresetCard";
import { draftFromTheme, newSavedId, type DraftTheme } from "./draft-theme";

export function useAppearanceDraft(
  data: ContentData,
  setData: (data: ContentData) => void,
) {
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
   * @example updateDraftPalette("light", nextLight) // void
   */
  const updateDraftPalette = useCallback(
    (mode: "light" | "dark", next: ThemePalette) => {
      const updated: DraftTheme = {
        ...draft,
        [mode]: next,
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
    [data, draft, setData],
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

  const applyAllIssues = () => {
    const fixed = applyAllSuggestions(draft[paletteMode], issues);
    updateDraftPalette(paletteMode, fixed);
    setIssues([]);
    setCheckSummary("Applied all suggestions.");
  };

  const applyOneIssue = (issue: PaletteIssue) => {
    updateDraftPalette(paletteMode, applyPaletteSuggestion(draft[paletteMode], issue));
    setIssues((prev) => prev.filter((item) => item.id !== issue.id));
  };

  const resetToDefaults = () => {
    const next = structuredClone(DEFAULT_THEME);
    setData({ ...data, theme: { ...next, savedThemes: data.theme.savedThemes ?? [] } });
    const draftNext = draftFromTheme(next);
    setDraft(draftNext);
    setBaseline(draftNext);
    setEditingSavedId(null);
    setSaveName("");
    setIssues([]);
    setCheckSummary(null);
  };

  return {
    draft,
    setDraft,
    paletteMode,
    setPaletteMode,
    aiPrompt,
    setAiPrompt,
    generating,
    generateError,
    checking,
    checkError,
    checkSummary,
    issues,
    saveName,
    setSaveName,
    editingSavedId,
    savedThemes,
    activeThemeId,
    presetCards,
    savedCards,
    updateDraftPalette,
    applyDraft,
    applyThemeCard,
    editSavedTheme,
    deleteSavedTheme,
    generateTheme,
    resetDraft,
    saveAsTheme,
    runLocalCheck,
    runImprove,
    applyAllIssues,
    applyOneIssue,
    resetToDefaults,
  };
}
