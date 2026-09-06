"use client";

/**
 * Watches element + tab visibility and reports when both are active.
 * @example createVisibilityGate(el, onChange) // cleanup
 */
export function createVisibilityGate(
  el: Element,
  onChange: (active: boolean) => void,
  options?: IntersectionObserverInit,
) {
  let inView = false;
  let pageVisible = typeof document === "undefined" ? true : !document.hidden;

  /**
   * Notifies when the element is in view and the tab is visible.
   * @example emit() // void
   */
  const emit = () => onChange(inView && pageVisible);

  const io = new IntersectionObserver(
    ([entry]) => {
      inView = Boolean(entry?.isIntersecting);
      emit();
    },
    { rootMargin: "80px 0px", threshold: 0.01, ...options },
  );
  io.observe(el);

  /**
   * Syncs pageVisible from document.hidden.
   * @example onVis() // void
   */
  const onVis = () => {
    pageVisible = !document.hidden;
    emit();
  };
  document.addEventListener("visibilitychange", onVis);

  emit();

  return () => {
    io.disconnect();
    document.removeEventListener("visibilitychange", onVis);
  };
}
