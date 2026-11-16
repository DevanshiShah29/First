"use client";

import { usePathname } from "next/navigation";
import { useState, type CSSProperties } from "react";
import {
  motifFor,
  positionedOrnamentSpots,
  spotStyle,
  type OrnamentSpot,
} from "@/content/season-layout";
import {
  seasonOrnamentImageUrl,
  type OrnamentPosition,
  type PlacementGroup,
} from "@/content/seasons";

/**
 * Ornament images for the active season, placed on custom placement groups or legacy positions.
 * Clicks pass through. The admin shell skips them; the preview iframe opts in.
 * @example <SeasonLayer season="diwali" placements={season.placements} placement="preview" />
 */
export function SeasonLayer({
  season,
  images = [],
  positions,
  placements,
  placement = "site",
}: {
  season: string;
  images?: string[];
  positions?: Record<string, OrnamentPosition>;
  placements?: PlacementGroup[];
  placement?: "site" | "preview";
}) {
  const pathname = usePathname();
  if (placement === "site" && pathname.startsWith("/admin")) return null;

  const motif = motifFor(season);

  // If placement groups are configured, render them
  if (placements && placements.length > 0) {
    return (
      <div className={`season-layer season-layer--motif-${motif}`} data-motif={motif} aria-hidden="true">
        {placements.map((group) => (
          <PlacementGroupContainer key={group.id} group={group} />
        ))}
      </div>
    );
  }

  // Fallback to legacy ornamentPositions and photos
  const photos = images
    .map((src) => seasonOrnamentImageUrl(src))
    .filter((src): src is string => Boolean(src));
  if (!photos.length) return null;
  const spots = positionedOrnamentSpots(photos, positions);
  return (
    <div className={`season-layer season-layer--motif-${motif}`} data-motif={motif} aria-hidden="true">
      {photos.map((src, index) => (
        <Photo key={`${src}-${index}`} src={src} spot={spots[index]} />
      ))}
    </div>
  );
}

/**
 * Renders one placement group container with its layout, spacing, and repeated assets.
 */
function PlacementGroupContainer({ group }: { group: PlacementGroup }) {
  const assetUrls = (group.assets ?? [])
    .map((src) => seasonOrnamentImageUrl(src))
    .filter((src): src is string => Boolean(src));

  if (!assetUrls.length) return null;

  const repeatCount = Math.max(1, Math.min(20, Math.floor(group.repeat || 1)));
  const items: string[] = [];
  for (let r = 0; r < repeatCount; r++) {
    items.push(...assetUrls);
  }

  const visibilityClass =
    group.visibility === "desktop"
      ? "is-desktop-only"
      : group.visibility === "mobile"
        ? "is-mobile-only"
        : "";

  const intensityClass = `intensity-${group.animationIntensity || "normal"}`;

  // Corners position: place ornaments across the four screen corners
  if (group.position === "corners") {
    const corners: { key: string; className: string; cornerItems: string[] }[] = [
      { key: "tl", className: "season-placement-corner is-tl", cornerItems: items },
      { key: "tr", className: "season-placement-corner is-tr", cornerItems: items },
      { key: "bl", className: "season-placement-corner is-bl", cornerItems: items },
      { key: "br", className: "season-placement-corner is-br", cornerItems: items },
    ];

    return (
      <div className={`season-placement-group is-corners ${visibilityClass} ${intensityClass}`.trim()}>
        {corners.map(({ key, className, cornerItems }) =>
          cornerItems.length ? (
            <div
              key={key}
              className={className}
              style={{
                display: "flex",
                flexDirection: group.orientation === "vertical" ? "column" : "row",
                gap: `${group.spacing}rem`,
              }}
            >
              {cornerItems.map((src, i) => (
                <PlacementOrnament
                  key={`${key}-${src}-${i}`}
                  src={src}
                  group={group}
                  index={i}
                />
              ))}
            </div>
          ) : null,
        )}
      </div>
    );
  }

  // Positioning styles
  // left-edge and right-edge must be vertical columns; all others follow orientation.
  const isVerticalEdge = group.position === "left-edge" || group.position === "right-edge";
  const flexDir: CSSProperties["flexDirection"] =
    isVerticalEdge || group.orientation === "vertical" ? "column" : "row";

  const containerStyle: CSSProperties = {
    display: "flex",
    flexDirection: flexDir,
    flexWrap: "wrap",
    gap: `${group.spacing}rem`,
    alignItems: "center",
  };

  // Alignment
  if (group.alignment === "left") {
    containerStyle.justifyContent = "flex-start";
  } else if (group.alignment === "right") {
    containerStyle.justifyContent = "flex-end";
  } else if (group.alignment === "stretch") {
    containerStyle.justifyContent = items.length <= 1 ? "center" : "space-between";
  } else {
    containerStyle.justifyContent = "center";
  }

  // Position coordinates
  switch (group.position) {
    case "header":
      containerStyle.top = "calc(var(--header-h, 4.5rem) + 0.35rem)";
      containerStyle.left = "1.5rem";
      containerStyle.right = "1.5rem";
      break;
    case "top-edge":
      containerStyle.top = "0.75rem";
      containerStyle.left = "1.5rem";
      containerStyle.right = "1.5rem";
      break;
    case "bottom-edge":
      containerStyle.bottom = "0.75rem";
      containerStyle.left = "1.5rem";
      containerStyle.right = "1.5rem";
      break;
    case "left-edge":
      containerStyle.top = "calc(var(--header-h, 4.5rem) + 1.25rem)";
      containerStyle.bottom = "1.5rem";
      containerStyle.left = "0.75rem";
      containerStyle.flexWrap = "nowrap";
      if (group.alignment === "stretch") {
        containerStyle.justifyContent = "space-between";
      }
      break;
    case "right-edge":
      containerStyle.top = "calc(var(--header-h, 4.5rem) + 1.25rem)";
      containerStyle.bottom = "1.5rem";
      containerStyle.right = "0.75rem";
      containerStyle.flexWrap = "nowrap";
      if (group.alignment === "stretch") {
        containerStyle.justifyContent = "space-between";
      }
      break;
    case "center":
      containerStyle.top = "50%";
      containerStyle.left = "50%";
      containerStyle.transform = "translate(-50%, -50%)";
      containerStyle.maxWidth = "80vw";
      break;
    case "custom":
      if (group.customCoordinates?.top) containerStyle.top = group.customCoordinates.top;
      if (group.customCoordinates?.bottom) containerStyle.bottom = group.customCoordinates.bottom;
      if (group.customCoordinates?.left) containerStyle.left = group.customCoordinates.left;
      if (group.customCoordinates?.right) containerStyle.right = group.customCoordinates.right;
      if (
        !group.customCoordinates?.top &&
        !group.customCoordinates?.bottom &&
        !group.customCoordinates?.left &&
        !group.customCoordinates?.right
      ) {
        containerStyle.top = "calc(var(--header-h, 4.5rem) + 2rem)";
        containerStyle.left = "2rem";
        containerStyle.right = "2rem";
      }
      break;
  }

  return (
    <div
      className={`season-placement-group ${visibilityClass} ${intensityClass}`.trim()}
      style={containerStyle}
      data-placement-id={group.id}
      data-position={group.position}
    >
      {items.map((src, index) => (
        <PlacementOrnament
          key={`${group.id}-${src}-${index}`}
          src={src}
          group={group}
          index={index}
        />
      ))}
    </div>
  );
}

