"use client";

import { CURSOR_STYLE_OPTIONS, DEFAULT_CURSOR, type CursorStyle } from "@/content/cursor";
import type { ContentData } from "@/content/types";
import { Metabox } from "../components/Metabox";
import { CursorStylePreview } from "./CursorStylePreview";

/**
 * Appearance control for the public cursor follower.
 * @example <CursorStylePanel data={data} setData={setData} />
 */
export function CursorStylePanel({
  data,
  setData,
}: {
  data: ContentData;
  setData: (data: ContentData) => void;
}) {
  const selected = data.site.cursor?.style ?? DEFAULT_CURSOR.style;
  const option = CURSOR_STYLE_OPTIONS.find((item) => item.id === selected) ?? CURSOR_STYLE_OPTIONS[0];

  /**
   * Stores the chosen follower on the site draft.
   * @example choose("ring") // void
   */
  function choose(style: CursorStyle) {
    setData({ ...data, site: { ...data.site, cursor: { style } } });
  }

  return (
    <Metabox id="app_cursor" title="Cursor" badge={option.label}>
      <table className="wp-form-table">
        <tbody>
          <tr>
            <th scope="row">Follower</th>
            <td>
              <div className="wp-cursor-grid">
                {CURSOR_STYLE_OPTIONS.map((item) => (
                  <label key={item.id} className="wp-check wp-cursor-option">
                    <input
                      type="radio"
                      name="cursorStyle"
                      checked={selected === item.id}
                      onChange={() => choose(item.id)}
                    />
                    <CursorStylePreview
                      style={item.id}
                      brandFrom={data.theme.brandFrom}
                      brandTo={data.theme.brandTo}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
              <span className="wp-description">{option.hint}</span>
              <span className="wp-description">Memories keeps its star cursor.</span>
              <span className="wp-description">
                Active festivals can use a seasonal ornament as the cursor (configured in Seasons).
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </Metabox>
  );
}
