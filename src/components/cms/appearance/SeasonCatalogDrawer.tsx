"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";
import type { ContentData } from "@/content/types";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import { SeasonOrnamentCatalog } from "./SeasonOrnamentCatalog";

/**
 * Right-side drawer for the shared ornament catalog.
 * Opening it never changes the selected season or the editor draft.
 * @example <SeasonCatalogDrawer data={data} setData={setData} onClose={close} />
 */
export function SeasonCatalogDrawer({
  data,
  setData,
  onClose,
}: {
  data: ContentData;
  setData: Dispatch<SetStateAction<ContentData>>;
  onClose: () => void;
}) {
  const dialogRef = useDialogFocus<HTMLDivElement>(true);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="wp-shelf-modal-backdrop wp-season-catalog-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="wp-season-catalog-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="season-catalog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="wp-season-catalog-head">
          <div>
            <h3 id="season-catalog-title">Ornament catalog</h3>
            <p className="wp-sub">
              Shared images for every season. Your selected season and unsaved edits stay as they are.
            </p>
          </div>
          <button type="button" className="wp-btn" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="wp-season-catalog-body">
          <SeasonOrnamentCatalog data={data} setData={setData} />
        </div>
      </div>
    </div>
  );
}
