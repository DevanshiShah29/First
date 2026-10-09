"use client";

import type { ContentData } from "@/content/types";
import { ThemeAiPanel } from "../appearance/ThemeAiPanel";
import { ThemeCheckPanel } from "../appearance/ThemeCheckPanel";
import { ThemeLibrary } from "../appearance/ThemeLibrary";
import { ThemePalettePanel } from "../appearance/ThemePalettePanel";
import { ThemeBrandPanel, ThemeOptionsPanel } from "../appearance/ThemeSettingsPanels";
import { useAppearanceDraft } from "../appearance/useAppearanceDraft";
import { CmsSaveButton, type CmsSaveStatus } from "../components/CmsSaveButton";
import { EditorTabs } from "../preview/EditorTabs";
import { LivePreviewShell } from "../preview/LivePreviewShell";

interface AppearanceScreenProps {
  data: ContentData;
  setData: (data: ContentData) => void;
  save: () => Promise<void>;
  dirty: boolean;
  status: CmsSaveStatus;
}

/**
 * Appearance CMS screen: presets, AI generator, editable palette, live preview.
 * @example <AppearanceScreen data={data} setData={setData} … />
 */
export function AppearanceScreen({ data, setData, save, dirty, status }: AppearanceScreenProps) {
  const editor = useAppearanceDraft(data, setData);

  return (
    <>
      <h1 className="wp-screen-title">Appearance</h1>
      <p className="wp-sub">
        Design your portfolio theme with presets, AI generation, and live preview. All themes use the
        same 8 color variables so the site updates consistently.
      </p>
      <EditorTabs preview={<LivePreviewShell data={data} dirty={dirty} section="appearance" />}>
        <ThemeLibrary
          presetCards={editor.presetCards}
          savedCards={editor.savedCards}
          savedThemes={editor.savedThemes}
          activeThemeId={editor.activeThemeId}
          onApply={editor.applyThemeCard}
          onEdit={editor.editSavedTheme}
          onDelete={editor.deleteSavedTheme}
        />
        <ThemeAiPanel
          aiPrompt={editor.aiPrompt}
          onPrompt={editor.setAiPrompt}
          generating={editor.generating}
          generateError={editor.generateError}
          onGenerate={() => void editor.generateTheme()}
        />
        <ThemePalettePanel
          light={editor.draft.light}
          dark={editor.draft.dark}
          onPaletteChange={editor.updateDraftPalette}
          generating={editor.generating}
          canRegenerate={editor.aiPrompt.trim().length >= 3}
          onReset={editor.resetDraft}
          onRegenerate={() => void editor.generateTheme()}
          onApply={() => editor.applyDraft(editor.draft, editor.editingSavedId ?? editor.activeThemeId)}
          saveName={editor.saveName}
          onSaveName={editor.setSaveName}
          editingSaved={Boolean(editor.editingSavedId)}
          onSave={editor.saveAsTheme}
        />
        <ThemeCheckPanel
          paletteMode={editor.paletteMode}
          onPaletteMode={editor.setPaletteMode}
          onCheck={editor.runLocalCheck}
          checking={editor.checking}
          onImprove={() => void editor.runImprove()}
          issues={editor.issues}
          checkError={editor.checkError}
          checkSummary={editor.checkSummary}
          onApplyAll={editor.applyAllIssues}
          onApplyIssue={editor.applyOneIssue}
        />
        <ThemeOptionsPanel
          defaultMode={data.theme.defaultMode}
          allowToggle={data.theme.allowToggle}
          onDefaultMode={(mode) => setData({ ...data, theme: { ...data.theme, defaultMode: mode } })}
          onAllowToggle={(allowToggle) =>
            setData({ ...data, theme: { ...data.theme, allowToggle } })
          }
        />
        <ThemeBrandPanel
          brandFrom={data.theme.brandFrom}
          brandTo={data.theme.brandTo}
          onBrandFrom={(brandFrom) => {
            setData({ ...data, theme: { ...data.theme, brandFrom } });
            editor.setDraft((prev) => ({ ...prev, brandFrom }));
          }}
          onBrandTo={(brandTo) => {
            setData({ ...data, theme: { ...data.theme, brandTo } });
            editor.setDraft((prev) => ({ ...prev, brandTo }));
          }}
        />
        <p>
          <CmsSaveButton save={save} dirty={dirty} status={status} />
          <button
            type="button"
            className="wp-btn"
            style={{ marginLeft: 8 }}
            onClick={editor.resetToDefaults}
          >
            Reset to defaults
          </button>
        </p>
      </EditorTabs>
    </>
  );
}
