import Link from "next/link";
import type { CraftContent, PublicSiteContent } from "@/content/types";
import { Fade } from "@/components/Fade";
import { CountUp } from "./CountUp";

export function AboutSection({
  site,
  craft,
}: {
  site: PublicSiteContent;
  craft?: CraftContent;
}) {
  const craftTitle = craft?.title?.trim();
  const craftPublished = Boolean(
    craftTitle || craft?.intro?.trim() || (craft?.groups?.length ?? 0) > 0,
  );

  return (
    <section id="about" tabIndex={-1} aria-labelledby="about-heading" className="py-16 sm:py-24">
      <div className="section-shell">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <Fade y={24}>
              <h2 id="about-heading" className="text-3xl font-semibold text-foreground sm:text-4xl">
                About Me
              </h2>
              <div className="accent-underline mt-3 h-1 w-24 rounded" />
              <p className="mt-6 text-base leading-8 text-muted">{site.about}</p>
              {craftPublished ? (
                <p className="mt-5 text-sm text-muted">
                  Curious how this site is engineered?{" "}
                  <Link
                    href="/craft"
                    className="font-medium text-accent-text underline underline-offset-4 hover:text-accent-hover"
                  >
                    {craftTitle || "Notes on craft"}
                  </Link>
                  .
                </p>
              ) : null}
            </Fade>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {site.stats.map((stat, i) => (
                <Fade key={stat.label} y={18} delay={0.08 * i}>
                  <div className="card-surface rounded-xl p-4">
                    <p className="text-2xl font-semibold text-foreground">
                      <CountUp value={stat.value} suffix={stat.suffix} />
                    </p>
                    <p className="mt-1 text-sm text-muted">{stat.label}</p>
                  </div>
                </Fade>
              ))}
            </div>
          </div>
          <Fade y={28} delay={0.12}>
            <div className="card-surface relative rounded-2xl p-8">
              <div className="philosophy-wash absolute inset-0 rounded-2xl" />
              <div className="relative">
                <p className="kicker text-muted-soft">{site.philosophyKicker}</p>
                <h3 className="mt-4 text-2xl font-semibold text-foreground">{site.philosophyTitle}</h3>
                <p className="mt-4 leading-7 text-muted">{site.philosophy}</p>
              </div>
            </div>
          </Fade>
        </div>
      </div>
    </section>
  );
}
