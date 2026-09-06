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

  useEffect(() => {
    if (!active) {
      savedFocusForSession.current = false;
      return;
    }
    const root = dialogRef.current;
    if (!root) return;
    const node: HTMLElement = root;

    // Save the page focus only once per open session (not on each content swap).
    if (!savedFocusForSession.current) {
      previousFocus.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      savedFocusForSession.current = true;
    }

    /**
     * Focuses the first focusable control in the dialog.
     * @example focusFirst() // void
     */
    const focusFirst = () => {
      const list = focusableIn(node);
      list[0]?.focus();
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
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
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
    // Restore when the dialog fully closes (component unmount or active→false).
    previousFocus.current?.focus?.();
    previousFocus.current = null;
    savedFocusForSession.current = false;
  }, [active]);

  useEffect(() => {
    return () => {
      // Unmount while still active (RevealCard removed from tree).
      previousFocus.current?.focus?.();
    };
  }, []);

  return dialogRef;
}
