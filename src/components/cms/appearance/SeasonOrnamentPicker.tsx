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
  onImages,
}: {
  images: string[];
  ornaments: SeasonOrnament[];
  onImages: (images: string[]) => void;
}) {
  const available = ornaments.filter((item) => item.imageUrl);
  const catalogued = new Set(available.map((item) => item.imageUrl));
  const extras = images.filter((src) => !catalogued.has(src));
  const room = MAX_SEASON_ORNAMENT_IMAGES - images.length;

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
            return (
              <li
                key={item.id}
                className={`wp-season-ornament-item${selected ? " is-selected" : ""}`}
              >
                {/* CMS addresses may be any https host. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.imageUrl} alt="" />
                <label className="wp-shelf-toggle">
                  <input
                    type="checkbox"
                    checked={selected}
                    disabled={!selected && room <= 0}
                    onChange={(event) => toggle(item.imageUrl, event.target.checked)}
                  />
                  <span>{item.name || "Ornament"}</span>
                </label>
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
      {extras.length ? (
        <div className="wp-season-ornament-extras">
          <p className="wp-description">These images are not in the catalog:</p>
          <ul className="wp-season-ornament-list">
            {extras.map((src) => (
              <li key={src} className="wp-season-ornament-item">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" />
                <ConfirmButton
                  className="wp-btn wp-btn-small"
                  title="Remove this ornament from the season?"
                  confirmLabel="Remove"
                  onConfirm={() => onImages(images.filter((item) => item !== src))}
                >
                  Remove
                </ConfirmButton>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="wp-theme-edit-actions">
        <ConfirmButton
          className="wp-btn wp-btn-small"
          disabled={!images.length}
          title="Remove every ornament image from this season?"
          confirmLabel="Clear images"
          onConfirm={() => onImages([])}
        >
          Clear images
        </ConfirmButton>
      </div>
    </div>
  );
}
