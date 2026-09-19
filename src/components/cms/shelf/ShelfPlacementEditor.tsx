"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent as ReactDragEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  placedArtifactIds,
  placedBookIds,
  SHELF_SPACER_MAX_REM,
  SHELF_SPACER_MIN_REM,
  SHELF_STACK_MAX_BOOKS,
  shelfViewportFor,
  type BookOrientation,
  type ShelfArtifactItem,
  type ShelfDecorPlacement,
  type ShelfLayout,
  type ShelfPlankItem,
  type ShelfViewport,
} from "@/content/types";
import type { GoodreadsBook, GoodreadsLibrary } from "@/lib/goodreads";
import { shelfSections } from "@/components/reading/shelfSections";
import { SpineFace, spineArtClass } from "@/components/reading/SpineFace";
import {
  decorLeftCss,
  shelfLiveBayWidthRem,
  spineStyle,
} from "@/components/reading/spineStyle";
import { plankContentWidthRem, spineBox } from "./shelfFootprint";
import {
  addPlank,
  cloneViewport,
  countPlacedItems,
  ensureLayout,
  findDecor,
  findItemLocation,
  insertItem,
  makeDecorPlacement,
  makeSpacerItem,
  makeStackItem,
  moveItem,
  patchDecor,
  patchItem,
  removeDecor,
  removeItem,
  removePlank,
  resolveDropTarget,
  withViewport,
} from "./shelfBuilderOps";

type PaletteKind = BookOrientation | "decor" | "spacer";

type DragPayload =
  | { source: "palette"; kind: PaletteKind }
  | { source: "palette-decor"; artifactId: string }
  | { source: "item"; itemId: string }
  | {
      source: "decor-move";
      decorId: string;
      offsetXRem: number;
      offsetYPct: number;
    }
  | {
      source: "decor-resize";
      decorId: string;
      corner: "nw" | "ne" | "sw" | "se";
      startX: number;
      startY: number;
      startW: number;
      startH: number;
      startXRem: number;
      startYP: number;
    };

type PendingStack = {
  orientation: BookOrientation;
  plankIndex: number;
  itemIndex: number;
  appendToId?: string;
};

type PendingDecor = { xRem: number; yPercent: number; xPercent: number };

type Selection =
  | { kind: "stack" | "spacer"; id: string }
  | { kind: "decor"; id: string }
  | null;

const ORIENTATION_META: {
  kind: BookOrientation;
  label: string;
  icon: string;
}[] = [
  { kind: "vertical", label: "Vertical", icon: "📚" },
  { kind: "horizontal", label: "Horizontal", icon: "📕" },
  { kind: "tilt-left", label: "Tilt Left", icon: "↙" },
  { kind: "tilt-right", label: "Tilt Right", icon: "↗" },
];

/**
 * Orientation CSS class for editor spines.
 * @example orientClass("tilt-left") // "is-tilt-left"
 */
function orientClass(orientation: BookOrientation) {
  if (orientation === "horizontal") return "is-horizontal";
  if (orientation === "tilt-left") return "is-tilt-left";
  if (orientation === "tilt-right") return "is-tilt-right";
  return "";
}

/**
 * Clamps n into [min, max].
 * @example clamp(12, 0, 10) // 10
 */
function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/**
 * Maps client coords to rem X + % Y inside the shelf room.
 * X uses rem so decor tracks rem-sized stacks when CMS width ≠ live width.
 * @example clientToRoomPos(ev.clientX, ev.clientY, rect, 16)
 */
function clientToRoomPos(
  clientX: number,
  clientY: number,
  rect: DOMRect,
  remSize: number,
) {
  const rem = remSize > 0 ? remSize : 16;
  const xRem = rect.width > 0 ? (clientX - rect.left) / rem : 0;
  const xPercent =
    rect.width > 0 ? ((clientX - rect.left) / rect.width) * 100 : 0;
  const yPercent =
    rect.height > 0 ? ((clientY - rect.top) / rect.height) * 100 : 0;
  return {
    xRem: Math.round(Math.max(0, xRem) * 100) / 100,
    xPercent: clamp(xPercent, 0, 100),
    yPercent: clamp(yPercent, 0, 100),
  };
}

/**
 * Effective horizontal rem for a placement (legacy percent → rem via room width).
 * @example placementXRem(item, 40)
 */
function placementXRem(
  placement: Pick<ShelfDecorPlacement, "xRem" | "xPercent">,
  roomWidthRem: number,
) {
  if (typeof placement.xRem === "number" && Number.isFinite(placement.xRem)) {
    return placement.xRem;
  }
  if (roomWidthRem > 0) {
    return Math.round((placement.xPercent / 100) * roomWidthRem * 100) / 100;
  }
  return 0;
}

/**
 * CMS Shelf Builder: plank stacks + White Space, free-placed resizable decor.
 * @example <ShelfPlacementEditor artifacts={…} shelfLayout={…} … />
 */
