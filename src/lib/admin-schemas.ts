import { z } from "zod";

export const productImageSchema = z.object({
  url: z.string().min(1),
  alt: z.string().min(1),
  sortOrder: z.number().int().min(0).default(0),
});

export const productSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
  sku: z.string().min(2),
  size: z.string().min(1),
  diameterCm: z.number().positive(),
  capacityMl: z.number().int().positive(),
  pricePKR: z.number().int().positive(),
  priceUSD: z.number().int().positive(),
  inStock: z.boolean(),
  published: z.boolean(),
  description: z.string().min(10),
  features: z.array(z.string().min(1)).min(1),
  specs: z.record(z.string(), z.string()),
  careInstructions: z.array(z.string().min(1)).min(1),
  deliveryInfo: z.string().min(5),
  sortOrder: z.number().int().min(0).default(0),
  images: z.array(productImageSchema).min(1),
});

export type ProductInput = z.infer<typeof productSchema>;

export const loginSchema = z.object({
  password: z.string().min(1),
});
