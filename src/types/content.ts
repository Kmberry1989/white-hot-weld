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
  dimensions: string;
  featured: boolean;
  status?: WorkStatus;
  coverImage: ImageMetadata;
  galleryImages: ImageMetadata[];
}

export interface ParsedPerson {
  name: string;
  role: string;
  bio: string;
}
