import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { CatalogProduct } from "@/lib/product-types";
import { toCatalogProducts, type CatalogProductInput } from "./storefront";

const catalogInclude = {
  images: true,
  category: { select: { slug: true, name: true } },
  options: { include: { values: true } },
  variants: { include: { optionValues: { select: { optionValueId: true } } } },
} satisfies Prisma.ProductInclude;

type CatalogRow = Prisma.ProductGetPayload<{ include: typeof catalogInclude }>;

function toInput(row: CatalogRow): CatalogProductInput {
  return {
    ...row,
    variants: row.variants.map((v) => ({ ...v, optionValueIds: v.optionValues.map((o) => o.optionValueId) })),
    legacy: {
      sku: row.sku,
      size: row.size,
      diameterCm: row.diameterCm,
      capacityMl: row.capacityMl,
      pricePKR: row.pricePKR,
      priceUSD: row.priceUSD,
      inStock: row.inStock,
    },
  };
}

/**
 * Active storefront products with their options and variants. Rows that
 * predate variants are included only while their legacy `published` flag is set.
 */
export async function queryCatalog(): Promise<CatalogProduct[]> {
  const rows = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      kind: "STANDARD",
      OR: [{ variants: { some: { active: true } } }, { published: true }],
    },
    include: catalogInclude,
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { diameterCm: "asc" }, { createdAt: "asc" }],
  });
  return toCatalogProducts(rows.map(toInput));
}

export type StorefrontCategory = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
};

export async function queryCategories(): Promise<StorefrontCategory[]> {
  return prisma.category.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      imageUrl: true,
      parentId: true,
      seoTitle: true,
      seoDescription: true,
    },
  });
}
