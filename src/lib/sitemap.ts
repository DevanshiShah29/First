import type { CraftContent, PublicSiteContent, SiteContent } from "@/content/types";

export type SiteLink = {
  href: string;
  label: string;
  external?: boolean;
};

export type SiteMapGroup = {
  title: string;
  links: SiteLink[];
};

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
    { href: "/reading", label: "Reading" },
    { href: "/memories", label: "Memory Jar" },
  ];
  const craftPublished = Boolean(
    craft?.title?.trim() || craft?.intro?.trim() || (craft?.groups?.length ?? 0) > 0,
  );
  if (craftPublished) {
    explore.push({ href: "/craft", label: craft?.title?.trim() || "Craft" });
  }

  return [
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
}
