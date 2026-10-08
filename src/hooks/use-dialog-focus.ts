"use client";

// External dependencies
import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * Visible, enabled focusable elements under a root.
 * @example focusableIn(dialog) // [button, input, …]
 */
function focusableIn(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
    (el) => !el.hasAttribute("disabled") && el.getClientRects().length > 0,
  );
}

/**
 * Moves focus without letting the browser scroll the viewport.
 * @example focusWithoutScroll(button) // void
 */
function focusWithoutScroll(el: HTMLElement | null | undefined) {
  if (!el?.isConnected) return;
  el.focus({ preventScroll: true });
}

/**
 * Puts the viewport back after a focus change tries to scroll it.
 * @example pinScroll(0, 480) // void
 */
function pinScroll(x: number, y: number) {
  window.scrollTo(x, y);
  requestAnimationFrame(() => window.scrollTo(x, y));
}

/**
 * Dialog focus trap, restore, and body-scroll lock.
 * @example useDialogFocus(true) // dialogRef
 */
export function useDialogFocus<T extends HTMLElement = HTMLElement>(
  active: boolean,
  resetKey?: string | number,
) {
  const dialogRef = useRef<T | null>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const savedFocusForSession = useRef(false);
  const scrollLock = useRef<{ x: number; y: number } | null>(null);

  /**
   * Returns focus and scroll to where the page was when the dialog opened.
   * @example restorePage() // void
   */
  function restorePage() {
    const scroll = scrollLock.current;
    const target = previousFocus.current;
    previousFocus.current = null;
    scrollLock.current = null;
    savedFocusForSession.current = false;
    focusWithoutScroll(target);
    if (scroll) pinScroll(scroll.x, scroll.y);
  }

  useEffect(() => {
    if (!active) {
      savedFocusForSession.current = false;
      return;
    }
    const root = dialogRef.current;
    if (!root) return;
    const node: HTMLElement = root;

    // Save the page focus and scroll only once per open session (not on each content swap).
    if (!savedFocusForSession.current) {
      previousFocus.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      scrollLock.current = { x: window.scrollX, y: window.scrollY };
      savedFocusForSession.current = true;
    }

    const heldScroll = scrollLock.current;

    /**
     * Focuses the first focusable control in the dialog.
     * @example focusFirst() // void
     */
    const focusFirst = () => {
      const list = focusableIn(node);
      focusWithoutScroll(list[0]);
      if (heldScroll) window.scrollTo(heldScroll.x, heldScroll.y);
    };
    // After paint so the dialog nodes exist and are focusable.
    const raf = requestAnimationFrame(focusFirst);

    /**
     * Traps Tab/Shift+Tab within the dialog.
     * @example onKeyDown(e) // void
     */
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const list = focusableIn(node);
      if (list.length === 0) {
        e.preventDefault();
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        focusWithoutScroll(last);
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        focusWithoutScroll(first);
      }
    }

    node.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      cancelAnimationFrame(raf);
      node.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [active, resetKey]);

  useEffect(() => {
    if (active) return;
    // Restore when the dialog fully closes (active→false while this hook stays mounted).
    restorePage();
  }, [active]);

  useEffect(() => {
    return () => {
      // Unmount while still active (RevealCard removed from tree).
      restorePage();
    };
  }, []);

  return dialogRef;
}
