import type { MouseEvent } from "react";
import Link from "next/link";
import type { SiteContent } from "@/content/types";
import { Logo } from "./Logo";
import { IconGitHub, IconLinkedIn, IconMail } from "./icons";
import { siteMap } from "@/lib/sitemap";

export function SiteFooter({
  site,
  onNavigate,
}: {
  site: SiteContent;
  onNavigate?: (e: MouseEvent<HTMLAnchorElement>, href: string) => void;
}) {
  const groups = siteMap(site);

  function onClick(e: MouseEvent<HTMLAnchorElement>, href: string) {
    onNavigate?.(e, href);
  }

  return (
    <footer className="site-footer border-t border-line">
      <div className="section-shell py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] lg:gap-10">
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
                  className="rounded-lg p-2 text-muted transition hover:bg-violet-500/10 hover:text-accent-hover"
                  aria-label="LinkedIn profile"
                >
                  <IconLinkedIn size={20} />
                </a>
              ) : null}
              {site.github ? (
                <a
                  href={site.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg p-2 text-muted transition hover:bg-violet-500/10 hover:text-accent-hover"
                  aria-label="GitHub profile"
                >
                  <IconGitHub size={20} />
                </a>
              ) : null}
              {site.email ? (
                <a
                  href={`mailto:${site.email}`}
                  className="rounded-lg p-2 text-muted transition hover:bg-violet-500/10 hover:text-accent-hover"
                  aria-label="Email contact"
                >
                  <IconMail size={20} />
                </a>
              ) : null}
            </div>
          </div>

          {groups.map((group) => (
            <div key={group.title}>
              <p className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-soft">{group.title}</p>
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
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
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
