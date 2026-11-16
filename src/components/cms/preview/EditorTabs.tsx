"use client";

// External dependencies
import {
  useCallback,
  useId,
  useMemo,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

export type EditorMiddleTab = {
  id: string;
  label: ReactNode;
  content: ReactNode;
};

/**
 * Renders Data / Preview tabs; keeps Data mounted while hidden.
 * Supports an optional middle tab between Data and Preview.
 * With `split`, the editor and preview stay side by side and the Preview tab is omitted;
 * the preview stays visible while switching Data / catalogue.
 * @example <EditorTabs split preview={<Preview />}>{editor}</EditorTabs>
 */
export function EditorTabs({
  children,
  preview,
  defaultTab = "data",
  middleTab,
  split = false,
  dataLabel = "Data",
}: {
  children: ReactNode;
  preview: ReactNode;
  defaultTab?: string;
  middleTab?: EditorMiddleTab;
  /** Keeps the editor and live preview visible together. */
  split?: boolean;
  /** Label for the primary editor tab. */
  dataLabel?: string;
}) {
  const baseId = useId();
  const [tab, setTab] = useState<string>(defaultTab);
  const [previewFocus, setPreviewFocus] = useState(false);
  const activeTab = split && tab === "preview" ? "data" : tab;

  /**
   * Switches editor panels without leaving the expanded-preview state stuck.
   * @example showTab("data") // void
   */
  const showTab = (id: string) => {
    setTab(id);
    if (split) setPreviewFocus(false);
  };

  const dataTabId = `${baseId}-tab-data`;
  const previewTabId = `${baseId}-tab-preview`;
  const middleTabId = middleTab ? `${baseId}-tab-${middleTab.id}` : "";
  const dataPanelId = `${baseId}-panel-data`;
  const previewPanelId = `${baseId}-panel-preview`;
  const middlePanelId = middleTab ? `${baseId}-panel-${middleTab.id}` : "";

  const tabList = useMemo(() => {
    if (split) return middleTab ? ["data", middleTab.id] : ["data"];
    return middleTab ? ["data", middleTab.id, "preview"] : ["data", "preview"];
  }, [middleTab, split]);

  /**
   * Moves focus between tabs with arrow keys.
   * @example onTabKey(event, "data") // void
   */
  const onTabKey = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, current: string) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Home" && e.key !== "End") {
        return;
      }
      e.preventDefault();
      const currentIndex = tabList.indexOf(current);
      let nextId: string;
      if (e.key === "Home") {
        nextId = tabList[0];
      } else if (e.key === "End") {
        nextId = tabList[tabList.length - 1];
      } else if (e.key === "ArrowRight") {
        nextId = tabList[(currentIndex + 1) % tabList.length];
      } else {
        nextId = tabList[(currentIndex - 1 + tabList.length) % tabList.length];
      }
      setTab(nextId);
      if (split) setPreviewFocus(false);
      const nextElementId =
        nextId === "data"
          ? dataTabId
          : nextId === "preview"
            ? previewTabId
            : middleTabId;
      document.getElementById(nextElementId)?.focus();
    },
    [tabList, dataTabId, previewTabId, middleTabId, split],
  );

  const tablist = (
    <div className="wp-editor-tablist" role="tablist" aria-label="Editor views">
      <button
        type="button"
        role="tab"
        id={dataTabId}
        aria-selected={activeTab === "data"}
        aria-controls={dataPanelId}
        tabIndex={activeTab === "data" ? 0 : -1}
        className={`wp-editor-tab${activeTab === "data" ? " is-active" : ""}`}
        onClick={() => showTab("data")}
        onKeyDown={(e) => onTabKey(e, "data")}
      >
        {dataLabel}
      </button>
      {middleTab ? (
        <button
          type="button"
          role="tab"
          id={middleTabId}
          aria-selected={activeTab === middleTab.id}
          aria-controls={middlePanelId}
          tabIndex={activeTab === middleTab.id ? 0 : -1}
          className={`wp-editor-tab${activeTab === middleTab.id ? " is-active" : ""}`}
          onClick={() => showTab(middleTab.id)}
          onKeyDown={(e) => onTabKey(e, middleTab.id)}
        >
          {middleTab.label}
        </button>
      ) : null}
      {split ? null : (
        <button
          type="button"
          role="tab"
          id={previewTabId}
          aria-selected={activeTab === "preview"}
          aria-controls={previewPanelId}
          tabIndex={activeTab === "preview" ? 0 : -1}
          className={`wp-editor-tab${activeTab === "preview" ? " is-active" : ""}`}
          onClick={() => setTab("preview")}
          onKeyDown={(e) => onTabKey(e, "preview")}
        >
          Preview
        </button>
      )}
    </div>
  );

  const tabbar = (
    <div className="wp-editor-tabbar">
      {tablist}
      {split ? (
        <button
          type="button"
          className={`wp-editor-focus-btn${previewFocus ? " is-active" : ""}`}
          aria-pressed={previewFocus}
          onClick={() => setPreviewFocus((current) => !current)}
        >
          {previewFocus ? "← Show editor" : "Expand preview →"}
        </button>
      ) : null}
    </div>
  );

  const panels = (
    <>
      <div
        role="tabpanel"
        id={dataPanelId}
        aria-labelledby={dataTabId}
        hidden={activeTab !== "data"}
        className="wp-editor-tabpanel"
      >
        {children}
      </div>

      {middleTab ? (
        <div
          role="tabpanel"
          id={middlePanelId}
          aria-labelledby={middleTabId}
          hidden={activeTab !== middleTab.id}
          className="wp-editor-tabpanel"
        >
          {middleTab.content}
        </div>
      ) : null}
    </>
  );

  if (split) {
    return (
      <div className="wp-editor-tabs is-split">
        {tabbar}
        <div className={`wp-editor-split${previewFocus ? " is-preview-focus" : ""}`}>
          <div className="wp-editor-split-main">{panels}</div>
          <aside className="wp-editor-split-preview" aria-label="Live preview">
            {preview}
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="wp-editor-tabs">
      {tabbar}
      {panels}
      <div
        role="tabpanel"
        id={previewPanelId}
        aria-labelledby={previewTabId}
        hidden={activeTab !== "preview"}
        className="wp-editor-tabpanel"
      >
        {activeTab === "preview" ? preview : null}
      </div>
    </div>
  );
}
