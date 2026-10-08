/**
 * Document Y of an element. getBoundingClientRect stays correct when an
 * ancestor uses transform, which breaks the offsetParent walk.
 * @example documentTop(sectionEl) // 840
 */
export function documentTop(el: HTMLElement) {
  return el.getBoundingClientRect().top + window.scrollY;
}

/**
 * Content start inside a homepage section. Section padding is the gap
 * between sections; the nav should land on the heading, not that gap.
 * @example contentStart(aboutSection) // the .section-shell
 */
function contentStart(el: HTMLElement) {
  if (el.tagName !== "SECTION") return el;
  const shell = el.querySelector(":scope > .section-shell");
  return shell instanceof HTMLElement ? shell : el;
}

/**
 * Smooth-scrolls to a hash target under the sticky header.
 * @example scrollToHash("#projects") // void
 */
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
    top: Math.max(0, documentTop(contentStart(el)) - offset),
    behavior: instant ? "auto" : "smooth",
  });
}
