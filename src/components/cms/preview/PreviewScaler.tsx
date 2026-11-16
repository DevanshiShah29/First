"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/**
 * Renders a frame at its real CSS width, then scales it down to fit the column.
 * The iframe keeps its true viewport width, so media queries match the public site.
 * @example <PreviewScaler frameWidth={1280}>{frame}</PreviewScaler>
 */
export function PreviewScaler({
  frameWidth,
  children,
}: {
  frameWidth: number;
  children: ReactNode;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const inner = innerRef.current;
    if (!wrapper || !inner) return;

    /**
     * Reads the column width and the frame's unscaled height.
     * @example read() // setWidth / setHeight
     */
    const read = () => {
      setWidth(wrapper.clientWidth);
      setHeight(inner.offsetHeight);
    };

    read();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(read);
    observer.observe(wrapper);
    observer.observe(inner);
    return () => observer.disconnect();
  }, []);

  const scale = width > 0 ? Math.min(1, width / frameWidth) : 1;

  return (
    <div
      ref={wrapperRef}
      className="wp-preview-scaler"
      style={{ height: height > 0 ? Math.round(height * scale) : undefined }}
    >
      <div
        ref={innerRef}
        className="wp-preview-scaler-inner"
        style={{ width: `${frameWidth}px`, transform: `scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}
