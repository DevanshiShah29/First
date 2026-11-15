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
 * @example <EditorTabs preview={<Preview />}>{editor}</EditorTabs>
 */
export function EditorTabs({
  children,
  preview,
  defaultTab = "data",
  previewTick = 0,
  middleTab,
}: {
  children: ReactNode;
  preview: ReactNode;
  defaultTab?: string;
  /** Increments when a control should open the Preview tab. */
  previewTick?: number;
  middleTab?: EditorMiddleTab;
}) {
  const baseId = useId();
  const [tab, setTab] = useState<string>(defaultTab);
  const [seenTick, setSeenTick] = useState(previewTick);
  if (previewTick !== seenTick) {
    setSeenTick(previewTick);
    if (previewTick > 0) setTab("preview");
  }

  const dataTabId = `${baseId}-tab-data`;
  const previewTabId = `${baseId}-tab-preview`;
  const middleTabId = middleTab ? `${baseId}-tab-${middleTab.id}` : "";
  const dataPanelId = `${baseId}-panel-data`;
  const previewPanelId = `${baseId}-panel-preview`;
  const middlePanelId = middleTab ? `${baseId}-panel-${middleTab.id}` : "";

  const tabList = useMemo(
    () => (middleTab ? ["data", middleTab.id, "preview"] : ["data", "preview"]),
    [middleTab],
  );

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
      const nextElementId =
        nextId === "data"
          ? dataTabId
          : nextId === "preview"
            ? previewTabId
            : middleTabId;
      document.getElementById(nextElementId)?.focus();
    },
    [tabList, dataTabId, previewTabId, middleTabId],
  );

  return (
    <div className="wp-editor-tabs">
      <div className="wp-editor-tablist" role="tablist" aria-label="Editor views">
        <button
          type="button"
          role="tab"
          id={dataTabId}
          aria-selected={tab === "data"}
          aria-controls={dataPanelId}
          tabIndex={tab === "data" ? 0 : -1}
          className={`wp-editor-tab${tab === "data" ? " is-active" : ""}`}
          onClick={() => setTab("data")}
          onKeyDown={(e) => onTabKey(e, "data")}
        >
          Data
        </button>
        {middleTab ? (
          <button
            type="button"
            role="tab"
            id={middleTabId}
            aria-selected={tab === middleTab.id}
            aria-controls={middlePanelId}
            tabIndex={tab === middleTab.id ? 0 : -1}
            className={`wp-editor-tab${tab === middleTab.id ? " is-active" : ""}`}
            onClick={() => setTab(middleTab.id)}
            onKeyDown={(e) => onTabKey(e, middleTab.id)}
          >
            {middleTab.label}
          </button>
        ) : null}
        <button
          type="button"
          role="tab"
          id={previewTabId}
          aria-selected={tab === "preview"}
          aria-controls={previewPanelId}
          tabIndex={tab === "preview" ? 0 : -1}
          className={`wp-editor-tab${tab === "preview" ? " is-active" : ""}`}
          onClick={() => setTab("preview")}
          onKeyDown={(e) => onTabKey(e, "preview")}
        >
          Preview
        </button>
      </div>

      <div
        role="tabpanel"
        id={dataPanelId}
        aria-labelledby={dataTabId}
        hidden={tab !== "data"}
        className="wp-editor-tabpanel"
      >
        {children}
      </div>

      {middleTab ? (
        <div
          role="tabpanel"
          id={middlePanelId}
          aria-labelledby={middleTabId}
          hidden={tab !== middleTab.id}
          className="wp-editor-tabpanel"
        >
          {middleTab.content}
        </div>
      ) : null}

      <div
        role="tabpanel"
        id={previewPanelId}
        aria-labelledby={previewTabId}
        hidden={tab !== "preview"}
        className="wp-editor-tabpanel"
      >
        {tab === "preview" ? preview : null}
      </div>
    </div>
  );
}
