import { prisma } from "@/lib/db";
import { queryStorefrontProducts } from "@/lib/catalog/queries";
import { mapDbProduct, type Product, type ProductWithId } from "@/lib/product-types";
import { getStaticProductBySlug, staticProducts } from "@/lib/products-static";

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

function staticAsProductWithId(p: (typeof staticProducts)[number], index: number): ProductWithId {
  return {
    ...mapStatic(p),
    id: `static-${p.slug}`,
    published: true,
    sortOrder: index,
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

export async function getAllProductsAdmin(): Promise<ProductWithId[]> {
  if (!process.env.DATABASE_URL) {
    return staticProducts.map(staticAsProductWithId);
  }

  try {
    const rows = await prisma.product.findMany({
      include: { images: true },
      orderBy: [{ sortOrder: "asc" }, { diameterCm: "asc" }],
    });

    if (rows.length === 0) {
      return staticProducts.map(staticAsProductWithId);
    }

    return rows.map(mapDbProduct);
  } catch {
    return staticProducts.map(staticAsProductWithId);
  }
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  // The catalog is small; resolving from the flattened list keeps variant
  // slugs and legacy per-size slugs on one code path.
  const products = await getPublishedProducts();
  return products.find((p) => p.slug === slug);
}

export async function getProductByIdAdmin(id: string): Promise<ProductWithId | null> {
  if (!process.env.DATABASE_URL || id.startsWith("static-")) {
    const slug = id.replace(/^static-/, "");
    const p = getStaticProductBySlug(slug);
    return p ? staticAsProductWithId(p, 0) : null;
  }

  try {
    const row = await prisma.product.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!row) {
      const slug = id.replace(/^static-/, "");
      const p = getStaticProductBySlug(slug);
      return p ? staticAsProductWithId(p, 0) : null;
    }

    return mapDbProduct(row);
  } catch {
    const slug = id.replace(/^static-/, "");
    const p = getStaticProductBySlug(slug);
    return p ? staticAsProductWithId(p, 0) : null;
  }
}

export async function getAllProductSlugs(): Promise<string[]> {
  return (await getPublishedProducts()).map((p) => p.slug);
}
