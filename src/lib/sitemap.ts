import {
  isNavHrefEnabled,
  isPublished,
  type CraftContent,
  type PublicSiteContent,
  type SiteContent,
} from "@/content/types";

export type SiteLink = {
  href: string;
  label: string;
  external?: boolean;
};

export type SiteMapGroup = {
  title: string;
  links: SiteLink[];
};

/**
 * Footer/nav sitemap groups from site + optional craft content.
 * @example siteMap(site, craft) // [{ title, links }, …]
 */
export function siteMap(
  site: PublicSiteContent | SiteContent,
  craft?: CraftContent,
): SiteMapGroup[] {
  const connect: SiteLink[] = [{ href: "/#contact", label: "Contact" }];
  if (site.email) connect.push({ href: `mailto:${site.email}`, label: site.email, external: true });
  if (site.linkedin) connect.push({ href: site.linkedin, label: "LinkedIn", external: true });
  if (site.github) connect.push({ href: site.github, label: "GitHub", external: true });
  if (site.resume) connect.push({ href: site.resume, label: "Resume" });

  const explore: SiteLink[] = [
    { href: "/", label: "Home" },
    { href: "/reading", label: "Book Nook" },
    { href: "/memories", label: "Memories" },
  ];
  if (craft && isPublished(craft.status)) {
    explore.push({ href: "/craft", label: craft.title?.trim() || "Notes" });
  }

  const groups: SiteMapGroup[] = [
    {
      title: "Explore",
      links: explore,
    },
    {
      title: "Work",
      links: [
        { href: "/#about", label: "About" },
        { href: "/#experience", label: "Experience" },
        { href: "/#projects", label: "Projects" },
        { href: "/#skills", label: "Skills" },
      ],
    },
    {
      title: "Connect",
      links: connect,
    },
  ];

  return groups
    .map((group) => ({
      ...group,
      links: group.links.filter((link) => isNavHrefEnabled(link.href, site.sections)),
    }))
    .filter((group) => group.links.length > 0);
}
