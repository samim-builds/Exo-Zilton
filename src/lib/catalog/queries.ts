import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { Product } from "@/lib/product-types";
import { toStorefrontProducts, type CatalogProductInput } from "./storefront";

const catalogInclude = {
  images: true,
  variants: { include: { optionValues: { include: { optionValue: true } } } },
} satisfies Prisma.ProductInclude;

type CatalogRow = Prisma.ProductGetPayload<{ include: typeof catalogInclude }>;

function toInput(row: CatalogRow): CatalogProductInput {
  return {
    ...row,
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
 * Active storefront products, flattened to one entry per variant. Rows that
 * predate variants are included only while their legacy `published` flag is set.
 */
export async function queryStorefrontProducts(): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      kind: "STANDARD",
      OR: [{ variants: { some: { active: true } } }, { published: true }],
    },
    include: catalogInclude,
    orderBy: [{ sortOrder: "asc" }, { diameterCm: "asc" }, { createdAt: "asc" }],
  });
  return toStorefrontProducts(rows.map(toInput));
}
