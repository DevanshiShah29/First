"use client";

/** True when the element is on-screen and the tab is visible. */
export function createVisibilityGate(
  el: Element,
  onChange: (active: boolean) => void,
  options?: IntersectionObserverInit,
) {
  let inView = false;
  let pageVisible = typeof document === "undefined" ? true : !document.hidden;

  const emit = () => onChange(inView && pageVisible);

  const io = new IntersectionObserver(
    ([entry]) => {
      inView = Boolean(entry?.isIntersecting);
      emit();
    },
    { rootMargin: "80px 0px", threshold: 0.01, ...options },
  );
  io.observe(el);

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
