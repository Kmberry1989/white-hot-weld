import type { SocialLink } from "../types/ui";

export interface SiteContactInfo {
  email?: string;
  instagram?: string;
  location?: string;
  serviceArea?: string;
  responseTime?: string;
  commissionLeadTime?: string;
}

export interface SiteConfig {
  name: string;
  title: string;
  description: string;
  siteUrl?: string;
  defaultOgImage: string;
  contact: SiteContactInfo;
}

export const siteConfig: SiteConfig = {
  name: "White Hot Weld",
  title: "White Hot Weld | Married Metal Art",
  description: "Married metal art shaped with warmth, intention, and precision.",
  siteUrl: undefined,
  defaultOgImage: "/images/branding/whitehotweld.png",
  contact: {
    email: undefined,
    instagram: undefined,
    location: "Kokomo, IN",
    serviceArea: "Available for original pieces and commission inquiries across the U.S.",
    responseTime: "Expect a personal reply within 2-3 business days.",
    commissionLeadTime: "Most custom projects are scoped with lead times starting around 4-8 weeks."
  }
};

export function getSocialLinks(): SocialLink[] {
  const links: SocialLink[] = [];

  if (siteConfig.contact.instagram) {
    links.push({ href: siteConfig.contact.instagram, label: "Instagram" });
  }

  if (siteConfig.contact.email) {
    links.push({ href: `mailto:${siteConfig.contact.email}`, label: "Email" });
  }

  return links;
}

export function absoluteUrl(pathname: string): string | undefined {
  if (!siteConfig.siteUrl) {
    return undefined;
  }

  return new URL(pathname, siteConfig.siteUrl).toString();
}
