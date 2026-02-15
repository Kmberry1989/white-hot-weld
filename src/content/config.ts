import { defineCollection, z } from "astro:content";

const pages = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    eyebrow: z.string().optional(),
    hero: z
      .object({
        title: z.string(),
        subtitle: z.string(),
        primaryCtaLabel: z.string(),
        primaryCtaHref: z.string(),
        secondaryCtaLabel: z.string().optional(),
        secondaryCtaHref: z.string().optional(),
        mediaSrc: z.string().optional(),
        mediaAlt: z.string().optional()
      })
      .optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional()
  })
});

const work = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    year: z.number(),
    materials: z.string(),
    dimensions: z.string(),
    excerpt: z.string(),
    featured: z.boolean(),
    coverImage: z.string(),
    galleryImages: z.array(z.string()).optional(),
    status: z.enum(["available", "sold", "commissioned"]).optional()
  })
});

export const collections = {
  pages,
  work
};
