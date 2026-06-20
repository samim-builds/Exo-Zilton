import { prisma } from "@/lib/db";
import { mapDbProduct, type Product, type ProductWithId } from "@/lib/product-types";
import {
  getAllStaticProductSlugs,
  getStaticProductBySlug,
  staticProducts,
} from "@/lib/products-static";

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
    const rows = await prisma.product.findMany({
      where: { published: true },
      include: { images: true },
      orderBy: [{ sortOrder: "asc" }, { diameterCm: "asc" }],
    });

    if (rows.length === 0) {
      return staticProducts.map(mapStatic);
    }

    return rows.map(mapDbProduct);
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
  if (!process.env.DATABASE_URL) {
    const p = getStaticProductBySlug(slug);
    return p ? mapStatic(p) : undefined;
  }

  try {
    const row = await prisma.product.findFirst({
      where: { slug, published: true },
      include: { images: true },
    });

    if (!row) {
      const fallback = getStaticProductBySlug(slug);
      return fallback ? mapStatic(fallback) : undefined;
    }

    return mapDbProduct(row);
  } catch {
    const fallback = getStaticProductBySlug(slug);
    return fallback ? mapStatic(fallback) : undefined;
  }
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
  if (!process.env.DATABASE_URL) {
    return getAllStaticProductSlugs();
  }

  try {
    const rows = await prisma.product.findMany({
      where: { published: true },
      select: { slug: true },
    });

    if (rows.length === 0) {
      return getAllStaticProductSlugs();
    }

    return rows.map((r) => r.slug);
  } catch {
    return getAllStaticProductSlugs();
  }
}
