"use client";

// External dependencies
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

// Application services & types
import { isShelfArtifactPlaced, type ShelfArtifactItem } from "@/content/types";
import type { GoodreadsLibrary } from "@/lib/goodreads";
import { Bookshelf } from "@/components/reading/Bookshelf";
import { shelfSections } from "@/components/reading/shelfSections";

type ResizeCorner = "nw" | "ne" | "sw" | "se";

type DragMode =
  | { type: "move"; id: string; offsetXPct: number; offsetYPct: number }
  | {
      type: "resize";
      id: string;
      corner: ResizeCorner;
      startX: number;
      startY: number;
      startW: number;
      startH: number;
      startXP: number;
      startYP: number;
      rem: number;
      roomW: number;
      roomH: number;
    }
  | { type: "palette"; id: string };

/** Tiny floor so resize cannot collapse to 0 / negative rem. */
const SIZE_MIN = 0.05;

/**
 * Clamps a number into [min, max].
 * @example clamp(12, 0, 10) // 10
 */
function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/**
 * Reads root font-size in px for rem conversions.
 * @example rootRemPx() // 16
 */
function rootRemPx() {
  if (typeof document === "undefined") return 16;
  return Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
}

/**
 * Maps pointer client coords to % inside the room rect.
 * @example clientToPercent(ev, rect) // { xPercent, yPercent }
 */
function clientToPercent(clientX: number, clientY: number, rect: DOMRect) {
  const xPercent = rect.width > 0 ? ((clientX - rect.left) / rect.width) * 100 : 0;
  const yPercent = rect.height > 0 ? ((clientY - rect.top) / rect.height) * 100 : 0;
  return { xPercent, yPercent };
}

/**
 * CMS canvas: drag ornaments onto the shelf room and resize from corners.
 * @example <ShelfPlacementEditor artifacts={list} onChange={setList} />
 */