export function ShelfPlacementEditor({
  artifacts,
  onChangeArtifacts: _onChangeArtifacts,
  shelfLayout,
  onChangeLayout,
}: {
  artifacts: ShelfArtifactItem[];
  onChangeArtifacts: (next: ShelfArtifactItem[]) => void;
  shelfLayout: ShelfLayout;
  onChangeLayout: (next: ShelfLayout) => void;
}) {
  void _onChangeArtifacts;
  const layout = ensureLayout(shelfLayout);
  const bayRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragPayload | null>(null);

  const [library, setLibrary] = useState<GoodreadsLibrary | null>(null);
  const [loadError, setLoadError] = useState("");
  const [viewport, setViewport] = useState<ShelfViewport>("desktop");
  const [selected, setSelected] = useState<Selection>(null);
  const [insertPreview, setInsertPreview] = useState<{
    plankIndex: number;
    itemIndex: number;
  } | null>(null);
  const [pendingStack, setPendingStack] = useState<PendingStack | null>(null);
  const [pendingDecor, setPendingDecor] = useState<PendingDecor | null>(null);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [roomWidthRem, setRoomWidthRem] = useState(40);
  const migratedXRemRef = useRef<Set<string>>(new Set());

  const view = shelfViewportFor(layout, viewport);
  const liveBayWidthRem = shelfLiveBayWidthRem(viewport);
  const counts = countPlacedItems(layout);

  const sections = useMemo(
    () => (library ? shelfSections(library) : []),
    [library],
  );
  const allBooks = useMemo(() => {
    const map = new Map<string, GoodreadsBook>();
    for (const section of sections) {
      for (const book of section.books) map.set(book.id, book);
    }
    return [...map.values()];
  }, [sections]);
  const bookById = useMemo(() => {
    const map = new Map<string, GoodreadsBook>();
    for (const book of allBooks) map.set(book.id, book);
    return map;
  }, [allBooks]);

  const usedBookIds = placedBookIds(layout, viewport);
  const usedArtifactIds = placedArtifactIds(layout, viewport);

  const placeableDecor = useMemo(
    () => artifacts.filter((a) => a.enabled && Boolean(a.imageUrl.trim())),
    [artifacts],
  );
  const decorTray = placeableDecor.filter((a) => !usedArtifactIds.has(a.id));
  const unplacedBooks = allBooks.filter((b) => !usedBookIds.has(b.id));

  const selectedLoc =
    selected?.kind === "stack" || selected?.kind === "spacer"
      ? findItemLocation(view, selected.id)
      : null;
  const selectedDecor =
    selected?.kind === "decor" ? findDecor(view, selected.id) : null;

  const viewRef = useRef(view);
  const layoutRef = useRef(layout);
  const viewportRef = useRef(viewport);
  useEffect(() => {
    viewRef.current = view;
    layoutRef.current = layout;
    viewportRef.current = viewport;
  }, [view, layout, viewport]);

  /**
   * Measures room width and migrates legacy percent-only decor → xRem using the
   * CMS canvas width (preserves the on-canvas position, which matches the stacks).
   */
  useEffect(() => {
    const room = roomRef.current;
    if (!room) return;

    const syncRoomAndMigrate = () => {
      const rem =
        Number.parseFloat(
          getComputedStyle(document.documentElement).fontSize,
        ) || 16;
      const widthRem = Math.max(4, room.getBoundingClientRect().width / rem);
      setRoomWidthRem(widthRem);

      const current = viewRef.current;
      const needsMigrate = current.decor.some(
        (d) =>
          (d.xRem == null || !Number.isFinite(d.xRem)) &&
          !migratedXRemRef.current.has(`${viewportRef.current}:${d.id}`),
      );
      if (!needsMigrate) return;

      const nextDecor = current.decor.map((d) => {
        const key = `${viewportRef.current}:${d.id}`;
        if (typeof d.xRem === "number" && Number.isFinite(d.xRem)) {
          migratedXRemRef.current.add(key);
          return d;
        }
        if (migratedXRemRef.current.has(key)) return d;
        migratedXRemRef.current.add(key);
        const xRem = Math.round((d.xPercent / 100) * widthRem * 100) / 100;
        return { ...d, xRem };
      });
      onChangeLayout(
        withViewport(layoutRef.current, viewportRef.current, {
          ...cloneViewport(current),
          decor: nextDecor,
        }),
      );
    };

    syncRoomAndMigrate();
    const ro = new ResizeObserver(syncRoomAndMigrate);
    ro.observe(room);
    return () => ro.disconnect();
  }, [viewport, view.decor.length, onChangeLayout]);

  useEffect(() => {
    let cancelled = false;
    /**
     * Loads Goodreads shelves for book picking.
     * @example void load()
     */
    async function load() {
      try {
        const res = await fetch("/api/goodreads", {
          credentials: "same-origin",
        });
        const data = (await res.json()) as GoodreadsLibrary & {
          error?: string;
        };
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
   * Commits a viewport mutation for the active Desktop/Mobile tab.
   * @example commitView(next)
   */
  function commitView(next: ReturnType<typeof cloneViewport>) {
    onChangeLayout(withViewport(layout, viewport, next));
  }

  /**
   * Measures plank rows + item rects for drop targeting.
   * @example measureTargets()
   */
  const measureTargets = useCallback(() => {
    const bay = bayRef.current;
    if (!bay)
      return {
        plankRects: [] as DOMRect[],
        itemRectsByPlank: [] as DOMRect[][],
      };
    const rows = [...bay.querySelectorAll<HTMLElement>("[data-editor-plank]")];
    const plankRects = rows.map((row) => row.getBoundingClientRect());
    const itemRectsByPlank = rows.map((row) =>
      [...row.querySelectorAll<HTMLElement>("[data-editor-item]")].map((el) =>
        el.getBoundingClientRect(),
      ),
    );
    return { plankRects, itemRectsByPlank };
  }, []);

  /**
   * Resolves drop target from pointer, snapping to nearest plank.
   * @example targetAt(x, y)
   */
  const targetAt = useCallback(
    (clientX: number, clientY: number) => {
      const { plankRects, itemRectsByPlank } = measureTargets();
      return resolveDropTarget(clientX, clientY, plankRects, itemRectsByPlank);
    },
    [measureTargets],
  );

  /**
   * Places decor at pointer position inside the shelf room (X in rem).
   * @example placeDecorAt(artifactId, clientX, clientY)
   */
  function placeDecorAt(artifactId: string, clientX: number, clientY: number) {
    const room = roomRef.current;
    if (!room || !artifactId) return;
    const rect = room.getBoundingClientRect();
    const rem =
      Number.parseFloat(getComputedStyle(document.documentElement).fontSize) ||
      16;
    const pos = clientToRoomPos(clientX, clientY, rect, rem);
    const item = makeDecorPlacement(artifactId, pos);
    commitView({ ...cloneViewport(view), decor: [...view.decor, item] });
    setSelected({ kind: "decor", id: item.id });
  }

  /**
   * Handles palette / item / decor drop onto the cabinet.
   * @example handleDrop(ev)
   */
  function handleDrop(ev: ReactDragEvent) {
    ev.preventDefault();
    const target = targetAt(ev.clientX, ev.clientY);
    setInsertPreview(null);
    const payload = dragRef.current;
    dragRef.current = null;
    setDraggingItemId(null);
    if (!payload) return;

    if (payload.source === "item") {
      if (!target) return;
      const before = findItemLocation(view, payload.itemId);
      const kind = before?.item.type === "spacer" ? "spacer" : "stack";
      commitView(
        moveItem(view, payload.itemId, target.plankIndex, target.itemIndex),
      );
      setSelected({ kind, id: payload.itemId });
      return;
    }

    if (payload.source === "palette-decor") {
      if (!payload.artifactId) {
        const room = roomRef.current;
        if (!room) return;
        const rem =
          Number.parseFloat(
            getComputedStyle(document.documentElement).fontSize,
          ) || 16;
        setPendingDecor(
          clientToRoomPos(
            ev.clientX,
            ev.clientY,
            room.getBoundingClientRect(),
            rem,
          ),
        );
        return;
      }
      placeDecorAt(payload.artifactId, ev.clientX, ev.clientY);
      return;
    }

    if (payload.source === "palette") {
      if (payload.kind === "decor") {
        const room = roomRef.current;
        if (!room) return;
        const rem =
          Number.parseFloat(
            getComputedStyle(document.documentElement).fontSize,
          ) || 16;
        setPendingDecor(
          clientToRoomPos(
            ev.clientX,
            ev.clientY,
            room.getBoundingClientRect(),
            rem,
          ),
        );
        return;
      }
      if (!target) return;
      if (payload.kind === "spacer") {
        const item = makeSpacerItem();
        commitView(insertItem(view, target.plankIndex, target.itemIndex, item));
        setSelected({ kind: "spacer", id: item.id });
        return;
      }
      setPendingStack({
        orientation: payload.kind,
        plankIndex: target.plankIndex,
        itemIndex: target.itemIndex,
      });
    }
  }

  /**
   * Places selected Goodreads books as a new stack (or appends to an existing one).
   * @example confirmStack(bookIds)
   */
  function confirmStack(bookIds: string[]) {
    if (!pendingStack) return;
    const unique = bookIds.filter((id) => !usedBookIds.has(id));
    if (!unique.length) {
      setPendingStack(null);
      return;
    }
    if (pendingStack.appendToId) {
      const loc = findItemLocation(view, pendingStack.appendToId);
      if (!loc || loc.item.type !== "book-stack") {
        setPendingStack(null);
        return;
      }
      const nextIds = [...loc.item.bookIds, ...unique].slice(
        0,
        SHELF_STACK_MAX_BOOKS,
      );
      commitView(
        patchItem(view, pendingStack.appendToId, { bookIds: nextIds }),
      );
      setSelected({ kind: "stack", id: pendingStack.appendToId });
      setPendingStack(null);
      return;
    }
    const item = makeStackItem(unique, pendingStack.orientation);
    commitView(
      insertItem(view, pendingStack.plankIndex, pendingStack.itemIndex, item),
    );
    setSelected({ kind: "stack", id: item.id });
    setPendingStack(null);
  }

  /**
   * Places decor from the picker at stored room position.
   * @example confirmDecor(artifactId)
   */
  function confirmDecor(artifactId: string) {
    if (!pendingDecor) return;
    const item = makeDecorPlacement(artifactId, pendingDecor);
    commitView({ ...cloneViewport(view), decor: [...view.decor, item] });
    setSelected({ kind: "decor", id: item.id });
    setPendingDecor(null);
  }

  /**
   * Starts dragging a palette chip.
   * @example onPaletteDragStart(ev, "vertical")
   */
  function onPaletteDragStart(ev: ReactDragEvent, kind: PaletteKind) {
    if (kind === "decor") {
      ev.dataTransfer.setData("text/shelf-decor", "1");
      ev.dataTransfer.effectAllowed = "copy";
      dragRef.current = { source: "palette", kind: "decor" };
      return;
    }
    if (kind === "spacer") {
      ev.dataTransfer.setData("text/shelf-spacer", "1");
      ev.dataTransfer.effectAllowed = "copy";
      dragRef.current = { source: "palette", kind: "spacer" };
      return;
    }
    ev.dataTransfer.setData("text/shelf-orientation", kind);
    ev.dataTransfer.effectAllowed = "copy";
    dragRef.current = { source: "palette", kind };
  }

  /**
   * Starts dragging a specific decor from the tray.
   * @example onDecorTrayDragStart(ev, id)
   */
  function onDecorTrayDragStart(ev: ReactDragEvent, artifactId: string) {
    ev.dataTransfer.setData("text/shelf-artifact-id", artifactId);
    ev.dataTransfer.effectAllowed = "copy";
    dragRef.current = { source: "palette-decor", artifactId };
  }

  /**
   * Starts reordering a placed plank item.
   * @example onItemDragStart(ev, itemId)
   */
  function onItemDragStart(ev: ReactDragEvent, itemId: string) {
    ev.dataTransfer.setData("text/shelf-item-id", itemId);
    ev.dataTransfer.effectAllowed = "move";
    dragRef.current = { source: "item", itemId };
    setDraggingItemId(itemId);
    const loc = findItemLocation(view, itemId);
    if (loc) {
      setSelected({
        kind: loc.item.type === "spacer" ? "spacer" : "stack",
        id: itemId,
      });
    }
  }

  /**
   * Pointer-move preview while dragging over plank bays.
   * @example onBayDragOver(ev)
   */
  function onBayDragOver(ev: ReactDragEvent) {
    ev.preventDefault();
    const movingItem = dragRef.current?.source === "item";
    ev.dataTransfer.dropEffect = movingItem ? "move" : "copy";
    if (
      dragRef.current?.source === "palette-decor" ||
      (dragRef.current?.source === "palette" &&
        dragRef.current.kind === "decor")
    ) {
      setInsertPreview(null);
      return;
    }
    setInsertPreview(targetAt(ev.clientX, ev.clientY));
  }

  /**
   * Drop onto cabinet (reconstructs payload from dataTransfer as fallback).
   * @example onCabinetDrop(ev)
   */
  function onCabinetDrop(ev: ReactDragEvent) {
    const artifactId = ev.dataTransfer.getData("text/shelf-artifact-id");
    const orientation = ev.dataTransfer.getData("text/shelf-orientation");
    const itemId = ev.dataTransfer.getData("text/shelf-item-id");
    const isSpacer = ev.dataTransfer.getData("text/shelf-spacer") === "1";
    const isDecor = ev.dataTransfer.getData("text/shelf-decor") === "1";
    if (itemId) dragRef.current = { source: "item", itemId };
    else if (artifactId)
      dragRef.current = { source: "palette-decor", artifactId };
    else if (isSpacer) dragRef.current = { source: "palette", kind: "spacer" };
    else if (isDecor) dragRef.current = { source: "palette", kind: "decor" };
    else if (
      orientation &&
      ORIENTATION_META.some((o) => o.kind === orientation)
    ) {
      dragRef.current = {
        source: "palette",
        kind: orientation as BookOrientation,
      };
    }
    handleDrop(ev);
  }

  /**
   * Copies desktop layout into mobile.
   * @example copyDesktopToMobile()
   */
  function copyDesktopToMobile() {
    onChangeLayout({
      ...layout,
      mobile: cloneViewport(layout.desktop),
    });
  }

  /**
   * Removes selected stack, spacer, or decor.
   * @example removeSelected()
   */
  function removeSelected() {
    if (!selected) return;
    if (selected.kind === "decor") commitView(removeDecor(view, selected.id));
    else commitView(removeItem(view, selected.id));
    setSelected(null);
  }

  /**
   * Opens the book picker to add books to the selected stack.
   * @example editSelectedStack()
   */
  function editSelectedStack() {
    if (!selectedLoc || selectedLoc.item.type !== "book-stack") return;
    setPendingStack({
      orientation: selectedLoc.item.orientation,
      plankIndex: selectedLoc.plankIndex,
      itemIndex: selectedLoc.itemIndex,
      appendToId: selectedLoc.item.id,
    });
  }

  /**
   * Starts free-moving a decor ornament with pointer capture.
   * @example beginDecorMove(ev, placement)
   */
  function beginDecorMove(
    ev: ReactPointerEvent,
    placement: ShelfDecorPlacement,
  ) {
    ev.preventDefault();
    ev.stopPropagation();
    const room = roomRef.current;
    if (!room) return;
    const rect = room.getBoundingClientRect();
    const rem =
      Number.parseFloat(getComputedStyle(document.documentElement).fontSize) ||
      16;
    const roomWidthRem = Math.max(4, rect.width / rem);
    const pos = clientToRoomPos(ev.clientX, ev.clientY, rect, rem);
    const originX = placementXRem(placement, roomWidthRem);
    dragRef.current = {
      source: "decor-move",
      decorId: placement.id,
      offsetXRem: pos.xRem - originX,
      offsetYPct: pos.yPercent - placement.yPercent,
    };
    setSelected({ kind: "decor", id: placement.id });
    (ev.target as HTMLElement).setPointerCapture?.(ev.pointerId);
  }

  /**
   * Starts resizing decor from a corner handle.
   * @example beginDecorResize(ev, placement, "se", w, h)
   */
  function beginDecorResize(
    ev: ReactPointerEvent,
    placement: ShelfDecorPlacement,
    corner: "nw" | "ne" | "sw" | "se",
    widthRem: number,
    heightRem: number,
  ) {
    ev.preventDefault();
    ev.stopPropagation();
    const room = roomRef.current;
    const rem =
      Number.parseFloat(getComputedStyle(document.documentElement).fontSize) ||
      16;
    const roomWidthRem = room
      ? Math.max(4, room.getBoundingClientRect().width / rem)
      : shelfLiveBayWidthRem(viewport);
    dragRef.current = {
      source: "decor-resize",
      decorId: placement.id,
      corner,
      startX: ev.clientX,
      startY: ev.clientY,
      startW: widthRem,
      startH: heightRem,
      startXRem: placementXRem(placement, roomWidthRem),
      startYP: placement.yPercent,
    };
    setSelected({ kind: "decor", id: placement.id });
    (ev.target as HTMLElement).setPointerCapture?.(ev.pointerId);
  }

  useEffect(() => {
    /**
     * Moves / resizes free decor while pointer is down.
     * @example onMove(ev)
     */
    function onMove(ev: PointerEvent) {
      const mode = dragRef.current;
      if (!mode) return;
      const room = roomRef.current;
      if (!room) return;
      const rect = room.getBoundingClientRect();
      const rem =
        Number.parseFloat(
          getComputedStyle(document.documentElement).fontSize,
        ) || 16;

      if (mode.source === "decor-move") {
        const pos = clientToRoomPos(ev.clientX, ev.clientY, rect, rem);
        const nextXRem = Math.max(0, pos.xRem - mode.offsetXRem);
        const roomWidthRem = Math.max(4, rect.width / rem);
        onChangeLayout(
          withViewport(
            layoutRef.current,
            viewportRef.current,
            patchDecor(viewRef.current, mode.decorId, {
              xRem: Math.round(nextXRem * 100) / 100,
              xPercent: clamp((nextXRem / roomWidthRem) * 100, 0, 100),
              yPercent: clamp(pos.yPercent - mode.offsetYPct, 0, 100),
            }),
          ),
        );
        return;
      }

      if (mode.source === "decor-resize") {
        const dxRem = (ev.clientX - mode.startX) / rem;
        const dyRem = (ev.clientY - mode.startY) / rem;
        let nextW = mode.startW;
        let nextH = mode.startH;
        let nextXRem = mode.startXRem;
        let nextYP = mode.startYP;
        const pctPerRemY = rect.height > 0 ? (rem / rect.height) * 100 : 0;
        const roomWidthRem = Math.max(4, rect.width / rem);

        if (mode.corner.includes("e")) nextW = mode.startW + dxRem;
        if (mode.corner.includes("w")) {
          nextW = mode.startW - dxRem;
          nextXRem = mode.startXRem + dxRem;
        }
        if (mode.corner.includes("s")) nextH = mode.startH + dyRem;
        if (mode.corner.includes("n")) {
          nextH = mode.startH - dyRem;
          nextYP = mode.startYP + dyRem * pctPerRemY;
        }

        nextW = clamp(nextW, 0.5, 24);
        nextH = clamp(nextH, 0.5, 24);
        nextXRem = Math.max(0, nextXRem);
        onChangeLayout(
          withViewport(
            layoutRef.current,
            viewportRef.current,
            patchDecor(viewRef.current, mode.decorId, {
              widthRem: Math.round(nextW * 100) / 100,
              heightRem: Math.round(nextH * 100) / 100,
              xRem: Math.round(nextXRem * 100) / 100,
              xPercent: clamp((nextXRem / roomWidthRem) * 100, 0, 100),
              yPercent: clamp(nextYP, 0, 100),
            }),
          ),
        );
      }
    }

    /**
     * Ends decor pointer drag/resize.
     * @example onUp()
     */
    function onUp() {
      const mode = dragRef.current;
      if (mode?.source === "decor-move" || mode?.source === "decor-resize") {
        dragRef.current = null;
      }
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [onChangeLayout]);

  const appendMax = (() => {
    if (!pendingStack?.appendToId) return SHELF_STACK_MAX_BOOKS;
    const loc = findItemLocation(view, pendingStack.appendToId);
    if (!loc || loc.item.type !== "book-stack") return 0;
    return Math.max(0, SHELF_STACK_MAX_BOOKS - loc.item.bookIds.length);
  })();

  return (
    <div className="wp-shelf-builder">
      <div className="wp-shelf-builder-toolbar">
        <div className="wp-shelf-segment" role="group" aria-label="Viewport">
          <button
            type="button"
            className={`wp-shelf-segment-btn${viewport === "desktop" ? " is-active" : ""}`}
            onClick={() => {
              setViewport("desktop");
              setSelected(null);
            }}>
            Desktop
          </button>
          <button
            type="button"
            className={`wp-shelf-segment-btn${viewport === "mobile" ? " is-active" : ""}`}
            onClick={() => {
              setViewport("mobile");
              setSelected(null);
            }}>
            Mobile
          </button>
        </div>

        <p className="wp-shelf-toolbar-hint">
          <strong>{counts.books}</strong> books placed ({unplacedBooks.length}{" "}
          free) · <strong>{counts.stacks}</strong> stacks ·{" "}
          <strong>{counts.decor}</strong> decor ·{" "}
          <strong>{counts.spacers}</strong> spacers ·{" "}
          <strong>{view.planks.length}</strong> planks
        </p>

        {/* Top Controls: Book stacks, Extras, Planks, Decor tray */}
        <div className="wp-shelf-top-bar" aria-label="Shelf components">
          <section className="wp-shelf-palette-wrap wp-shelf-top-section">
            <p className="wp-shelf-palette-label">Book stacks</p>
            <div className="wp-shelf-palette-row">
              {ORIENTATION_META.map((entry) => (
                <button
                  key={entry.kind}
                  type="button"
                  className="wp-shelf-palette-item"
                  draggable
                  onDragStart={(e) => onPaletteDragStart(e, entry.kind)}
                  onDragEnd={() => {
                    dragRef.current = null;
                    setInsertPreview(null);
                  }}
                  title={`Drag ${entry.label} onto a plank`}>
                  <span className="wp-shelf-palette-icon" aria-hidden>
                    {entry.icon}
                  </span>
                  <span>{entry.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="wp-shelf-palette-wrap wp-shelf-top-section">
            <p className="wp-shelf-palette-label">Extras</p>
            <div className="wp-shelf-palette-row">
              <button
                type="button"
                className="wp-shelf-palette-item"
                draggable
                onDragStart={(e) => onPaletteDragStart(e, "decor")}
                onDragEnd={() => {
                  dragRef.current = null;
                  setInsertPreview(null);
                }}
                title="Drag onto the cabinet, then pick a catalog ornament">
                <span className="wp-shelf-palette-icon" aria-hidden>
                  🪴
                </span>
                <span>Decor picker</span>
              </button>
              <button
                type="button"
                className="wp-shelf-palette-item"
                draggable
                onDragStart={(e) => onPaletteDragStart(e, "spacer")}
                onDragEnd={() => {
                  dragRef.current = null;
                  setInsertPreview(null);
                }}
                title="Drag White Space onto a plank to reserve a gap">
                <span className="wp-shelf-palette-icon" aria-hidden>
                  ⬚
                </span>
                <span>White Space</span>
              </button>
            </div>
          </section>

          <section className="wp-shelf-palette-wrap wp-shelf-top-section">
            <p className="wp-shelf-palette-label">
              Planks ({view.planks.length}/6)
            </p>
            <button
              type="button"
              className="wp-btn wp-btn-small wp-shelf-add-plank"
              disabled={view.planks.length >= 6}
              onClick={() => commitView(addPlank(view))}>
              + Add Plank
            </button>
          </section>

          <section className="wp-shelf-palette-wrap wp-shelf-top-section wp-shelf-top-decor-section">
            <p className="wp-shelf-palette-label">Decor tray</p>
            {decorTray.length > 0 ? (
              <div
                className="wp-shelf-decor-tray-wrap"
                aria-label="Unplaced ornaments">
                {decorTray.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="wp-shelf-palette-item is-decor-chip"
                    draggable
                    onDragStart={(e) => onDecorTrayDragStart(e, item.id)}
                    onDragEnd={() => {
                      dragRef.current = null;
                      setInsertPreview(null);
                    }}
                    title={`Place ${item.name}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.imageUrl} alt="" draggable={false} />
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="wp-shelf-palette-empty">
                {placeableDecor.length === 0
                  ? "Enable an ornament with an image to place decor."
                  : "All enabled ornaments are already on this viewport."}
              </p>
            )}
          </section>
        </div>
      </div>

      {/* Selection Inspector Banner */}
      {selectedLoc && selectedLoc.item.type === "book-stack" ? (
        <div className="wp-shelf-inspector-banner">
          <ItemInspector
            item={selectedLoc.item}
            bookById={bookById}
            unplacedBooks={unplacedBooks}
            onPatch={(patch) =>
              commitView(patchItem(view, selectedLoc.item.id, patch))
            }
            onAddBooks={editSelectedStack}
            onRemoveBook={(bookId) => {
              const stack = selectedLoc.item;
              if (stack.type !== "book-stack") return;
              const nextIds = stack.bookIds.filter((id) => id !== bookId);
              if (!nextIds.length) {
                commitView(removeItem(view, stack.id));
                setSelected(null);
                return;
              }
              commitView(patchItem(view, stack.id, { bookIds: nextIds }));
            }}
            onRemove={removeSelected}
            onClose={() => setSelected(null)}
          />
        </div>
      ) : null}

      {selectedLoc?.item.type === "spacer" ? (
        <div className="wp-shelf-inspector-banner">
          <SpacerInspector
            item={selectedLoc.item}
            onPatch={(patch) =>
              commitView(patchItem(view, selectedLoc.item.id, patch))
            }
            onRemove={removeSelected}
            onClose={() => setSelected(null)}
          />
        </div>
      ) : null}

      {selectedDecor ? (
        <div className="wp-shelf-inspector-banner">
          <DecorInspector
            decor={selectedDecor}
            artifact={artifacts.find((a) => a.id === selectedDecor.artifactId)}
            roomWidthRem={roomWidthRem}
            onPatch={(patch) =>
              commitView(patchDecor(view, selectedDecor.id, patch))
            }
            onRemove={removeSelected}
            onClose={() => setSelected(null)}
          />
        </div>
      ) : null}

      <div className="wp-shelf-canvas-shell">
        <div className="wp-shelf-canvas-label">
          <span>
            {viewport === "mobile"
              ? "Mobile preview (390px)"
              : "Desktop preview (true 67rem)"}
          </span>
          <span className="wp-shelf-canvas-tip">
            Drop on a plank · decor anywhere
          </span>
        </div>
        <div
          className={`wp-shelf-canvas ${
            viewport === "mobile" ? "is-mobile-preview" : "is-desktop-preview"
          }`}>
          <div
            className={
              viewport === "mobile" ? "wp-shelf-mobile-frame" : undefined
            }>
            <div className="bookshelf is-placement-canvas is-builder-layout">
              <div
                ref={roomRef}
                className="bookshelf-room"
                onDragOver={(e) => {
                  e.preventDefault();
                  onBayDragOver(e);
                }}
                onDrop={onCabinetDrop}>
                <div className="bookshelf-stage">
                  <section
                    className="bookshelf-section"
                    aria-label="Shelf builder canvas">
                    <div className="bookshelf-case">
                      <div className="bookshelf-case-crown" aria-hidden />
                      <div className="bookshelf-case-body">
                        <div
                          className="bookshelf-case-side is-left"
                          aria-hidden
                        />
                        <div className="bookshelf-case-back">
                          <div
                            ref={bayRef}
                            className="bookshelf-bay"
                            onDragOver={onBayDragOver}
                            onDragLeave={() => setInsertPreview(null)}>
                            {view.planks.map((plank, plankIndex) => {
                              // Capacity matches live /reading bay width, not the narrower CMS panel.
                              const available = liveBayWidthRem;
                              const used = plankContentWidthRem(
                                plank.items,
                                bookById,
                              );
                              const overflowing = used > available + 0.05;
                              return (
                                <div
                                  key={plank.id}
                                  className={`bookshelf-row wp-shelf-editor-row${
                                    overflowing ? " is-overflowing" : ""
                                  }`}
                                  data-editor-plank={plank.id}>
                                  <div className="wp-shelf-plank-toolbar">
                                    <span>Plank {plankIndex + 1}</span>
                                    {overflowing ? (
                                      <span className="wp-shelf-overflow-badge">
                                        Overflow — contents exceed live plank
                                        width
                                      </span>
                                    ) : null}
                                    <button
                                      type="button"
                                      className="wp-btn wp-btn-small"
                                      disabled={view.planks.length <= 1}
                                      onClick={() => {
                                        commitView(
                                          removePlank(view, plankIndex),
                                        );
                                        setSelected(null);
                                      }}>
                                      Remove
                                    </button>
                                  </div>
                                  <div
                                    className={`bookshelf-books${
                                      plank.items.length === 0
                                        ? " is-empty-bay"
                                        : ""
                                    } wp-shelf-drop-zone${overflowing ? " is-overflowing" : ""}`}>
                                    {plank.items.length === 0 ? (
                                      <span className="wp-shelf-drop-hint">
                                        Drop stacks or White Space here
                                      </span>
                                    ) : null}
                                    {plank.items.map((item, itemIndex) => (
                                      <EditorItem
                                        key={item.id}
                                        item={item}
                                        bookById={bookById}
                                        selected={
                                          (selected?.kind === "stack" ||
                                            selected?.kind === "spacer") &&
                                          selected.id === item.id
                                        }
                                        dragging={draggingItemId === item.id}
                                        showInsertBefore={
                                          insertPreview?.plankIndex ===
                                            plankIndex &&
                                          insertPreview.itemIndex === itemIndex
                                        }
                                        onSelect={() =>
                                          setSelected({
                                            kind:
                                              item.type === "spacer"
                                                ? "spacer"
                                                : "stack",
                                            id: item.id,
                                          })
                                        }
                                        onDragStart={(e) =>
                                          onItemDragStart(e, item.id)
                                        }
                                        onDragEnd={() => {
                                          dragRef.current = null;
                                          setDraggingItemId(null);
                                          setInsertPreview(null);
                                        }}
                                      />
                                    ))}
                                    {insertPreview?.plankIndex === plankIndex &&
                                    insertPreview.itemIndex ===
                                      plank.items.length ? (
                                      <span
                                        className="wp-shelf-insert-caret"
                                        aria-hidden
                                      />
                                    ) : null}
                                  </div>
                                  <div
                                    className="bookshelf-plank"
                                    aria-hidden
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <div
                          className="bookshelf-case-side is-right"
                          aria-hidden
                        />
                      </div>
                    </div>
                  </section>
                </div>

                <div className="bookshelf-decor-layer wp-shelf-decor-editor">
                  {view.decor.map((placement) => (
                    <EditorDecorItem
                      key={placement.id}
                      placement={placement}
                      artifact={artifacts.find(
                        (a) => a.id === placement.artifactId,
                      )}
                      isSelected={
                        selected?.kind === "decor" &&
                        selected.id === placement.id
                      }
                      roomWidthRem={roomWidthRem}
                      onSelect={() =>
                        setSelected({ kind: "decor", id: placement.id })
                      }
                      onMoveStart={(e) => beginDecorMove(e, placement)}
                      onResizeStart={(e, corner, w, h) =>
                        beginDecorResize(e, placement, corner, w, h)
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loadError ? (
        <div className="wp-notice is-error" role="alert">
          {loadError} Add a Goodreads URL under Hero to load books.
        </div>
      ) : null}

      {pendingStack ? (
        <BookPickerModal
          books={unplacedBooks}
          orientation={pendingStack.orientation}
          maxPick={pendingStack.appendToId ? appendMax : SHELF_STACK_MAX_BOOKS}
          title={
            pendingStack.appendToId
              ? "Add books to stack"
              : "Pick Goodreads books"
          }
          onConfirm={confirmStack}
          onClose={() => setPendingStack(null)}
        />
      ) : null}

      {pendingDecor ? (
        <DecorPickerModal
          artifacts={decorTray}
          onPick={confirmDecor}
          onClose={() => setPendingDecor(null)}
        />
      ) : null}
    </div>
  );
}

/**
 * Inspector for a selected book stack — edit books, orientation, or remove.
 * @example <ItemInspector … />
 */
function ItemInspector({
  item,
  bookById,
  unplacedBooks,
  onPatch,
  onAddBooks,
  onRemoveBook,
  onRemove,
  onClose,
}: {
  item: Extract<ShelfPlankItem, { type: "book-stack" }>;
  bookById: Map<string, GoodreadsBook>;
  unplacedBooks: GoodreadsBook[];
  onPatch: (patch: Record<string, unknown>) => void;
  onAddBooks: () => void;
  onRemoveBook: (bookId: string) => void;
  onRemove: () => void;
  onClose?: () => void;
}) {
  const books = item.bookIds
    .map((id) => bookById.get(id))
    .filter((book): book is GoodreadsBook => Boolean(book));

  return (
    <div className="wp-shelf-selection wp-shelf-inspector">
      <div className="wp-shelf-inspector-head">
        <strong>Book Stack</strong>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="wp-shelf-inspector-meta">
            {books.length}/{SHELF_STACK_MAX_BOOKS} books
          </span>
          {onClose ? (
            <button
              type="button"
              className="wp-shelf-inspector-close"
              onClick={onClose}
              title="Deselect"
              aria-label="Deselect">
              ✕
            </button>
          ) : null}
        </div>
      </div>
      <div className="wp-shelf-stack-toolbar">
        <button
          type="button"
          className="wp-btn wp-btn-primary wp-btn-small"
          disabled={
            item.bookIds.length >= SHELF_STACK_MAX_BOOKS ||
            unplacedBooks.length === 0
          }
          onClick={onAddBooks}>
          Edit
        </button>
        <button
          type="button"
          className="wp-btn wp-btn-small"
          onClick={onRemove}>
          Remove
        </button>
      </div>
      <div className="wp-shelf-inspector-field">
        <span>Orientation</span>
        <select
          value={item.orientation}
          onChange={(e) => onPatch({ orientation: e.target.value })}>
          {ORIENTATION_META.map((entry) => (
            <option key={entry.kind} value={entry.kind}>
              {entry.label}
            </option>
          ))}
        </select>
      </div>
      <div className="wp-shelf-inspector-field">
        <span>Books</span>
        <ul className="wp-shelf-stack-books">
          {books.map((book) => (
            <li key={book.id}>
              <span title={book.title}>{book.title}</span>
              <button
                type="button"
                className="wp-btn wp-btn-small"
                onClick={() => onRemoveBook(book.id)}>
                ✕
              </button>
            </li>
          ))}
          {!books.length ? (
            <li className="wp-sub">No books in this stack</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}

/**
 * Inspector for White Space gap.
 */
function SpacerInspector({
  item,
  onPatch,
  onRemove,
  onClose,
}: {
  item: Extract<ShelfPlankItem, { type: "spacer" }>;
  onPatch: (patch: Record<string, unknown>) => void;
  onRemove: () => void;
  onClose?: () => void;
}) {
  return (
    <div className="wp-shelf-selection wp-shelf-inspector">
      <div className="wp-shelf-inspector-head">
        <strong>White Space</strong>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="wp-shelf-inspector-meta">
            {item.widthRem.toFixed(1)} rem
          </span>
          {onClose ? (
            <button
              type="button"
              className="wp-shelf-inspector-close"
              onClick={onClose}
              title="Deselect"
              aria-label="Deselect">
              ✕
            </button>
          ) : null}
        </div>
      </div>
      <div className="wp-shelf-inspector-field">
        <span>Width</span>
        <input
          type="range"
          min={SHELF_SPACER_MIN_REM}
          max={SHELF_SPACER_MAX_REM}
          step={0.1}
          value={item.widthRem}
          onChange={(e) => {
            const n = Number(e.target.value);
            const clamped = clamp(
              n,
              SHELF_SPACER_MIN_REM,
              SHELF_SPACER_MAX_REM,
            );
            onPatch({ widthRem: Math.round(clamped * 100) / 100 });
          }}
        />
        <input
          type="number"
          min={SHELF_SPACER_MIN_REM}
          max={SHELF_SPACER_MAX_REM}
          step={0.1}
          value={item.widthRem}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isFinite(n)) return;
            const clamped = clamp(
              n,
              SHELF_SPACER_MIN_REM,
              SHELF_SPACER_MAX_REM,
            );
            onPatch({ widthRem: Math.round(clamped * 100) / 100 });
          }}
        />
        <span>rem</span>
      </div>
      <button type="button" className="wp-btn wp-btn-small" onClick={onRemove}>
        Remove White Space
      </button>
    </div>
  );
}

/**
 * Inspector for free-placed Decor ornament.
 */
function DecorInspector({
  decor,
  artifact,
  roomWidthRem,
  onPatch,
  onRemove,
  onClose,
}: {
  decor: ShelfDecorPlacement;
  artifact?: ShelfArtifactItem;
  roomWidthRem: number;
  onPatch: (patch: Record<string, unknown>) => void;
  onRemove: () => void;
  onClose?: () => void;
}) {
  return (
    <div className="wp-shelf-selection wp-shelf-inspector">
      <div className="wp-shelf-inspector-head">
        <strong title={artifact?.name || decor.artifactId}>
          Decor: {artifact?.name || "Ornament"}
        </strong>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="wp-shelf-inspector-meta">
            {placementXRem(decor, roomWidthRem).toFixed(1)}rem,{" "}
            {decor.yPercent.toFixed(0)}%
          </span>
          {onClose ? (
            <button
              type="button"
              className="wp-shelf-inspector-close"
              onClick={onClose}
              title="Deselect"
              aria-label="Deselect">
              ✕
            </button>
          ) : null}
        </div>
      </div>
      <div className="wp-shelf-inspector-field">
        <span>Width</span>
        <input
          type="number"
          min={0.5}
          max={24}
          step={0.1}
          value={decor.widthRem ?? artifact?.widthRem ?? 1.85}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isFinite(n) || n <= 0) return;
            onPatch({ widthRem: Math.round(n * 100) / 100 });
          }}
        />
        <span>rem</span>
      </div>
      <div className="wp-shelf-inspector-field">
        <span>Height</span>
        <input
          type="number"
          min={0.5}
          max={24}
          step={0.1}
          value={decor.heightRem ?? artifact?.heightRem ?? 5.4}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isFinite(n) || n <= 0) return;
            onPatch({ heightRem: Math.round(n * 100) / 100 });
          }}
        />
        <span>rem</span>
      </div>
      <button type="button" className="wp-btn wp-btn-small" onClick={onRemove}>
        Remove decor
      </button>
    </div>
  );
}

/**
 * Free-placed decor component inside bookshelf-decor-layer.
 */
function EditorDecorItem({
  placement,
  artifact,
  isSelected,
  roomWidthRem,
  onSelect,
  onMoveStart,
  onResizeStart,
}: {
  placement: ShelfDecorPlacement;
  artifact?: ShelfArtifactItem;
  isSelected: boolean;
  roomWidthRem: number;
  onSelect: () => void;
  onMoveStart: (e: ReactPointerEvent) => void;
  onResizeStart: (
    e: ReactPointerEvent,
    corner: "nw" | "ne" | "sw" | "se",
    widthRem: number,
    heightRem: number,
  ) => void;
}) {
  const widthRem = placement.widthRem ?? artifact?.widthRem ?? 1.85;
  const heightRem = placement.heightRem ?? artifact?.heightRem ?? 5.4;

  return (
    <div
      role="button"
      tabIndex={0}
      className={`bookshelf-artifact is-free wp-shelf-artifact${isSelected ? " is-selected" : ""}`}
      style={
        {
          "--artifact-w": `${widthRem}rem`,
          "--artifact-h": `${heightRem}rem`,
          "--artifact-x": decorLeftCss(placement, roomWidthRem),
          "--artifact-y": `${placement.yPercent}%`,
        } as CSSProperties
      }
      onPointerDown={onMoveStart}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-label={`${artifact?.name || "Decor"} (drag to move, handles to resize)`}>
      {artifact?.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={artifact.imageUrl}
          alt=""
          className="bookshelf-artifact-img"
          draggable={false}
        />
      ) : (
        <span className="wp-sub">Missing</span>
      )}
      {isSelected
        ? (["nw", "ne", "sw", "se"] as const).map((corner) => (
            <span
              key={corner}
              className={`wp-shelf-handle is-${corner}`}
              onPointerDown={(e) =>
                onResizeStart(e, corner, widthRem, heightRem)
              }
            />
          ))
        : null}
    </div>
  );
}

/**
 * One placed plank item in the editor drop zone.
 * @example <EditorItem item={…} … />
 */
function EditorItem({
  item,
  bookById,
  selected,
  dragging,
  showInsertBefore,
  onSelect,
  onDragStart,
  onDragEnd,
}: {
  item: ShelfPlankItem;
  bookById: Map<string, GoodreadsBook>;
  selected: boolean;
  dragging: boolean;
  showInsertBefore: boolean;
  onSelect: () => void;
  onDragStart: (e: ReactDragEvent) => void;
  onDragEnd: () => void;
}) {
  if (item.type === "spacer") {
    return (
      <>
        {showInsertBefore ? (
          <span className="wp-shelf-insert-caret" aria-hidden />
        ) : null}
        <div
          role="button"
          tabIndex={0}
          data-editor-item={item.id}
          draggable
          className={`wp-shelf-spacer${selected ? " is-selected" : ""}${
            dragging ? " is-dragging" : ""
          }`}
          style={{
            width: `${item.widthRem}rem`,
            flex: `0 0 ${item.widthRem}rem`,
          }}
          onClick={onSelect}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect();
            }
          }}
          aria-label={`White Space ${item.widthRem}rem (drag to reorder)`}>
          White Space
        </div>
      </>
    );
  }

  const books = item.bookIds
    .map((id) => bookById.get(id))
    .filter((book): book is GoodreadsBook => Boolean(book));

  return (
    <>
      {showInsertBefore ? (
        <span className="wp-shelf-insert-caret" aria-hidden />
      ) : null}
      <div
        role="button"
        tabIndex={0}
        data-editor-item={item.id}
        draggable
        className={`bookshelf-stack wp-shelf-stack ${orientClass(item.orientation)}${
          selected ? " is-selected" : ""
        }${dragging ? " is-dragging" : ""}`}
        onClick={onSelect}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect();
          }
        }}
        aria-label={
          books.length
            ? `${books.map((b) => b.title).join(", ")} (select to edit or remove)`
            : "Empty stack"
        }>
        {books.map((book) => {
          const box = spineBox(book, item.orientation);
          return (
            <div
              key={book.id}
              className={`bookshelf-spine ${spineArtClass(book)} ${orientClass(item.orientation)}`}
              style={
                {
                  "--spine-width": `${box.widthRem}rem`,
                  "--spine-height": `${box.heightRem}rem`,
                  "--spine-color": box.style.color,
                  "--spine-text": box.style.textColor,
                } as CSSProperties
              }>
              <SpineFace book={book} style={box.style} />
            </div>
          );
        })}
        {!books.length ? <span className="wp-sub">Missing books</span> : null}
      </div>
    </>
  );
}

/**
 * Modal to multi-pick Goodreads books for a stack.
 * @example <BookPickerModal … />
 */
function BookPickerModal({
  books,
  orientation,
  maxPick,
  title,
  onConfirm,
  onClose,
}: {
  books: GoodreadsBook[];
  orientation: BookOrientation;
  maxPick: number;
  title: string;
  onConfirm: (bookIds: string[]) => void;
  onClose: () => void;
}) {
  const [picked, setPicked] = useState<string[]>([]);

  /**
   * Toggles a book in the multi-select set.
   * @example toggle(id)
   */
  function toggle(id: string) {
    setPicked((current) => {
      if (current.includes(id)) return current.filter((x) => x !== id);
      if (current.length >= maxPick) return current;
      return [...current, id];
    });
  }

  return (
    <div
      className="wp-shelf-modal-backdrop"
      role="presentation"
      onClick={onClose}>
      <div
        className="wp-shelf-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shelf-book-picker-title"
        onClick={(e) => e.stopPropagation()}>
        <div className="wp-shelf-modal-head">
          <h3 id="shelf-book-picker-title">{title}</h3>
          <p className="wp-sub">
            Orientation: <strong>{orientation}</strong> · Select up to {maxPick}
          </p>
        </div>
        <div className="wp-shelf-modal-body">
          {books.length === 0 || maxPick <= 0 ? (
            <p className="wp-sub">No more books available for this stack.</p>
          ) : (
            <ul className="wp-shelf-picker-list">
              {books.map((book) => {
                const checked = picked.includes(book.id);
                const disabled = !checked && picked.length >= maxPick;
                return (
                  <li key={book.id}>
                    <button
                      type="button"
                      className={`wp-shelf-picker-item${checked ? " is-checked" : ""}${
                        disabled ? " is-disabled" : ""
                      }`}
                      disabled={disabled}
                      onClick={() => toggle(book.id)}>
                      <input
                        type="checkbox"
                        readOnly
                        checked={checked}
                        tabIndex={-1}
                      />
                      <span
                        aria-hidden
                        className="wp-shelf-picker-swatch"
                        style={{ background: spineStyle(book).color }}
                      />
                      <span className="wp-shelf-picker-copy">
                        <span className="wp-shelf-picker-title">
                          {book.title}
                        </span>
                        {book.author ? (
                          <span className="wp-shelf-picker-author">
                            {book.author}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="wp-shelf-modal-footer">
          <button
            type="button"
            className="wp-btn wp-btn-primary"
            disabled={picked.length === 0}
            onClick={() => onConfirm(picked)}>
            Add {picked.length || ""} {picked.length === 1 ? "book" : "books"}
          </button>
          <button type="button" className="wp-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Modal to pick a catalog ornament after dropping Decor.
 * @example <DecorPickerModal … />
 */
function DecorPickerModal({
  artifacts,
  onPick,
  onClose,
}: {
  artifacts: ShelfArtifactItem[];
  onPick: (artifactId: string) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="wp-shelf-modal-backdrop"
      role="presentation"
      onClick={onClose}>
      <div
        className="wp-shelf-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shelf-decor-picker-title"
        onClick={(e) => e.stopPropagation()}>
        <div className="wp-shelf-modal-head">
          <h3 id="shelf-decor-picker-title">Pick decor</h3>
          <p className="wp-sub">Choose an enabled ornament for this spot.</p>
        </div>
        <div className="wp-shelf-modal-body">
          {artifacts.length === 0 ? (
            <p className="wp-sub">
              No enabled ornaments left for this viewport. Add one in the
              catalog below.
            </p>
          ) : (
            <ul className="wp-shelf-picker-list">
              {artifacts.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="wp-shelf-picker-item is-decor"
                    onClick={() => onPick(item.id)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.imageUrl} alt="" draggable={false} />
                    <span className="wp-shelf-picker-title">{item.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="wp-shelf-modal-footer">
          <button type="button" className="wp-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
