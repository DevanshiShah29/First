import {
  createEmptyPlanks,
  emptyViewportLayout,
  SHELF_SPACER_DEFAULT_REM,
  SHELF_SPACER_MAX_REM,
  SHELF_SPACER_MIN_REM,
  SHELF_STACK_MAX_BOOKS,
  shelfViewportFor,
  type BookOrientation,
  type ShelfDecorPlacement,
  type ShelfLayout,
  type ShelfPlank,
  type ShelfPlankItem,
  type ShelfViewport,
  type ShelfViewportLayout,
} from "@/content/types";

/**
 * Creates a unique-enough id for shelf editor entities.
 * @example newShelfId("stack") // "stack-…"
 */
export function newShelfId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Date.now().toString(36)}`;
}

/**
 * Normalizes one viewport: drops invalid plank rows, lifts stray decor, ensures arrays.
 * @example sanitizeViewport(view) // ShelfViewportLayout
 */
export function sanitizeViewport(view: ShelfViewportLayout): ShelfViewportLayout {
  const decor = Array.isArray(view.decor) ? view.decor.map((item) => ({ ...item })) : [];
  const seenArtifacts = new Set(decor.map((d) => d.artifactId).filter(Boolean));
  const planks = (view.planks ?? []).map((plank) => ({
    id: plank.id,
    items: (plank.items ?? [])
      .map((item): ShelfPlankItem | null => {
        if (!item || typeof item !== "object") return null;
        const row = item as unknown as {
          id?: string;
          type?: string;
          artifactId?: string;
          bookIds?: string[];
          widthRem?: number;
          heightRem?: number | null;
          orientation?: BookOrientation;
        };
        // Stray inline decor → free layer.
        if (row.type === "decor" && row.artifactId) {
          if (!seenArtifacts.has(row.artifactId)) {
            seenArtifacts.add(row.artifactId);
            decor.push({
              id: row.id || newShelfId("decor"),
              artifactId: row.artifactId,
              xPercent: 42,
              xRem: null,
              yPercent: 28,
              widthRem: row.widthRem ?? null,
              heightRem: row.heightRem ?? null,
            });
          }
          return null;
        }
        if (row.type === "spacer") {
          return {
            id: row.id || newShelfId("spacer"),
            type: "spacer",
            widthRem:
              typeof row.widthRem === "number" && row.widthRem > 0
                ? row.widthRem
                : SHELF_SPACER_DEFAULT_REM,
          };
        }
        const bookIds = Array.isArray(row.bookIds) ? row.bookIds.filter(Boolean) : [];
        if (
          (row.type === "book-stack" || row.type === "stack" || bookIds.length > 0) &&
          bookIds.length > 0
        ) {
          return {
            id: row.id || newShelfId("stack"),
            type: "book-stack",
            orientation: row.orientation ?? "vertical",
            bookIds: bookIds.slice(0, SHELF_STACK_MAX_BOOKS),
          };
        }
        return null;
      })
      .filter((item): item is ShelfPlankItem => Boolean(item)),
  }));
  return { planks, decor };
}

/**
 * Deep-clones a viewport layout (planks + free decor).
 * @example cloneViewport(view) // ShelfViewportLayout
 */
export function cloneViewport(view: ShelfViewportLayout): ShelfViewportLayout {
  return sanitizeViewport(view);
}

/**
 * Writes a viewport tree back onto the full layout.
 * @example withViewport(layout, "mobile", next) // ShelfLayout
 */
export function withViewport(
  layout: ShelfLayout,
  viewport: ShelfViewport,
  next: ShelfViewportLayout,
): ShelfLayout {
  return viewport === "mobile"
    ? { ...layout, mobile: next }
    : { ...layout, desktop: next };
}

/**
 * Finds plank + item index for an item id.
 * @example findItemLocation(view, id)
 */
export function findItemLocation(view: ShelfViewportLayout, itemId: string) {
  for (let plankIndex = 0; plankIndex < view.planks.length; plankIndex += 1) {
    const plank = view.planks[plankIndex];
    if (!plank) continue;
    const itemIndex = plank.items.findIndex((item) => item.id === itemId);
    if (itemIndex >= 0) return { plankIndex, itemIndex, plank, item: plank.items[itemIndex]! };
  }
  return null;
}

/**
 * Finds a free decor placement by id.
 * @example findDecor(view, id)
 */
export function findDecor(view: ShelfViewportLayout, decorId: string) {
  return view.decor.find((item) => item.id === decorId) ?? null;
}

/**
 * Removes a plank item by id.
 * @example removeItem(view, id)
 */
export function removeItem(view: ShelfViewportLayout, itemId: string): ShelfViewportLayout {
  return {
    ...view,
    planks: view.planks.map((plank) => ({
      ...plank,
      items: plank.items.filter((item) => item.id !== itemId),
    })),
  };
}

/**
 * Removes a free decor placement by id.
 * @example removeDecor(view, id)
 */
export function removeDecor(view: ShelfViewportLayout, decorId: string): ShelfViewportLayout {
  return {
    ...view,
    decor: view.decor.filter((item) => item.id !== decorId),
  };
}

/**
 * Inserts a plank item at index.
 * @example insertItem(view, 0, 1, item)
 */
export function insertItem(
  view: ShelfViewportLayout,
  plankIndex: number,
  itemIndex: number,
  item: ShelfPlankItem,
): ShelfViewportLayout {
  const next = cloneViewport(view);
  const plank = next.planks[plankIndex];
  if (!plank) return view;
  const idx = Math.max(0, Math.min(itemIndex, plank.items.length));
  plank.items.splice(idx, 0, item);
  return next;
}

/**
 * Moves an existing plank item to a new plank/index.
 * @example moveItem(view, id, 1, 0)
 */
export function moveItem(
  view: ShelfViewportLayout,
  itemId: string,
  toPlankIndex: number,
  toItemIndex: number,
): ShelfViewportLayout {
  const loc = findItemLocation(view, itemId);
  if (!loc) return view;
  const item =
    loc.item.type === "book-stack"
      ? { ...loc.item, bookIds: [...loc.item.bookIds] }
      : { ...loc.item };
  let next = removeItem(view, itemId);
  let insertAt = toItemIndex;
  if (loc.plankIndex === toPlankIndex && loc.itemIndex < toItemIndex) {
    insertAt = Math.max(0, toItemIndex - 1);
  }
  return insertItem(next, toPlankIndex, insertAt, item);
}

/**
 * Patches a plank item by id.
 * @example patchItem(view, id, { orientation: "tilt-left" })
 */
export function patchItem(
  view: ShelfViewportLayout,
  itemId: string,
  patch: Partial<ShelfPlankItem>,
): ShelfViewportLayout {
  return {
    ...view,
    planks: view.planks.map((plank) => ({
      ...plank,
      items: plank.items.map((item) => {
        if (item.id !== itemId) return item;
        if (item.type === "book-stack") {
          const next = { ...item, ...patch } as typeof item;
          if ("bookIds" in patch && Array.isArray(patch.bookIds)) {
            next.bookIds = [...patch.bookIds];
          }
          return next;
        }
        return { ...item, ...patch } as ShelfPlankItem;
      }),
    })),
  };
}

/**
 * Patches a free decor placement by id.
 * @example patchDecor(view, id, { xPercent: 10 })
 */
export function patchDecor(
  view: ShelfViewportLayout,
  decorId: string,
  patch: Partial<ShelfDecorPlacement>,
): ShelfViewportLayout {
  return {
    ...view,
    decor: view.decor.map((item) => (item.id === decorId ? { ...item, ...patch } : item)),
  };
}

/**
 * Appends an empty plank (max 6).
 * @example addPlank(view)
 */
export function addPlank(view: ShelfViewportLayout): ShelfViewportLayout {
  if (view.planks.length >= 6) return view;
  return {
    ...view,
    planks: [...view.planks, { id: newShelfId("plank"), items: [] }],
  };
}

/**
 * Removes a plank by index (keeps at least one).
 * @example removePlank(view, 1)
 */
export function removePlank(view: ShelfViewportLayout, plankIndex: number): ShelfViewportLayout {
  if (view.planks.length <= 1) return view;
  return {
    ...view,
    planks: view.planks.filter((_, i) => i !== plankIndex),
  };
}

/**
 * Strips decor placements referencing an artifact id from both viewports.
 * @example removeArtifactFromLayout(layout, id)
 */
export function removeArtifactFromLayout(layout: ShelfLayout, artifactId: string): ShelfLayout {
  const strip = (view: ShelfViewportLayout): ShelfViewportLayout => ({
    ...view,
    decor: view.decor.filter((item) => item.artifactId !== artifactId),
  });
  return {
    desktop: strip(layout.desktop),
    mobile: strip(layout.mobile),
  };
}

/**
 * Counts placed books / stacks / spacers / decor across both viewports.
 * @example countPlacedItems(layout)
 */
export function countPlacedItems(layout: ShelfLayout) {
  let books = 0;
  let stacks = 0;
  let spacers = 0;
  let decor = 0;
  for (const viewport of ["desktop", "mobile"] as const) {
    const view = shelfViewportFor(layout, viewport);
    decor += view.decor.length;
    for (const plank of view.planks) {
      for (const item of plank.items) {
        if (item.type === "book-stack") {
          stacks += 1;
          books += Array.isArray(item.bookIds) ? item.bookIds.length : 0;
        } else if (item.type === "spacer") {
          spacers += 1;
        }
      }
    }
  }
  return { books, stacks, spacers, decor };
}

/**
 * Builds a book-stack plank item.
 * @example makeStackItem(["gr-1"], "vertical")
 */
export function makeStackItem(bookIds: string[], orientation: BookOrientation): ShelfPlankItem {
  return {
    id: newShelfId("stack"),
    type: "book-stack",
    orientation,
    bookIds: bookIds.slice(0, SHELF_STACK_MAX_BOOKS),
  };
}

/**
 * Builds a free decor placement. Prefer `xRem` (matches rem-sized stacks); `xPercent` kept for legacy.
 * @example makeDecorPlacement("art-1", { xRem: 12.5, yPercent: 30 })
 */
export function makeDecorPlacement(
  artifactId: string,
  position: { xRem: number; yPercent: number; xPercent?: number },
  size?: { widthRem?: number | null; heightRem?: number | null },
): ShelfDecorPlacement {
  const xRem = Math.round(Math.max(0, position.xRem) * 100) / 100;
  const xPercent =
    typeof position.xPercent === "number" && Number.isFinite(position.xPercent)
      ? Math.min(100, Math.max(0, position.xPercent))
      : 0;
  return {
    id: newShelfId("decor"),
    artifactId,
    xPercent,
    xRem,
    yPercent: position.yPercent,
    widthRem: size?.widthRem ?? null,
    heightRem: size?.heightRem ?? null,
  };
}

/**
 * Builds a White Space spacer plank item.
 * @example makeSpacerItem(7.5)
 */
export function makeSpacerItem(widthRem = SHELF_SPACER_DEFAULT_REM): ShelfPlankItem {
  const width = Math.min(
    SHELF_SPACER_MAX_REM,
    Math.max(SHELF_SPACER_MIN_REM, widthRem),
  );
  return {
    id: newShelfId("spacer"),
    type: "spacer",
    widthRem: Math.round(width * 100) / 100,
  };
}

/**
 * Ensures layout has valid plank trees + decor arrays.
 * @example ensureLayout(layout)
 */
export function ensureLayout(layout: ShelfLayout | undefined | null): ShelfLayout {
  if (!layout?.desktop?.planks?.length || !layout?.mobile?.planks?.length) {
    return {
      desktop: emptyViewportLayout(2),
      mobile: emptyViewportLayout(2),
    };
  }
  return {
    desktop: sanitizeViewport({
      planks: layout.desktop.planks,
      decor: Array.isArray(layout.desktop.decor) ? layout.desktop.decor : [],
    }),
    mobile: sanitizeViewport({
      planks: layout.mobile.planks,
      decor: Array.isArray(layout.mobile.decor) ? layout.mobile.decor : [],
    }),
  };
}

/**
 * Pads/truncates plank count while preserving decor.
 * @example normalizePlankCount(view, 3)
 */
export function normalizePlankCount(view: ShelfViewportLayout, count: number): ShelfViewportLayout {
  const n = Math.min(6, Math.max(1, count));
  if (view.planks.length === n) return view;
  if (view.planks.length > n) return { ...view, planks: view.planks.slice(0, n) };
  const extra = createEmptyPlanks(n - view.planks.length).map((plank, i) => ({
    ...plank,
    id: newShelfId(`plank-extra-${i}`),
  }));
  return { ...view, planks: [...view.planks, ...extra] };
}

/** Drop target resolved from pointer geometry. */
export type DropTarget = {
  plankIndex: number;
  itemIndex: number;
};

/**
 * Resolves which plank + insertion index a pointer is over.
 * @example resolveDropTarget(clientX, clientY, plankRects, itemRects)
 */
export function resolveDropTarget(
  clientX: number,
  clientY: number,
  plankRects: DOMRect[],
  itemRectsByPlank: DOMRect[][],
): DropTarget | null {
  if (!plankRects.length) return null;

  let bestPlank = 0;
  let bestDist = Infinity;
  for (let i = 0; i < plankRects.length; i += 1) {
    const r = plankRects[i];
    if (!r) continue;
    const dist =
      clientY < r.top ? r.top - clientY : clientY > r.bottom ? clientY - r.bottom : 0;
    if (dist < bestDist) {
      bestDist = dist;
      bestPlank = i;
    }
  }

  const items = itemRectsByPlank[bestPlank] ?? [];
  if (!items.length) return { plankIndex: bestPlank, itemIndex: 0 };

  for (let i = 0; i < items.length; i += 1) {
    const r = items[i];
    if (!r) continue;
    const mid = r.left + r.width / 2;
    if (clientX < mid) return { plankIndex: bestPlank, itemIndex: i };
  }
  return { plankIndex: bestPlank, itemIndex: items.length };
}

/**
 * Flattens plank items.
 * @example flatItems(view)
 */
export function flatItems(view: ShelfViewportLayout): ShelfPlankItem[] {
  return view.planks.flatMap((plank) => plank.items);
}

/**
 * Type guard for plank arrays.
 * @example isShelfPlank(p)
 */
export function isShelfPlank(value: ShelfPlank | undefined): value is ShelfPlank {
  return Boolean(value);
}
