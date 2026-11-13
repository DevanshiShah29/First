"use client";

import type { CSSProperties } from "react";

import { CursorMark } from "@/components/cursor-trails";
import type { CursorStyle } from "@/content/cursor";

/**
 * Small static preview of a cursor follower style.
 * @example <CursorStylePreview style="dots" brandFrom="#7c3aed" brandTo="#6366f1" />
 */
export function CursorStylePreview({
  style,
  brandFrom,
  brandTo,
}: {
  style: CursorStyle;
  brandFrom: string;
  brandTo: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`wp-cursor-preview is-${style}`}
      style={{ "--brand-from": brandFrom, "--brand-to": brandTo } as CSSProperties}
    >
      {style === "shadow" ? <span className="wp-cursor-trail is-shadow" /> : null}
      {style === "ring" ? <span className="wp-cursor-trail is-ring" /> : null}
      {style === "dots" ? (
        <>
          <span className="wp-cursor-trail is-dot" />
          <span className="wp-cursor-trail is-dot is-mid" />
          <span className="wp-cursor-trail is-dot is-far" />
        </>
      ) : null}
      {style === "echo" ? (
        <span className="wp-cursor-echo">
          <CursorMark gradientId="cursor-preview-echo" />
        </span>
      ) : null}
      <span className="wp-cursor-arrow">
        <CursorMark gradientId={`cursor-preview-${style}`} />
      </span>
    </span>
  );
}
