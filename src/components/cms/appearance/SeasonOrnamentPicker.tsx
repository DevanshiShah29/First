"use client";

import { MAX_SEASON_ORNAMENT_IMAGES, type SeasonOrnament } from "@/content/seasons";
import { ConfirmButton } from "../components/ConfirmDialog";

/**
 * Maps shared catalog ornaments onto one season.
 * @example <SeasonOrnamentPicker images={images} ornaments={ornaments} onImages={onImages} />
 */
export function SeasonOrnamentPicker({
  images,
  ornaments,
  cursorOrnament = null,
  onImages,
  onCursorOrnament,
}: {
  images: string[];
  ornaments: SeasonOrnament[];
  cursorOrnament?: string | null;
  onImages: (images: string[]) => void;
  onCursorOrnament?: (cursorOrnament: string | null) => void;
}) {
  const available = ornaments.filter((item) => item.imageUrl);
  const catalogued = new Set(available.map((item) => item.imageUrl));
  const extras = images.filter((src) => !catalogued.has(src));
  const room = MAX_SEASON_ORNAMENT_IMAGES - images.length;

  const selectedOrnaments = images.map((src) => {
    const match = ornaments.find((item) => item.imageUrl === src);
    return {
      imageUrl: src,
      name: match?.name || "Ornament",
    };
  });

  /**
   * Adds or removes one catalog image on this season.
   * @example toggle("/uploads/artifacts/diya.png", true) // void
   */
  function toggle(src: string, checked: boolean) {
    if (checked) {
      if (room <= 0 || images.includes(src)) return;
      onImages([...images, src]);
      return;
    }
    onImages(images.filter((item) => item !== src));
    if (cursorOrnament === src) {
      onCursorOrnament?.(null);
    }
  }

  return (
    <div className="wp-season-ornaments">
      <h4 className="wp-palette-column-title">Ornaments</h4>
      <p className="wp-description">
        Pick images from the Ornament Catalog tab. Removing an image here only unlinks it from this
        season. Save to publish.
      </p>
      {available.length ? (
        <ul className="wp-season-ornament-list">
          {available.map((item) => {
            const selected = images.includes(item.imageUrl);
            const isCursor = selected && cursorOrnament === item.imageUrl;
            return (
              <li
                key={item.id}
                className={`wp-season-ornament-item${selected ? " is-selected" : ""}${isCursor ? " is-cursor" : ""}`}
              >
                <div className="wp-season-ornament-thumb">
                  {/* CMS addresses may be any https host. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.imageUrl} alt="" />
                  {isCursor ? (
                    <span className="wp-season-cursor-badge" title="Active cursor when live">
                      Cursor
                    </span>
                  ) : null}
                </div>
                <label className="wp-shelf-toggle">
                  <input
                    type="checkbox"
                    checked={selected}
                    disabled={!selected && room <= 0}
                    onChange={(event) => toggle(item.imageUrl, event.target.checked)}
                  />
                  <span>{item.name || "Ornament"}</span>
                </label>
                {selected ? (
                  <button
                    type="button"
                    className={`wp-btn wp-btn-small wp-season-cursor-btn${isCursor ? " is-active" : ""}`}
                    onClick={() => onCursorOrnament?.(isCursor ? null : item.imageUrl)}
                    title={
                      isCursor
                        ? "Currently used as cursor when live. Click to reset."
                        : "Make this ornament the cursor when this festival is live"
                    }
                  >
                    {isCursor ? "★ Cursor" : "Make cursor"}
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="wp-description">
          No ornaments in the catalog yet. Add them in the Ornament Catalog tab.
        </p>
      )}
      <p className="wp-description">
        {images.length} of {MAX_SEASON_ORNAMENT_IMAGES} selected
        {room <= 0 ? " — the limit is reached." : "."}
      </p>

      <div className="wp-season-cursor-box">
        <div className="wp-season-cursor-head">
          <h4 className="wp-palette-column-title">Live cursor</h4>
          <p className="wp-description">
            Make one of the ornaments a cursor while this festival is live. The follower trail will
            trail behind it.
          </p>
        </div>
        {selectedOrnaments.length ? (
          <div className="wp-season-cursor-select">
            <label className={`wp-check wp-cursor-option${!cursorOrnament ? " is-selected" : ""}`}>
              <input
                type="radio"
                name="season-cursor-choice"
                checked={!cursorOrnament}
                onChange={() => onCursorOrnament?.(null)}
              />
              <span>Default brand arrow</span>
            </label>
            {selectedOrnaments.map((orn) => {
              const checked = cursorOrnament === orn.imageUrl;
              return (
                <label
                  key={orn.imageUrl}
                  className={`wp-check wp-cursor-option${checked ? " is-selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="season-cursor-choice"
                    checked={checked}
                    onChange={() => onCursorOrnament?.(orn.imageUrl)}
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={orn.imageUrl} alt="" className="wp-season-cursor-preview-img" />
                  <span>{orn.name}</span>
                </label>
              );
            })}
          </div>
        ) : (
          <p className="wp-description">
            Select at least one ornament above to make it the cursor when live.
          </p>
        )}
      </div>

      {extras.length ? (
        <div className="wp-season-ornament-extras">
          <p className="wp-description">These images are not in the catalog:</p>
          <ul className="wp-season-ornament-list">
            {extras.map((src) => {
              const isCursor = cursorOrnament === src;
              return (
                <li
                  key={src}
                  className={`wp-season-ornament-item${isCursor ? " is-cursor" : ""}`}
                >
                  <div className="wp-season-ornament-thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" />
                    {isCursor ? (
                      <span className="wp-season-cursor-badge" title="Active cursor when live">
                        Cursor
                      </span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className={`wp-btn wp-btn-small wp-season-cursor-btn${isCursor ? " is-active" : ""}`}
                    onClick={() => onCursorOrnament?.(isCursor ? null : src)}
                    title={
                      isCursor
                        ? "Currently used as cursor when live. Click to reset."
                        : "Make this ornament the cursor when this festival is live"
                    }
                  >
                    {isCursor ? "★ Cursor" : "Make cursor"}
                  </button>
                  <ConfirmButton
                    className="wp-btn wp-btn-small"
                    title="Remove this ornament from the season?"
                    confirmLabel="Remove"
                    onConfirm={() => {
                      onImages(images.filter((item) => item !== src));
                      if (cursorOrnament === src) onCursorOrnament?.(null);
                    }}
                  >
                    Remove
                  </ConfirmButton>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      <div className="wp-theme-edit-actions">
        <ConfirmButton
          className="wp-btn wp-btn-small"
          disabled={!images.length}
          title="Remove every ornament image from this season?"
          confirmLabel="Clear images"
          onConfirm={() => {
            onImages([]);
            onCursorOrnament?.(null);
          }}
        >
          Clear images
        </ConfirmButton>
      </div>
    </div>
  );
}
