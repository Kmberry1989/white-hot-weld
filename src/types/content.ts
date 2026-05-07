import type { ImageMetadata } from "astro";
import type { CollectionEntry } from "astro:content";

export type PageSlug = "home" | "about" | "gallery" | "contact";
export type PageEntry = CollectionEntry<"pages">;
export type WorkEntry = CollectionEntry<"work">;

export type WorkStatus = "available" | "sold" | "commissioned";

export interface WorkItem {
  entry: WorkEntry;
  slug: string;
  title: string;
  excerpt: string;
  year: number;
  materials: string;
  medium?: string;
  dimensions: string;
  widthInches?: number;
  heightInches?: number;
  depthInches?: number;
  price?: string;
  stripePaymentLink?: string;
  featured: boolean;
  status?: WorkStatus;
  coverImage: ImageMetadata;
  galleryImages: ImageMetadata[];
  storeImages: string[];
  model3dSrc?: string;
  maker?: string;
  aboutItem?: string;
  showFullDescriptionLabel?: string;
  shippingPolicyTitle?: string;
  shippingEstimate?: string;
  shippingWindow?: string;
  shippingCost?: string;
  shipsFrom?: string;
}

export interface ParsedPerson {
  name: string;
  role: string;
  bio: string;
}
