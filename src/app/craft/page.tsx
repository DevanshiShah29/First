import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { loadContent } from "@/content/store";
import { EMPTY_CRAFT, toPublicContent } from "@/content/types";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const content = await loadContent();
  const craft = content.craft ?? EMPTY_CRAFT;
  const title = craft.title.trim() || "Craft";
  const description =
    craft.intro.trim() ||
    craft.footnote.trim() ||
    `Engineering notes from ${content.site.name}.`;
  return buildPageMetadata({
    title: `${title} | ${content.site.name}`,
    description,
    path: "/craft",
    siteName: content.site.name,
  });
}

export default async function CraftPage() {
  const content = toPublicContent(await loadContent());
  const craft = content.craft ?? EMPTY_CRAFT;
  const hasPageCopy = Boolean(craft.title.trim() || craft.intro.trim() || craft.kicker.trim());
  const hasGroups = craft.groups.length > 0;

  return (
    <PageShell content={content}>
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

        <p className="mt-16 max-w-2xl text-sm text-muted">
          Want the product story instead?{" "}
          <Link href="/#about" className="underline underline-offset-4 hover:text-accent-text">
            Read About
          </Link>{" "}
          or{" "}
          <Link href="/#contact" className="underline underline-offset-4 hover:text-accent-text">
            say hello
          </Link>
          .
        </p>
      </article>
    </PageShell>
  );
}
