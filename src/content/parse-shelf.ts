import {
  SHELF_SPACER_DEFAULT_REM,
  SHELF_SPACER_MAX_REM,
  SHELF_SPACER_MIN_REM,
  SHELF_STACK_MAX_BOOKS,
  createEmptyPlanks,
  emptyViewportLayout,
  isBookOrientation,
  type BookOrientation,
  type ShelfArtifactItem,
  type ShelfDecorPlacement,
  type ShelfLayout,
  type ShelfPlank,
  type ShelfPlankItem,
  type ShelfViewportLayout,
} from "./types";
import { asRecord, str } from "./parse-fields";

/**
 * Parses a positive rem size (no max — CMS may scale ornaments freely).
 * @example parsePositiveRem(9, 1.85) // 9
 */
function parsePositiveRem(value: unknown, fallback: number) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return n;
}

/**
 * Parses shelf artifact catalog JSON (placement lives in ShelfLayout).
 * @example parseShelfArtifacts([{name:"Plant"}]) // ShelfArtifactItem[]
 */
export function parseShelfArtifacts(value: unknown): ShelfArtifactItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, i) => {
    const row = asRecord(item);
    return {
      id: str(row.id, `artifact-${i + 1}`),
      name: str(row.name).trim(),
      imageUrl: str(row.imageUrl),
      widthRem: parsePositiveRem(row.widthRem, 1.85),
      heightRem: parsePositiveRem(row.heightRem, 5.4),
      enabled: row.enabled !== false,
    };
  });
}

/**
 * Parses an optional positive rem (null when missing/invalid).
 * @example parseOptionalPositiveRem(2.1) // 2.1
 */
