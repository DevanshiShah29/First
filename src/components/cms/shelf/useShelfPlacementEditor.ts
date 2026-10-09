"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent as ReactDragEvent, type PointerEvent as ReactPointerEvent } from "react";
import {
  placedArtifactIds,
  placedBookIds,
  SHELF_STACK_MAX_BOOKS,
  shelfViewportFor,
  type BookOrientation,
  type ShelfArtifactItem,
  type ShelfDecorPlacement,
  type ShelfLayout,
  type ShelfViewport,
} from "@/content/types";
import type { GoodreadsBook, GoodreadsLibrary } from "@/lib/goodreads";
import { shelfSections } from "@/components/reading/shelfSections";
import { shelfLiveBayWidthRem } from "@/components/reading/spineStyle";
import {
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
  resolveDropTarget,
  withViewport,
} from "./shelfBuilderOps";
import {
  clamp,
  clientToRoomPos,
  ORIENTATION_META,
  placementXRem,
  scrollShelfWhileDragging,
  type DragPayload,
  type PaletteKind,
  type PendingDecor,
  type PendingStack,
  type Selection,
} from "./shelfPlacementShared";

export function useShelfPlacementEditor({
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
  const seenPlanksRef = useRef({ viewport, count: view.planks.length });
  useEffect(() => {
    const seen = seenPlanksRef.current;
    const sameViewport = seen.viewport === viewport;
    const previousCount = seen.count;
    seenPlanksRef.current = { viewport, count: view.planks.length };
    if (!sameViewport || view.planks.length <= previousCount) return;
    const row = bayRef.current?.querySelectorAll<HTMLElement>(
      "[data-editor-plank]",
    )[view.planks.length - 1];
    row?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [viewport, view.planks.length]);

  // Drop targets call preventDefault on dragover, which disables native autoscroll.
  useEffect(() => {
    let frame = 0;
    const pointer = { x: 0, y: 0, active: false };

    const tick = () => {
      frame = 0;
      const mode = dragRef.current;
      if (!mode || !pointer.active) return;
      const root = document.scrollingElement;
      const canvas = bayRef.current?.closest(".wp-shelf-canvas");
      const pageBefore = root?.scrollTop ?? 0;
      const canvasBefore = canvas instanceof HTMLElement ? canvas.scrollTop : 0;
      scrollShelfWhileDragging(bayRef.current, pointer.y);
      const pageAfter = root?.scrollTop ?? 0;
      const canvasAfter = canvas instanceof HTMLElement ? canvas.scrollTop : 0;
      const decorDrag =
        mode.source === "palette-decor" ||
        mode.source === "decor-move" ||
        mode.source === "decor-resize" ||
        (mode.source === "palette" && mode.kind === "decor");
      if (!decorDrag && (pageAfter !== pageBefore || canvasAfter !== canvasBefore)) {
        const next = targetAt(pointer.x, pointer.y);
        setInsertPreview((prev) =>
          prev?.plankIndex === next?.plankIndex && prev?.itemIndex === next?.itemIndex
            ? prev
            : next,
        );
      }
      frame = requestAnimationFrame(tick);
    };

    const onDragOver = (ev: DragEvent) => {
      if (!dragRef.current) return;
      pointer.x = ev.clientX;
      pointer.y = ev.clientY;
      pointer.active = true;
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      pointer.active = false;
      cancelAnimationFrame(frame);
      frame = 0;
    };

    document.addEventListener("dragover", onDragOver);
    document.addEventListener("dragend", stop);
    document.addEventListener("drop", stop);
    return () => {
      stop();
      document.removeEventListener("dragover", onDragOver);
      document.removeEventListener("dragend", stop);
      document.removeEventListener("drop", stop);
    };
  }, [targetAt]);

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

  return {
    viewport,
    setViewport,
    selected,
    setSelected,
    counts,
    unplacedBooks,
    view,
    onPaletteDragStart,
    dragRef,
    setInsertPreview,
    onDecorTrayDragStart,
    decorTray,
    placeableDecor,
    commitView,
    selectedLoc,
    bookById,
    editSelectedStack,
    removeSelected,
    selectedDecor,
    roomWidthRem,
    bayRef,
    roomRef,
    onBayDragOver,
    onCabinetDrop,
    liveBayWidthRem,
    draggingItemId,
    setDraggingItemId,
    insertPreview,
    onItemDragStart,
    beginDecorMove,
    beginDecorResize,
    loadError,
    pendingStack,
    appendMax,
    confirmStack,
    setPendingStack,
    pendingDecor,
    confirmDecor,
    setPendingDecor,
    copyDesktopToMobile,
  };
}
