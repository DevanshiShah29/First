"use client";

import { SHELF_STACK_MAX_BOOKS, type ShelfArtifactItem, type ShelfLayout } from "@/content/types";
import { plankContentWidthRem } from "./shelfFootprint";
import { addPlank, patchDecor, patchItem, removeItem, removePlank } from "./shelfBuilderOps";
import { ORIENTATION_META } from "./shelfPlacementShared";
import { useShelfPlacementEditor } from "./useShelfPlacementEditor";
import { ItemInspector } from "./ItemInspector";
import { SpacerInspector } from "./SpacerInspector";
import { DecorInspector } from "./DecorInspector";
import { EditorDecorItem } from "./EditorDecorItem";
import { EditorItem } from "./EditorItem";
import { BookPickerModal } from "./BookPickerModal";
import { DecorPickerModal } from "./DecorPickerModal";
import { ConfirmButton } from "../components/ConfirmDialog";

/**
 * CMS Shelf Builder: plank stacks + White Space, free-placed resizable decor.
 * @example <ShelfPlacementEditor artifacts={…} shelfLayout={…} … />
 */
export function ShelfPlacementEditor({
  artifacts,
  onChangeArtifacts,
  shelfLayout,
  onChangeLayout,
}: {
  artifacts: ShelfArtifactItem[];
  onChangeArtifacts: (next: ShelfArtifactItem[]) => void;
  shelfLayout: ShelfLayout;
  onChangeLayout: (next: ShelfLayout) => void;
}) {
  const {
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
  } = useShelfPlacementEditor({
    artifacts,
    onChangeArtifacts,
    shelfLayout,
    onChangeLayout,
  });

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
                                    <ConfirmButton
                                      className="wp-btn wp-btn-small"
                                      disabled={view.planks.length <= 1}
                                      title={`Remove plank ${plankIndex + 1}?`}
                                      message="Books and gaps on this plank come off the shelf. Save to update the live site."
                                      confirmLabel="Remove plank"
                                      onConfirm={() => {
                                        commitView(
                                          removePlank(view, plankIndex),
                                        );
                                        setSelected(null);
                                      }}>
                                      Remove
                                    </ConfirmButton>
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
          {loadError} Import your Goodreads library under Book Nook to load books.
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