/**
 * One ornament in a placement group.
 */
function PlacementOrnament({
  src,
  group,
  index,
}: {
  src: string;
  group: PlacementGroup;
  index: number;
}) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;

  const sizeClass = `season-ornament--${group.size}`;
  const animClass = `season-ornament--${group.animation}`;

  const style: CSSProperties = {
    animationDelay: `${((index * 0.35) % 3).toFixed(2)}s`,
  };

  if (group.size === "custom" && group.customSize) {
    (style as Record<string, string>)["--ornament-size"] = `${group.customSize}rem`;
    style.width = `${group.customSize}rem`;
    style.height = `${group.customSize}rem`;
  }

  // For diagonal/free orientations, use a wrapper span so offset transforms
  // don't conflict with the CSS animation transform on the ornament itself.
  if (group.orientation === "diagonal") {
    const wrapStyle: CSSProperties = {
      display: "inline-block",
      flexShrink: 0,
      transform: `translateY(${index * 12}px)`,
    };
    return (
      <span style={wrapStyle}>
        <span
          className={`season-ornament season-ornament--photo ${sizeClass} ${animClass}`}
          style={style}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" decoding="async" onError={() => setHidden(true)} />
        </span>
      </span>
    );
  }

  if (group.orientation === "free") {
    const x = (index % 2 === 0 ? 1 : -1) * (8 + ((index * 4) % 14));
    const y = (index % 3 === 0 ? -1 : 1) * (6 + ((index * 5) % 16));
    const wrapStyle: CSSProperties = {
      display: "inline-block",
      flexShrink: 0,
      transform: `translate(${x}px, ${y}px)`,
    };
    return (
      <span style={wrapStyle}>
        <span
          className={`season-ornament season-ornament--photo ${sizeClass} ${animClass}`}
          style={style}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" decoding="async" onError={() => setHidden(true)} />
        </span>
      </span>
    );
  }

  return (
    <span
      className={`season-ornament season-ornament--photo ${sizeClass} ${animClass}`}
      style={style}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" decoding="async" onError={() => setHidden(true)} />
    </span>
  );
}

/**
 * One uploaded ornament. A broken address is removed from the layer.
 * @example <Photo src="/uploads/artifacts/bat.png" spot={spot} />
 */
function Photo({ src, spot }: { src: string; spot: OrnamentSpot | undefined }) {
  const [hidden, setHidden] = useState(false);
  if (hidden || !spot) return null;
  return (
    <span
      className={`season-ornament season-ornament--photo season-ornament--${spot.size} season-ornament--${spot.motion}${spot.quiet ? " is-quiet" : ""}${spot.anchor === "corner" ? " is-corner" : ""}`}
      data-anchor={spot.anchor}
      data-corner={spot.corner ?? undefined}
      style={spotStyle(spot) as CSSProperties}
    >
      {/* Addresses may be any https host the editor accepted. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" decoding="async" onError={() => setHidden(true)} />
    </span>
  );
}
