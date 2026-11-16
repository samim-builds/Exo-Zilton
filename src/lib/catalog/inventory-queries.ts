import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export type InventoryRow = {
  id: string;
  productId: string;
  productName: string;
  title: string;
  sku: string;
  image: string | null;
  trackInventory: boolean;
  stockQty: number;
  lowStockThreshold: number;
  active: boolean;
};

export type StockFilter = "low" | "out" | "tracked" | "untracked";

const lowStock = (): Prisma.ProductVariantWhereInput => ({
  trackInventory: true,
  stockQty: { lte: prisma.productVariant.fields.lowStockThreshold },
});

function stockWhere(filters: string[]): Prisma.ProductVariantWhereInput[] {
  return filters.flatMap((f): Prisma.ProductVariantWhereInput[] => {
    switch (f) {
      case "low":
        return [lowStock()];
      case "out":
        return [{ trackInventory: true, stockQty: { lte: 0 } }];
      case "tracked":
        return [{ trackInventory: true }];
      case "untracked":
        return [{ trackInventory: false }];
      default:
        return [];
    }
  });
}

export async function listInventory(args: {
  q: string;
  stock?: string[];
  sort: { id: "stockQty" | "product"; desc: boolean };
  skip: number;
  take: number;
}): Promise<{ rows: InventoryRow[]; total: number }> {
  const stockFilters = stockWhere(args.stock ?? []);
  const where: Prisma.ProductVariantWhereInput = {
    // Legacy per-size products were archived in the catalog conversion. Bundles
    // hold no stock of their own, so they are left out.
    product: { status: { not: "ARCHIVED" }, kind: "STANDARD" },
    AND: [
      args.q
        ? {
            OR: [
              { sku: { contains: args.q, mode: "insensitive" } },
              { title: { contains: args.q, mode: "insensitive" } },
              { product: { name: { contains: args.q, mode: "insensitive" } } },
            ],
          }
        : {},
      stockFilters.length > 0 ? { OR: stockFilters } : {},
    ],
  };
  const dir = args.sort.desc ? "desc" : "asc";
  const orderBy: Prisma.ProductVariantOrderByWithRelationInput[] =
    args.sort.id === "stockQty" ? [{ stockQty: dir }, { sku: "asc" }] : [{ product: { name: dir } }, { position: "asc" }];

  const [rows, total] = await Promise.all([
    prisma.productVariant.findMany({
      where,
      orderBy,
      skip: args.skip,
      take: args.take,
      include: {
        product: { select: { id: true, name: true, images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } } } },
        images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
      },
    }),
    prisma.productVariant.count({ where }),
  ]);

  return {
    total,
    rows: rows.map((v) => ({
      id: v.id,
      productId: v.product.id,
      productName: v.product.name,
      title: v.title,
      sku: v.sku,
      image: v.images[0]?.url ?? v.product.images[0]?.url ?? null,
      trackInventory: v.trackInventory,
      stockQty: v.stockQty,
      lowStockThreshold: v.lowStockThreshold,
      active: v.active,
    })),
  };
}

export type MovementRow = { id: string; delta: number; balance: number; reason: string; note: string | null; orderId: string | null; createdAt: string };

export async function listMovements(variantId: string, take = 50): Promise<MovementRow[]> {
  const rows = await prisma.inventoryMovement.findMany({ where: { variantId }, orderBy: { createdAt: "desc" }, take });
  return rows.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }));
}

/** Tracked, active variants at or below their threshold, lowest first (dashboard card). */
export async function listLowStock(take = 6) {
  const where: Prisma.ProductVariantWhereInput = { ...lowStock(), active: true, product: { status: "ACTIVE" } };
  const [rows, total] = await Promise.all([
    prisma.productVariant.findMany({
      where,
      orderBy: { stockQty: "asc" },
      take,
      select: { id: true, sku: true, title: true, stockQty: true, lowStockThreshold: true, product: { select: { name: true } } },
    }),
    prisma.productVariant.count({ where }),
  ]);
  return { rows, total };
}
