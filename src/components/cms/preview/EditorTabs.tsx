"use client";

// External dependencies
import {
  useCallback,
  useId,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

type TabId = "data" | "preview";

/**
 * Renders Data / Preview tabs; keeps Data mounted while hidden.
 * @example <EditorTabs preview={<Preview />}>{editor}</EditorTabs>
 */
export function EditorTabs({
  children,
  preview,
  defaultTab = "data",
}: {
  children: ReactNode;
  preview: ReactNode;
  defaultTab?: TabId;
}) {
  const baseId = useId();
  const [tab, setTab] = useState<TabId>(defaultTab);

  const dataTabId = `${baseId}-tab-data`;
  const previewTabId = `${baseId}-tab-preview`;
  const dataPanelId = `${baseId}-panel-data`;
  const previewPanelId = `${baseId}-panel-preview`;

  /**
   * Moves focus between Data and Preview tabs with arrow keys.
   * @example onTabKey(event) // void
   */
  const onTabKey = useCallback((e: KeyboardEvent<HTMLButtonElement>, current: TabId) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Home" && e.key !== "End") {
      return;
    }
    e.preventDefault();
    const next: TabId =
      e.key === "Home"
        ? "data"
        : e.key === "End"
          ? "preview"
          : current === "data"
            ? "preview"
            : "data";
    setTab(next);
    const el = document.getElementById(next === "data" ? dataTabId : previewTabId);
    el?.focus();
  }, [dataTabId, previewTabId]);

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
