import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { CatalogProduct } from "@/lib/product-types";
import { toCatalogProducts, type CatalogProductInput } from "./storefront";

const catalogInclude = {
  images: true,
  category: { select: { slug: true, name: true } },
  options: { include: { values: true } },
  variants: { include: { optionValues: { select: { optionValueId: true } } } },
  bundleItems: {
    orderBy: { position: "asc" },
    include: { variant: { include: { product: { select: { name: true, slug: true, status: true } } } } },
  },
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
    bundle:
      row.kind === "BUNDLE"
        ? {
            mode: row.bundlePricingMode,
            discountPercent: row.bundleDiscountPercent,
            items: row.bundleItems.map((item) => ({
              quantity: item.quantity,
              variant: {
                ...item.variant,
                // A component whose product is archived or drafted can't be sold.
                active: item.variant.active && item.variant.product.status === "ACTIVE",
                productName: item.variant.product.name,
                productSlug: item.variant.product.slug,
              },
            })),
          }
        : null,
  };
}

/**
 * Active storefront products (and bundles) with their options and variants. Rows that
 * predate variants are included only while their legacy `published` flag is set.
 */
export async function queryCatalog(): Promise<CatalogProduct[]> {
  const rows = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
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