export function ShelfPlacementEditor({
  artifacts,
  onChange,
}: {
  artifacts: ShelfArtifactItem[];
  onChange: (next: ShelfArtifactItem[]) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const [library, setLibrary] = useState<GoodreadsLibrary | null>(null);
  const [loadError, setLoadError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const dragRef = useRef<DragMode | null>(null);
  const [, setDragTick] = useState(0);

  const placeable = useMemo(
    () => artifacts.filter((item) => item.enabled && Boolean(item.imageUrl.trim())),
    [artifacts],
  );
  const placed = useMemo(() => placeable.filter(isShelfArtifactPlaced), [placeable]);
  const unplaced = useMemo(
    () => placeable.filter((item) => !isShelfArtifactPlaced(item)),
    [placeable],
  );
  const selected = artifacts.find((item) => item.id === selectedId) ?? null;

  useEffect(() => {
    let cancelled = false;
    /**
     * Loads Goodreads shelves for a realistic placement canvas.
     * @example void load() // Promise
     */
    async function load() {
      try {
        const res = await fetch("/api/goodreads", { credentials: "same-origin" });
        const data = (await res.json()) as GoodreadsLibrary & { error?: string };
        if (cancelled) return;
        if (!res.ok && !data.configured) {
          setLoadError(data.error || "Could not load Goodreads shelves.");
          setLibrary(null);
          return;
        }
        setLibrary(data);
        setLoadError("");
      } catch {
        if (!cancelled) {
          setLoadError("Could not load Goodreads shelves.");
          setLibrary(null);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Finds the live `.bookshelf-room` element under the canvas wrapper.
   * @example roomEl() // HTMLElement | null
   */
  const roomEl = useCallback(() => {
    return wrapRef.current?.querySelector(".bookshelf-room") as HTMLElement | null;
  }, []);

  /**
   * Patches one artifact by id.
   * @example patchItem(id, { xPercent: 10 }) // void
   */
  const patchItem = useCallback(
    (id: string, patch: Partial<ShelfArtifactItem>) => {
      onChange(artifacts.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    },
    [artifacts, onChange],
  );

  useEffect(() => {
    /**
     * Handles pointer move for drag/resize.
     * @example onMove(ev) // void
     */
    function onMove(ev: PointerEvent) {
      const mode = dragRef.current;
      const room = roomEl();
      if (!mode || !room) return;
      const rect = room.getBoundingClientRect();
      if (mode.type === "move") {
        const { xPercent, yPercent } = clientToPercent(ev.clientX, ev.clientY, rect);
        const item = artifacts.find((a) => a.id === mode.id);
        if (!item) return;
        const rem = rootRemPx();
        const wPct = rect.width > 0 ? ((item.widthRem * rem) / rect.width) * 100 : 0;
        const hPct = rect.height > 0 ? ((item.heightRem * rem) / rect.height) * 100 : 0;
        patchItem(mode.id, {
          xPercent: clamp(xPercent - mode.offsetXPct, 0, Math.max(0, 100 - wPct)),
          yPercent: clamp(yPercent - mode.offsetYPct, 0, Math.max(0, 100 - hPct)),
        });
        return;
      }
      if (mode.type === "resize") {
        const dx = ev.clientX - mode.startX;
        const dy = ev.clientY - mode.startY;
        const rem = mode.rem;
        let nextW = mode.startW;
        let nextH = mode.startH;
        let nextXP = mode.startXP;
        let nextYP = mode.startYP;

        if (mode.corner.includes("e")) nextW = mode.startW + dx / rem;
        if (mode.corner.includes("w")) {
          nextW = mode.startW - dx / rem;
          const dwPx = (mode.startW - nextW) * rem;
          nextXP = mode.startXP + (mode.roomW > 0 ? (dwPx / mode.roomW) * 100 : 0);
        }
        if (mode.corner.includes("s")) nextH = mode.startH + dy / rem;
        if (mode.corner.includes("n")) {
          nextH = mode.startH - dy / rem;
          const dhPx = (mode.startH - nextH) * rem;
          nextYP = mode.startYP + (mode.roomH > 0 ? (dhPx / mode.roomH) * 100 : 0);
        }

        nextW = Math.max(SIZE_MIN, nextW);
        nextH = Math.max(SIZE_MIN, nextH);
        const wPct = mode.roomW > 0 ? ((nextW * rem) / mode.roomW) * 100 : 0;
        const hPct = mode.roomH > 0 ? ((nextH * rem) / mode.roomH) * 100 : 0;
        patchItem(mode.id, {
          widthRem: Math.round(nextW * 100) / 100,
          heightRem: Math.round(nextH * 100) / 100,
          xPercent: clamp(nextXP, 0, Math.max(0, 100 - wPct)),
          yPercent: clamp(nextYP, 0, Math.max(0, 100 - hPct)),
        });
      }
    }

    /**
     * Ends an active drag/resize.
     * @example onUp() // void
     */
    function onUp() {
      dragRef.current = null;
      setDragTick((n) => n + 1);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [artifacts, patchItem, roomEl]);

  /**
   * Starts moving a placed ornament.
   * @example beginMove(ev, item) // void
   */
  function beginMove(ev: ReactPointerEvent, item: ShelfArtifactItem) {
    if (item.xPercent == null || item.yPercent == null) return;
    ev.preventDefault();
    ev.stopPropagation();
    const room = roomEl();
    if (!room) return;
    const rect = room.getBoundingClientRect();
    const { xPercent, yPercent } = clientToPercent(ev.clientX, ev.clientY, rect);
    dragRef.current = {
      type: "move",
      id: item.id,
      offsetXPct: xPercent - item.xPercent,
      offsetYPct: yPercent - item.yPercent,
    };
    setSelectedId(item.id);
    setDragTick((n) => n + 1);
    (ev.target as HTMLElement).setPointerCapture?.(ev.pointerId);
  }

  /**
   * Starts resizing from a corner handle.
   * @example beginResize(ev, item, "se") // void
   */
  function beginResize(
    ev: ReactPointerEvent,
    item: ShelfArtifactItem,
    corner: ResizeCorner,
  ) {
    if (item.xPercent == null || item.yPercent == null) return;
    ev.preventDefault();
    ev.stopPropagation();
    const room = roomEl();
    if (!room) return;
    const rect = room.getBoundingClientRect();
    dragRef.current = {
      type: "resize",
      id: item.id,
      corner,
      startX: ev.clientX,
      startY: ev.clientY,
      startW: item.widthRem,
      startH: item.heightRem,
      startXP: item.xPercent,
      startYP: item.yPercent,
      rem: rootRemPx(),
      roomW: rect.width,
      roomH: rect.height,
    };
    setSelectedId(item.id);
    setDragTick((n) => n + 1);
  }

  /**
   * Places an unplaced ornament at the pointer position on the room.
   * @example placeAtPointer(ev, id) // void
   */
  function placeAtPointer(
    ev: { clientX: number; clientY: number } | ReactPointerEvent | DragEvent,
    id: string,
  ) {
    const room = roomEl();
    if (!room) return;
    const item = artifacts.find((a) => a.id === id);
    if (!item) return;
    const rect = room.getBoundingClientRect();
    const clientX = "clientX" in ev ? ev.clientX : 0;
    const clientY = "clientY" in ev ? ev.clientY : 0;
    const { xPercent, yPercent } = clientToPercent(clientX, clientY, rect);
    const rem = rootRemPx();
    const wPct = rect.width > 0 ? ((item.widthRem * rem) / rect.width) * 100 : 0;
    const hPct = rect.height > 0 ? ((item.heightRem * rem) / rect.height) * 100 : 0;
    patchItem(id, {
      xPercent: clamp(xPercent - wPct / 2, 0, Math.max(0, 100 - wPct)),
      yPercent: clamp(yPercent - hPct / 2, 0, Math.max(0, 100 - hPct)),
    });
    setSelectedId(id);
  }

  /**
   * Clears placement so the ornament returns to the palette.
   * @example unplace(id) // void
   */
  function unplace(id: string) {
    patchItem(id, { xPercent: null, yPercent: null });
    if (selectedId === id) setSelectedId(null);
  }

  const sections = library ? shelfSections(library) : [];
  const hasBooks = sections.some((s) => s.books.length > 0);

  useEffect(() => {
    const wrap = wrapRef.current;
    const layer = layerRef.current;
    if (!wrap || !layer) return;

    /**
     * Keeps the editor overlay aligned with `.bookshelf-room`.
     * @example sync() // void
     */
    function sync() {
      const room = roomEl();
      if (!room || !wrap || !layer) return;
      const rr = room.getBoundingClientRect();
      const wr = wrap.getBoundingClientRect();
      layer.style.left = `${rr.left - wr.left + wrap.scrollLeft}px`;
      layer.style.top = `${rr.top - wr.top + wrap.scrollTop}px`;
      layer.style.width = `${rr.width}px`;
      layer.style.height = `${rr.height}px`;
    }

    sync();
    const room = roomEl();
    const ro = new ResizeObserver(sync);
    if (room) ro.observe(room);
    ro.observe(wrap);
    window.addEventListener("resize", sync);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, [hasBooks, library, placed.length, roomEl]);

  return (
    <div className="wp-shelf-placement">
      <div className="wp-shelf-placement-head">
        <div>
          <h2 className="wp-shelf-placement-title">Live shelf preview</h2>
          <p className="wp-sub" style={{ margin: 0 }}>
            Drag from the tray onto the Bookology-style shelf. Corner handles resize. Arrow keys
            nudge the selection · Delete removes it from the shelf.
          </p>
        </div>
        <div className="wp-shelf-placement-badges">
          <span>{placed.length} placed</span>
          <span>{unplaced.length} in tray</span>
        </div>
      </div>

      <div className="wp-shelf-palette-wrap">
        <p className="wp-shelf-palette-label">Tray · drag onto shelf</p>
        {unplaced.length > 0 ? (
          <div className="wp-shelf-palette" aria-label="Unplaced ornaments">
            {unplaced.map((item) => (
              <button
                key={item.id}
                type="button"
                className="wp-shelf-palette-item"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/artifact-id", item.id);
                  e.dataTransfer.effectAllowed = "copy";
                  dragRef.current = { type: "palette", id: item.id };
                }}
                onDragEnd={() => {
                  dragRef.current = null;
                }}
                onClick={() => {
                  const room = roomEl();
                  if (!room) return;
                  const rect = room.getBoundingClientRect();
                  placeAtPointer(
                    {
                      clientX: rect.left + rect.width * 0.5,
                      clientY: rect.top + rect.height * 0.45,
                    },
                    item.id,
                  );
                }}
                title={`Place ${item.name}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.imageUrl} alt="" draggable={false} />
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="wp-sub" style={{ margin: 0 }}>
            {placeable.length
              ? "All ready ornaments are on the shelf."
              : "Enable an ornament with a transparent PNG image to place it."}
          </p>
        )}
      </div>

      {selected ? (
        <div className="wp-shelf-selection">
          <strong>{selected.name}</strong>
          <span>
            {selected.widthRem.toFixed(2)} × {selected.heightRem.toFixed(2)} rem
            {selected.xPercent != null && selected.yPercent != null
              ? ` · ${selected.xPercent.toFixed(0)}%, ${selected.yPercent.toFixed(0)}%`
              : " · unplaced"}
          </span>
          {isShelfArtifactPlaced(selected) ? (
            <button type="button" className="wp-btn" onClick={() => unplace(selected.id)}>
              Remove from shelf
            </button>
          ) : null}
        </div>
      ) : null}

      {loadError ? (
        <div className="wp-notice is-error" role="alert">
          {loadError} Add a Goodreads URL under Hero to preview real shelves.
        </div>
      ) : null}

      <div
        ref={wrapRef}
        className="wp-shelf-canvas"
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("text/artifact-id")) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          const id =
            e.dataTransfer.getData("text/artifact-id") ||
            (dragRef.current?.type === "palette" ? dragRef.current.id : "");
          if (!id) return;
          placeAtPointer(e, id);
          dragRef.current = null;
        }}
      >
        {hasBooks ? (
          <Bookshelf sections={sections} artifacts={[]} interactiveBooks={false} />
        ) : (
          <div className="bookshelf is-placement-canvas">
            <div className="bookshelf-room wp-shelf-empty-room">
              <div className="bookshelf-stage">
                <div className="bookshelf-case">
                  <div className="bookshelf-case-crown" aria-hidden />
                  <div className="bookshelf-case-body">
                    <div className="bookshelf-case-side is-left" aria-hidden />
                    <div className="bookshelf-case-back">
                      <p className="wp-sub" style={{ margin: "2.5rem 1rem", textAlign: "center" }}>
                        {library
                          ? "No books on the visual shelves yet — you can still drop ornaments here."
                          : "Loading shelves…"}
                      </p>
                      <div className="bookshelf-plank" aria-hidden />
                    </div>
                    <div className="bookshelf-case-side is-right" aria-hidden />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={layerRef} className="wp-shelf-decor-editor" aria-label="Placed ornaments">
          {placed.map((item) => (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              className={`bookshelf-artifact wp-shelf-artifact${
                selectedId === item.id ? " is-selected" : ""
              }`}
              style={
                {
                  "--artifact-w": `${item.widthRem}rem`,
                  "--artifact-h": `${item.heightRem}rem`,
                  "--artifact-x": `${item.xPercent}%`,
                  "--artifact-y": `${item.yPercent}%`,
                } as CSSProperties
              }
              onPointerDown={(e) => beginMove(e, item)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedId(item.id);
                }
                if (item.xPercent == null || item.yPercent == null) return;
                const step = e.shiftKey ? 2 : 0.5;
                if (e.key === "ArrowLeft") {
                  e.preventDefault();
                  patchItem(item.id, { xPercent: clamp(item.xPercent - step, 0, 100) });
                }
                if (e.key === "ArrowRight") {
                  e.preventDefault();
                  patchItem(item.id, { xPercent: clamp(item.xPercent + step, 0, 100) });
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  patchItem(item.id, { yPercent: clamp(item.yPercent - step, 0, 100) });
                }
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  patchItem(item.id, { yPercent: clamp(item.yPercent + step, 0, 100) });
                }
                if (e.key === "Backspace" || e.key === "Delete") {
                  e.preventDefault();
                  unplace(item.id);
                }
              }}
              aria-label={`${item.name} (drag to move)`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.imageUrl} alt="" className="bookshelf-artifact-img" draggable={false} />
              {(["nw", "ne", "sw", "se"] as ResizeCorner[]).map((corner) => (
                <span
                  key={corner}
                  className={`wp-shelf-handle is-${corner}`}
                  onPointerDown={(e) => beginResize(e, item, corner)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
