import type { ImageMetadata } from "astro";
import { getCollection, getEntry } from "astro:content";
import type { PageEntry, PageSlug, WorkEntry, WorkItem } from "../types/content";

const workImageLoaders = import.meta.glob<{ default: ImageMetadata }>(
  "../assets/work/*.{png,jpg,jpeg,webp,avif}"
);

function sortByYearDescending(a: WorkEntry, b: WorkEntry): number {
  return b.data.year - a.data.year;
}

function imageLookupPath(fileName: string): string {
  const cleanName = fileName.replace(/^\/+/, "");
  return `../assets/work/${cleanName}`;
}

async function resolveImage(fileName: string): Promise<ImageMetadata> {
  const path = imageLookupPath(fileName);
  const loader = workImageLoaders[path];

  if (!loader) {
    throw new Error(`Missing image asset: ${fileName}. Expected ${path}`);
  }

  const module = await loader();
  return module.default;
}

async function toWorkItem(entry: WorkEntry): Promise<WorkItem> {
  return {
    entry,
    slug: entry.slug,
    title: entry.data.title,
    excerpt: entry.data.excerpt,
    year: entry.data.year,
    materials: entry.data.materials,
    medium: entry.data.medium,
    dimensions: entry.data.dimensions,
    widthInches: entry.data.widthInches,
    heightInches: entry.data.heightInches,
    depthInches: entry.data.depthInches,
    price: entry.data.price,
    stripePaymentLink: entry.data.stripePaymentLink,
    featured: entry.data.featured,
    status: entry.data.status,
    coverImage: await resolveImage(entry.data.coverImage),
    galleryImages: await Promise.all((entry.data.galleryImages ?? []).map(resolveImage)),
    storeImages: entry.data.storeImages ?? [],
    model3dSrc: entry.data.model3dSrc,
    maker: entry.data.maker,
    aboutItem: entry.data.aboutItem,
    showFullDescriptionLabel: entry.data.showFullDescriptionLabel,
    shippingPolicyTitle: entry.data.shippingPolicyTitle,
    shippingEstimate: entry.data.shippingEstimate,
    shippingWindow: entry.data.shippingWindow,
    shippingCost: entry.data.shippingCost,
    shipsFrom: entry.data.shipsFrom
  };
}

export async function getPageContent(slug: PageSlug): Promise<PageEntry> {
  const page = await getEntry("pages", slug);

  if (!page) {
    throw new Error(`Missing page content for slug: ${slug}`);
  }

  return page;
}

export async function getAllWork(): Promise<WorkItem[]> {
  const work = await getCollection("work");
  const sorted = work.sort(sortByYearDescending);
  return Promise.all(sorted.map(toWorkItem));
}

export async function getFeaturedWork(limit = 3): Promise<WorkItem[]> {
  const work = await getAllWork();
  return work.filter((item) => item.featured).slice(0, limit);
}

export async function getWorkBySlug(slug: string): Promise<WorkItem | undefined> {
  const work = await getAllWork();
  return work.find((item) => item.slug === slug);
}
