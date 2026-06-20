import type { Product as DbProduct, ProductImage } from "@/generated/prisma/client";

export type Product = {
  slug: string;
  name: string;
  sku: string;
  size: string;
  diameterCm: number;
  capacityMl: number;
  pricePKR: number;
  priceUSD: number;
  inStock: boolean;
  images: string[];
  imageAlts?: { url: string; alt: string }[];
  features: string[];
  specs: Record<string, string>;
  description: string;
  careInstructions: string[];
  deliveryInfo: string;
};

export type ProductWithId = Product & { id: string; published: boolean; sortOrder: number };

export function mapDbProduct(
  product: DbProduct & { images: ProductImage[] },
): ProductWithId {
  const sortedImages = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    sku: product.sku,
    size: product.size,
    diameterCm: product.diameterCm,
    capacityMl: product.capacityMl,
    pricePKR: product.pricePKR,
    priceUSD: product.priceUSD,
    inStock: product.inStock,
    published: product.published,
    sortOrder: product.sortOrder,
    images: sortedImages.map((img) => img.url),
    imageAlts: sortedImages.map((img) => ({ url: img.url, alt: img.alt })),
    features: product.features,
    specs: product.specs as Record<string, string>,
    description: product.description,
    careInstructions: product.careInstructions,
    deliveryInfo: product.deliveryInfo,
  };
}
