import type { MouseEvent } from "react";
import Link from "next/link";
import type { PublicSiteContent, SiteContent } from "@/content/types";
import { NewTabHint } from "./a11y";
import { Fade } from "./Fade";
import { Logo } from "./Logo";
import { IconGitHub, IconLinkedIn, IconMail } from "./icons";
import { siteMap } from "@/lib/sitemap";

export function SiteFooter({
  site,
  onNavigate,
}: {
  site: PublicSiteContent | SiteContent;
  onNavigate?: (e: MouseEvent<HTMLAnchorElement>, href: string) => void;
}) {
  const groups = siteMap(site);

  function onClick(e: MouseEvent<HTMLAnchorElement>, href: string) {
    onNavigate?.(e, href);
  }

  return (
    <footer className="site-footer border-t border-line">
      <div className="section-shell py-16 sm:py-20">
        <Fade y={20} duration={0.6}>
          <div className="footer-grid">
            <div>
            <Link href="/" className="inline-flex" onClick={(e) => onClick(e, "/")}>
              <Logo name={site.name} />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-muted">{site.contactLine || site.line}</p>
            <div className="mt-6 flex items-center gap-2">
              {site.linkedin ? (
                <a
                  href={site.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="icon-btn rounded-lg p-2 text-muted transition hover:bg-violet-500/10 hover:text-accent-hover"
                  aria-label="LinkedIn profile"
                >
                  <IconLinkedIn size={20} />
                  <NewTabHint />
                </a>
              ) : null}
              {site.github ? (
                <a
                  href={site.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="icon-btn rounded-lg p-2 text-muted transition hover:bg-violet-500/10 hover:text-accent-hover"
                  aria-label="GitHub profile"
                >
                  <IconGitHub size={20} />
                  <NewTabHint />
                </a>
              ) : null}
              {site.email ? (
                <a
                  href={`mailto:${site.email}`}
                  className="icon-btn rounded-lg p-2 text-muted transition hover:bg-violet-500/10 hover:text-accent-hover"
                  aria-label={`Email ${site.email}`}
                >
                  <IconMail size={20} />
                </a>
              ) : null}
            </div>
          </div>

          {groups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="text-2xs font-medium uppercase tracking-kicker-tight text-muted-soft">
                {group.title}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href + link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted transition hover:text-accent-hover"
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      onClick={link.external ? undefined : (e) => onClick(e, link.href)}
                    >
                      {link.label}
                      {link.external && link.href.startsWith("http") ? <NewTabHint /> : null}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </Fade>
    </div>
    <div className="border-t border-line py-6">
        <div className="section-shell flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-soft">
            © {new Date().getFullYear()} {site.name}
          </p>
          <p className="text-sm text-muted-soft">Built with Next.js</p>
        </div>
      </div>
    </footer>
  );
}
