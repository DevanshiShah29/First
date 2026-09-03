export function sectionTop(el: HTMLElement) {
  let y = 0;
  let node: HTMLElement | null = el;
  while (node) {
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return y;
}

export function scrollToHash(hash: string, instant = false) {
  if (typeof window === "undefined") return;
  if (hash === "#top" || hash === "#") {
    const main = document.getElementById("main-content");
    main?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: instant ? "auto" : "smooth" });
    return;
  }
  const el = document.getElementById(hash.replace(/^#/, ""));
  if (!el) return;
  if (!el.hasAttribute("tabindex")) el.tabIndex = -1;
  el.focus({ preventScroll: true });
  const header = document.getElementById("site-header");
  const offset = (header?.getBoundingClientRect().height ?? 72) + 12;
  window.scrollTo({
    top: Math.max(0, sectionTop(el) - offset),
    behavior: instant ? "auto" : "smooth",
  });
}
