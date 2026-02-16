import type { ImageMetadata } from "astro";

export type ContainerSize = "narrow" | "base" | "wide";

export interface NavItem {
  href: string;
  label: string;
}

export interface SocialLink {
  href: string;
  label: string;
}

export interface CtaLink {
  href: string;
  label: string;
}

export interface HeroMedia {
  src: string;
  alt: string;
}

export interface CuratedImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface Person {
  name: string;
  role: string;
  bio: string;
}

export interface WorkSummary {
  slug: string;
  title: string;
  excerpt: string;
  year: number;
  materials: string;
  medium?: string;
  dimensions: string;
  price?: string;
  coverImage: ImageMetadata;
  storeImages?: string[];
  model3dSrc?: string;
}
