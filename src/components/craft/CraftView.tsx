import Link from "next/link";
import { displayFallback } from "@/content/display-fallback";
import { EMPTY_CRAFT, type CraftContent } from "@/content/types";
import { Fade } from "../Fade";
import { CraftIndex, type CraftIndexItem } from "./CraftIndex";

/**
 * Formats a zero-based index as a two-digit number.
 * @example pad(0) // "01"
 */
function pad(value: number) {
  return String(value + 1).padStart(2, "0");
}

/**
 * Renders the craft page body from CMS craft fields.
 * @example <CraftView craft={craft} />
 */
export function CraftView({
  craft = EMPTY_CRAFT,
  showFooterLinks = true,
  showAboutLink = true,
  showContactLink = true,
}: {
  craft?: CraftContent;
  showFooterLinks?: boolean;
  showAboutLink?: boolean;
  showContactLink?: boolean;
}) {
  const hasPageCopy = Boolean(craft.title.trim() || craft.intro.trim() || craft.kicker.trim());
  const hasGroups = craft.groups.length > 0;
  const noteCount = craft.groups.reduce((total, group) => total + group.items.length, 0);
  const indexItems: CraftIndexItem[] = craft.groups.map((group, gi) => ({
    id: `craft-group-${gi}`,
    label: displayFallback(group.title, "Untitled group"),
    count: group.items.length,
  }));

  const footerLinks =
    showFooterLinks && (showAboutLink || showContactLink) ? (
      <div className="section-shell pb-16 sm:pb-24">
        <div className="card-surface mt-8 rounded-2xl p-6 sm:p-8">
          <p className="max-w-2xl text-sm leading-7 text-muted">
            {showAboutLink ? (
              <>
                Want the product story instead?{" "}
                <Link href="/#about" className="underline underline-offset-4 hover:text-accent-text">
                  Read About
                </Link>
                {showContactLink ? (
                  <>
                    {" "}
                    or{" "}
                    <Link
                      href="/#contact"
                      className="underline underline-offset-4 hover:text-accent-text"
                    >
                      say hello
                    </Link>
                  </>
                ) : null}
                .
              </>
            ) : (
              <>
                Want to get in touch?{" "}
                <Link href="/#contact" className="underline underline-offset-4 hover:text-accent-text">
                  Say hello
                </Link>
                .
              </>
            )}
          </p>
        </div>
      </div>
    ) : null;

  if (!hasPageCopy && !hasGroups) {
    return (
      <article>
        <div className="craft-hero">
          <div className="section-shell relative z-10 py-16 sm:py-24">
            <h1 className="text-4xl font-semibold leading-flat text-foreground sm:text-5xl">Craft</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted">
              Nothing published here yet.
            </p>
          </div>
        </div>
        {footerLinks}
      </article>
    );
  }

  return (
    <article>
      <header className="craft-hero">
        <div className="section-shell relative z-10 py-16 sm:py-24">
          <Fade y={20}>
            <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-14">
              <div className="lg:col-span-7">
                {craft.kicker.trim() ? (
                  <p className="kicker flex items-center gap-3">
                    <span aria-hidden className="accent-underline h-px w-8" />
                    {craft.kicker}
                  </p>
                ) : null}
                {craft.title.trim() ? (
                  <h1 className="mt-5 text-4xl font-semibold leading-flat tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                    {craft.title}
                  </h1>
                ) : null}
              </div>

              {craft.intro.trim() || craft.footnote.trim() || hasGroups ? (
                <div className="mt-10 border-t border-line pt-8 lg:col-span-5 lg:mt-0 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
                  {craft.intro.trim() ? (
                    <p className="max-w-2xl text-base leading-8 text-muted">{craft.intro}</p>
                  ) : null}
                  {craft.footnote.trim() ? (
                    <p className="mt-6 max-w-2xl border-l-2 border-line pl-4 text-sm leading-7 text-muted-soft">
                      {craft.footnote}
                    </p>
                  ) : null}
                  {hasGroups ? (
                    <dl className="mt-8 flex flex-wrap gap-x-12 gap-y-6">
                      <div>
                        <dt className="text-2xs font-medium uppercase tracking-kicker-tight text-muted-soft">
                          Sections
                        </dt>
                        <dd className="mt-1 text-3xl font-semibold tabular-nums text-foreground">
                          {indexItems.length}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-2xs font-medium uppercase tracking-kicker-tight text-muted-soft">
                          Notes
                        </dt>
                        <dd className="mt-1 text-3xl font-semibold tabular-nums text-foreground">
                          {noteCount}
                        </dd>
                      </div>
                    </dl>
                  ) : null}
                </div>
              ) : null}
            </div>
          </Fade>
        </div>
      </header>

      {hasGroups ? (
        <div className="section-shell py-16 sm:py-20">
          <div className="lg:grid lg:grid-cols-12 lg:gap-14">
            <aside className="hidden lg:col-span-3 lg:block">
              <CraftIndex items={indexItems} />
            </aside>

            <div className="space-y-16 sm:space-y-20 lg:col-span-9">
              {craft.groups.map((group, gi) => {
                const groupTitle = displayFallback(group.title, "Untitled group");
                const groupId = `craft-group-${gi}`;
                return (
                  <section
                    key={`${groupTitle}-${gi}`}
                    id={groupId}
                    aria-labelledby={`${groupId}-heading`}
                    className="scroll-mt-28 border-t border-line pt-10 first:border-t-0 first:pt-0"
                  >
                    <Fade y={20}>
                      <div className="flex items-start justify-between gap-6">
                        <div>
                          <span
                            aria-hidden
                            className="craft-numeral block text-5xl font-semibold leading-none sm:text-6xl"
                          >
                            {pad(gi)}
                          </span>
                          <h2
                            id={`${groupId}-heading`}
                            className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
                          >
                            {groupTitle}
                          </h2>
                        </div>
                        <span className="shrink-0 pt-2 text-2xs font-medium uppercase tracking-kicker-tight text-muted-soft">
                          {group.items.length} {group.items.length === 1 ? "note" : "notes"}
                        </span>
                      </div>
                      <div aria-hidden className="accent-underline mt-4 h-1 w-20 rounded" />
                      {group.intro.trim() ? (
                        <p className="mt-5 max-w-2xl leading-8 text-muted">{group.intro}</p>
                      ) : null}
                    </Fade>

                    {group.items.length > 0 ? (
                      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                        {group.items.map((item, ii) => (
                          <li key={`${item.title}-${ii}`} className="h-full">
                            <Fade y={16} delay={Math.min(ii, 4) * 0.05} className="h-full">
                              <article className="card-surface card-lift h-full rounded-2xl p-5 sm:p-6">
                                <div className="flex items-center gap-3">
                                  <span
                                    aria-hidden
                                    className="craft-numeral text-sm font-semibold"
                                  >
                                    {pad(ii)}
                                  </span>
                                  <span aria-hidden className="craft-item-line flex-1" />
                                </div>
                                <h3 className="mt-4 text-lg font-semibold text-foreground">
                                  {displayFallback(item.title, "Untitled")}
                                </h3>
                                {item.why.trim() ? (
                                  <p className="mt-2 text-sm leading-7 text-muted">{item.why}</p>
                                ) : null}
                              </article>
                            </Fade>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {footerLinks}
    </article>
  );
}
