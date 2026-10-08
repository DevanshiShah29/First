import Link from "next/link";
import { EMPTY_CRAFT, type CraftContent } from "@/content/types";

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

  return (
    <article className="section-shell py-16 sm:py-24">
      {hasPageCopy || hasGroups ? (
        <>
          {craft.kicker.trim() ? <p className="kicker">{craft.kicker}</p> : null}
          {craft.title.trim() ? (
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold text-foreground sm:text-5xl">
              {craft.title}
            </h1>
          ) : null}
          {craft.intro.trim() ? (
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted">{craft.intro}</p>
          ) : null}
          {craft.footnote.trim() ? (
            <p className="mt-4 max-w-2xl text-sm text-muted-soft">{craft.footnote}</p>
          ) : null}

          {hasGroups ? (
            <div className="mt-14 space-y-14">
              {craft.groups.map((group) => (
                <section key={group.title} aria-labelledby={`craft-${group.title}`}>
                  <h2
                    id={`craft-${group.title}`}
                    className="text-2xl font-semibold text-foreground sm:text-3xl"
                  >
                    {group.title}
                  </h2>
                  <div className="accent-underline mt-3 h-1 w-24 rounded" />
                  {group.intro.trim() ? (
                    <p className="mt-4 max-w-2xl text-muted">{group.intro}</p>
                  ) : null}
                  <ul className="mt-8 space-y-6">
                    {group.items.map((item) => (
                      <li
                        key={item.title}
                        className="card-surface rounded-2xl border border-line p-5 sm:p-6"
                      >
                        <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                        {item.why.trim() ? (
                          <p className="mt-2 text-sm leading-7 text-muted">{item.why}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <div>
          <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">Craft</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-muted">
            Nothing published here yet.
          </p>
        </div>
      )}

      {showFooterLinks && (showAboutLink || showContactLink) ? (
        <p className="mt-16 max-w-2xl text-sm text-muted">
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
                  <Link href="/#contact" className="underline underline-offset-4 hover:text-accent-text">
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
      ) : null}
    </article>
  );
}
