import { queryStorefrontProducts } from "@/lib/catalog/queries";
import type { Product } from "@/lib/product-types";
import { staticProducts } from "@/lib/products-static";

function mapStatic(p: (typeof staticProducts)[number]): Product {
  return {
    slug: p.slug,
    name: p.name,
    sku: p.sku,
    size: p.size,
    diameterCm: p.diameterCm,
    capacityMl: p.capacityMl,
    pricePKR: p.pricePKR,
    priceUSD: p.priceUSD,
    inStock: p.inStock,
    images: p.images,
    imageAlts: p.images.map((url) => ({
      url,
      alt: `${p.name} — Exo Zilton porcelain mortar and pestle`,
    })),
    features: p.features,
    specs: p.specs,
    description: p.description,
    careInstructions: p.careInstructions,
    deliveryInfo: p.deliveryInfo,
  };
}

export async function getPublishedProducts(): Promise<Product[]> {
  if (!process.env.DATABASE_URL) {
    return staticProducts.map(mapStatic);
  }

  try {
    const products = await queryStorefrontProducts();
    return products.length > 0 ? products : staticProducts.map(mapStatic);
  } catch {
    return staticProducts.map(mapStatic);
  }
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  // The catalog is small; resolving from the flattened list keeps variant
  // slugs and legacy per-size slugs on one code path.
  const products = await getPublishedProducts();
  return products.find((p) => p.slug === slug);
}

export async function getAllProductSlugs(): Promise<string[]> {
  return (await getPublishedProducts()).map((p) => p.slug);
}
