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
    medium: z.string().optional(),
    dimensions: z.string(),
    widthInches: z.number().optional(),
    heightInches: z.number().optional(),
    depthInches: z.number().optional(),
    price: z.string().optional(),
    excerpt: z.string(),
    featured: z.boolean(),
    coverImage: z.string(),
    galleryImages: z.array(z.string()).optional(),
    maker: z.string().optional(),
    aboutItem: z.string().optional(),
    showFullDescriptionLabel: z.string().optional(),
    shippingPolicyTitle: z.string().optional(),
    shippingEstimate: z.string().optional(),
    shippingCost: z.string().optional(),
    shipsFrom: z.string().optional(),
    status: z.enum(["available", "sold", "commissioned"]).optional()
  })
});

const media = defineCollection({
  type: "data",
  schema: z.array(
    z.object({
      id: z.string(),
      sourcePath: z.string(),
      destPath: z.string(),
      width: z.number(),
      height: z.number(),
      tier: z.enum(["primary", "editorial", "thumb", "archive"]),
      category: z.enum(["work", "people", "process", "display", "other"]),
      recommendedUse: z.string(),
      duplicateGroupId: z.string().optional(),
      hash: z.string()
    })
  )
});

export const collections = {
  pages,
  work,
  media
};