function parseOptionalPositiveRem(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/**
 * Clamps spacer width into the allowed rem range.
 * @example clampSpacerWidth(3) // 3
 */
function clampSpacerWidth(value: unknown, fallback = SHELF_SPACER_DEFAULT_REM): number {
  const n = typeof value === "number" ? value : Number(value);
  const base = Number.isFinite(n) && n > 0 ? n : fallback;
  return (
    Math.round(
      Math.min(SHELF_SPACER_MAX_REM, Math.max(SHELF_SPACER_MIN_REM, base)) * 100,
    ) / 100
  );
}

/**
 * Parses free decor placement; skips invalid rows.
 * @example parseShelfDecor({artifactId:"a",xPercent:10,yPercent:20}, 0)
 */
function parseShelfDecor(value: unknown, index: number): ShelfDecorPlacement | null {
  const row = asRecord(value);
  const artifactId = str(row.artifactId);
  if (!artifactId) return null;
  const x = typeof row.xPercent === "number" ? row.xPercent : Number(row.xPercent);
  const y = typeof row.yPercent === "number" ? row.yPercent : Number(row.yPercent);
  const xRemRaw = typeof row.xRem === "number" ? row.xRem : Number(row.xRem);
  const xRem =
    Number.isFinite(xRemRaw) && xRemRaw >= 0 ? Math.min(120, xRemRaw) : null;
  return {
    id: str(row.id, `decor-${index + 1}`),
    artifactId,
    xPercent: Number.isFinite(x) ? Math.min(100, Math.max(0, x)) : 42,
    xRem,
    yPercent: Number.isFinite(y) ? Math.min(100, Math.max(0, y)) : 28,
    widthRem: parseOptionalPositiveRem(row.widthRem),
    heightRem: parseOptionalPositiveRem(row.heightRem),
  };
}

/**
 * Parses one plank item (book-stack or spacer). Inline decor is lifted to free layer.
 * @example parseShelfPlankItem({type:"book-stack",bookIds:["1"]}, 0)
 */
function parseShelfPlankItem(
  value: unknown,
  index: number,
): { item: ShelfPlankItem | null; liftedDecor: ShelfDecorPlacement | null } {
  const row = asRecord(value);
  const id = str(row.id, `item-${index + 1}`);
  const type = str(row.type);
  const orientationRaw = str(row.orientation, "vertical");
  const orientation: BookOrientation = isBookOrientation(orientationRaw)
    ? orientationRaw
    : "vertical";

  // Legacy inline plank decor → free decor layer.
  if (type === "decor") {
    const artifactId = str(row.artifactId);
    if (!artifactId) return { item: null, liftedDecor: null };
    return {
      item: null,
      liftedDecor: {
        id,
        artifactId,
        xPercent: 42,
        xRem: null,
        yPercent: 28,
        widthRem: parseOptionalPositiveRem(row.widthRem),
        heightRem: parseOptionalPositiveRem(row.heightRem),
      },
    };
  }

  if (type === "spacer") {
    return {
      item: { id, type: "spacer", widthRem: clampSpacerWidth(row.widthRem) },
      liftedDecor: null,
    };
  }

  if (type === "stack" || type === "book-stack" || Array.isArray(row.bookIds)) {
    const rawIds = Array.isArray(row.bookIds) ? row.bookIds : [];
    const bookIds = rawIds
      .map((idValue) => str(idValue))
      .filter(Boolean)
      .slice(0, SHELF_STACK_MAX_BOOKS);
    if (!bookIds.length) return { item: null, liftedDecor: null };
    return { item: { id, type: "book-stack", orientation, bookIds }, liftedDecor: null };
  }

  // Legacy single-book plank item → one-book stack.
  if (type === "book" || row.bookId) {
    const bookId = str(row.bookId);
    if (!bookId) return { item: null, liftedDecor: null };
    return {
      item: { id, type: "book-stack", orientation, bookIds: [bookId] },
      liftedDecor: null,
    };
  }

  return { item: null, liftedDecor: null };
}

/**
 * Dedupes book ids on planks and artifact ids on free decor.
 * @example dedupeViewportItems(view) // ShelfViewportLayout
 */
function dedupeViewportItems(view: ShelfViewportLayout): ShelfViewportLayout {
  const seenBooks = new Set<string>();
  const seenArtifacts = new Set<string>();
  return {
    planks: view.planks.map((plank) => ({
      ...plank,
      items: plank.items
        .map((item) => {
          if (item.type !== "book-stack") return item;
          const bookIds = item.bookIds.filter((bookId) => {
            if (seenBooks.has(bookId)) return false;
            seenBooks.add(bookId);
            return true;
          });
          return { ...item, bookIds };
        })
        .filter((item) => item.type !== "book-stack" || item.bookIds.length > 0),
    })),
    decor: view.decor.filter((entry) => {
      if (seenArtifacts.has(entry.artifactId)) return false;
      seenArtifacts.add(entry.artifactId);
      return true;
    }),
  };
}

/**
 * Parses a viewport layout (plank stacks/spacers + free decor).
 * @example parseViewportLayout({planks:[]}, 2) // ShelfViewportLayout
 */
function parseViewportLayout(value: unknown, fallbackPlankCount: number): ShelfViewportLayout {
  const root = asRecord(value);
  const planksRaw = Array.isArray(root.planks) ? root.planks : null;
  if (!planksRaw) return emptyViewportLayout(fallbackPlankCount);

  const liftedDecor: ShelfDecorPlacement[] = [];
  const planks: ShelfPlank[] = planksRaw.slice(0, 6).map((raw, i) => {
    const row = asRecord(raw);
    const itemsRaw = Array.isArray(row.items) ? row.items : [];
    const items: ShelfPlankItem[] = [];
    itemsRaw.forEach((item, j) => {
      const parsed = parseShelfPlankItem(item, j);
      if (parsed.item) items.push(parsed.item);
      if (parsed.liftedDecor) liftedDecor.push(parsed.liftedDecor);
    });
    return {
      id: str(row.id, `plank-${i + 1}`),
      items,
    };
  });

  const decorRaw = Array.isArray(root.decor) ? root.decor : [];
  const decor: ShelfDecorPlacement[] = [];
  const seenArtifacts = new Set<string>();
  decorRaw.forEach((item, i) => {
    const parsed = parseShelfDecor(item, i);
    if (!parsed || seenArtifacts.has(parsed.artifactId)) return;
    seenArtifacts.add(parsed.artifactId);
    decor.push(parsed);
  });
  for (const lifted of liftedDecor) {
    if (seenArtifacts.has(lifted.artifactId)) continue;
    seenArtifacts.add(lifted.artifactId);
    decor.push(lifted);
  }

  if (!planks.length) return emptyViewportLayout(fallbackPlankCount);
  return dedupeViewportItems({ planks, decor });
}

/**
 * Migrates legacy free-% book placements into ordered one-book stacks.
 * @example migrateLegacyViewport(placements, 2) // ShelfViewportLayout
 */
function migrateLegacyViewport(placements: unknown[], rowCount: number): ShelfViewportLayout {
  const planks = createEmptyPlanks(rowCount);
  type Legacy = { bookId: string; orientation: BookOrientation; xPercent: number; rowIndex: number };
  const placed: Legacy[] = [];

  placements.forEach((raw, index) => {
    const row = asRecord(raw);
    const bookId = str(row.bookId, `book-${index + 1}`);
    const x = typeof row.xPercent === "number" ? row.xPercent : Number(row.xPercent);
    const y = typeof row.yPercent === "number" ? row.yPercent : Number(row.yPercent);
    if (!bookId || !Number.isFinite(x) || !Number.isFinite(y)) return;
    const orientationRaw = str(row.orientation, "vertical");
    const orientation: BookOrientation = isBookOrientation(orientationRaw)
      ? orientationRaw
      : orientationRaw === "horizontal"
        ? "horizontal"
        : "vertical";
    const rowRaw = typeof row.rowIndex === "number" ? row.rowIndex : Number(row.rowIndex);
    const rowIndex = Number.isFinite(rowRaw)
      ? Math.min(planks.length - 1, Math.max(0, Math.trunc(rowRaw)))
      : 0;
    placed.push({ bookId, orientation, xPercent: x, rowIndex });
  });

  placed.sort((a, b) => a.rowIndex - b.rowIndex || a.xPercent - b.xPercent);
  const seen = new Set<string>();
  let seq = 0;
  for (const entry of placed) {
    if (seen.has(entry.bookId)) continue;
    seen.add(entry.bookId);
    const plank = planks[entry.rowIndex] ?? planks[planks.length - 1];
    if (!plank) continue;
    seq += 1;
    plank.items.push({
      id: `migrated-${seq}`,
      type: "book-stack",
      bookIds: [entry.bookId],
      orientation: entry.orientation,
    });
  }
  return { planks, decor: [] };
}
/**
 * Parses CMS shelf layout JSON (new plank shape or legacy free-% arrays).
 * @example parseShelfLayout({desktop:{planks:[]}}) // ShelfLayout
 */
export function parseShelfLayout(value: unknown): ShelfLayout {
  if (!value || typeof value !== "object") {
    return {
      desktop: emptyViewportLayout(2),
      mobile: emptyViewportLayout(2),
    };
  }
  const root = asRecord(value);
  const rowRaw = typeof root.rowCount === "number" ? root.rowCount : Number(root.rowCount);
  const rowCount = Number.isFinite(rowRaw) ? Math.min(6, Math.max(1, Math.trunc(rowRaw))) : 2;

  const desktopRaw = root.desktop;
  const mobileRaw = root.mobile;

  const desktopIsNew =
    desktopRaw !== null &&
    typeof desktopRaw === "object" &&
    !Array.isArray(desktopRaw) &&
    Array.isArray(asRecord(desktopRaw).planks);
  const mobileIsNew =
    mobileRaw !== null &&
    typeof mobileRaw === "object" &&
    !Array.isArray(mobileRaw) &&
    Array.isArray(asRecord(mobileRaw).planks);

  if (desktopIsNew || mobileIsNew) {
    return {
      desktop: desktopIsNew
        ? parseViewportLayout(desktopRaw, rowCount)
        : emptyViewportLayout(rowCount),
      mobile: mobileIsNew
        ? parseViewportLayout(mobileRaw, rowCount)
        : emptyViewportLayout(rowCount),
    };
  }

  // Legacy: desktop/mobile were ShelfBookPlacement[].
  const desktopArr = Array.isArray(desktopRaw) ? desktopRaw : [];
  const mobileArr = Array.isArray(mobileRaw) ? mobileRaw : [];
  return {
    desktop: migrateLegacyViewport(desktopArr, rowCount),
    mobile: migrateLegacyViewport(mobileArr, rowCount),
  };
}
